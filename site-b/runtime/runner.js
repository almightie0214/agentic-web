// runner.js — the dependency-free agent execution loop.
// Changed by agentic-web. See README.md in this folder for what changed.

import { ChatMessageType, filterSlyData, allowedDownstreamSly, parseExternalAgent } from "./kernel.js";
import { actionContext, proposalRefs } from "./actions.js";
import { parseAgentResponse, agentPresentationContext, normalizePresentation, consolidateIntakePresentations } from "./cruse.js";
import { applyPendingSteering, runInterruptibleModelCall } from "./turn-control.js";
import { assertModelForRouter, effectiveModel } from "./model.js";
import { assertActive, scoped, createCallScope, bindContext } from "./scope.js";

let invocationSequence = 0;

export function argsToText(args) {
  if (args == null) return "";
  if (typeof args === "string") return args;
  if (args.request) return String(args.request);
  if (args.input) return String(args.input);
  if (args.input_string) return String(args.input_string);
  return JSON.stringify(args);
}

export function safeName(s) {
  return s.replace(/[^A-Za-z0-9_]/g, "_").replace(/^_+/, "").slice(0, 60) || "tool";
}

function hostOfUrl(url) {
  try { return new URL(url).host; } catch { return url; }
}

// Same-origin peers do not cross a visitor consent boundary.
export function requiresThirdPartyApproval(ref, baseOrigin) {
  try { return new URL(ref, baseOrigin).origin !== new URL(baseOrigin).origin; }
  catch { return true; }
}

export function consumeRemoteBudget(composition, targetKey, now = Date.now()) {
  if (!composition) return null;
  if (now >= composition.deadline) return "the composition deadline was reached";
  if (composition.remoteCalls >= composition.maxRemoteCalls) {
    return `the per-query limit of ${composition.maxRemoteCalls} third-party calls was reached`;
  }
  const prior = composition.peerCalls.get(targetKey) || 0;
  if (prior >= composition.maxCallsPerPeer) return `the per-peer limit of ${composition.maxCallsPerPeer} calls was reached`;
  composition.remoteCalls += 1;
  composition.peerCalls.set(targetKey, prior + 1);
  return null;
}

export function consumeAgentBudget(composition, now = Date.now()) {
  if (!composition) return null;
  if (now >= composition.deadline) return "the composition deadline was reached";
  if (composition.agentCalls >= composition.maxAgentCalls) {
    return `the per-query limit of ${composition.maxAgentCalls} agent invocations was reached`;
  }
  composition.agentCalls += 1;
  return null;
}

export function schemaFor(name, fn) {
  return {
    type: "function",
    function: {
      name,
      description: (fn && fn.description) || name,
      parameters: (fn && fn.parameters) || {
        type: "object",
        properties: { request: { type: "string", description: "The request to handle." } },
        required: ["request"],
      },
    },
  };
}

// Build the tool table + OpenAI-style schemas for one agent's `tools`.
export async function buildToolTable(ctx, spec) {
  const { network } = ctx;
  const toolByName = new Map();
  const toolSchemas = [];
  for (const ref of spec.tools || []) {
    const c = network.classifyTool(ref);
    if (c.kind === "missing") continue;

    if (c.kind === "remote") {
      // Do NOT contact the peer here. Advertise a generic schema and defer the
      // fetch-and-run (manifest + network definition) until the user consents at
      // call time — so consent truly precedes any contact with the partner origin.
      const name = safeName(parseExternalAgent(ref, ctx.baseOrigin).agentName);
      const label = ctx.network.linkLabels?.[ref] || name;
      toolByName.set(name, { kind: "remote", url: ref, label });
      toolSchemas.push(schemaFor(name, { description: `Hand off to the ${label} network. Provide a natural-language request.` }));
    } else if (c.kind === "link") {
      // A dangling HOCON reference remains callable. Resolution is deferred until
      // the model actually selects it, at which point the UI asks for a peer URL.
      const name = safeName(ref);
      toolByName.set(name, { kind: "link", reference: ref });
      toolSchemas.push(schemaFor(name, {
        description: `Hand off to the linked agent network "${ref}". If it is not linked yet, ask the developer for its nsDeploy site URL.`,
      }));
    } else {
      const name = safeName(c.ref);
      toolByName.set(name, c);
      toolSchemas.push(schemaFor(name, c.spec.function));
    }
  }
  // Publisher opt-in: expose selected local website actions as model tools.
  // Irreversible operations also require the host's confirmation callback.
  // Only the visitor's own site gets them. A partner network runs on this page, and a
  // partner's actions would reach this page's confirmation dialog.
  const callable = new Set(ctx.isTop ? ctx.manifest?.actions?.agentTools || [] : []);
  for (const action of ctx.actions?.catalog({ base: ctx.baseOrigin, network: network.name }) || []) {
    if (!callable.has(action.name) || action.availability !== "local-only"
      || (action.effect === "irreversible" && typeof ctx.confirmWebsiteActions !== "function")) continue;
    const name = `website_${action.name}`;
    if (toolByName.has(name)) throw new Error(`Duplicate website tool: ${name}`);
    toolByName.set(name, { kind: "website", ref: action.ref, parallelSafe: false });
    toolSchemas.push(schemaFor(name, { description: action.description, parameters: action.inputSchema }));
  }
  if (network.config?.cruse) {
    toolByName.set("render_cruse", { kind: "presentation", parallelSafe: false });
    toolSchemas.push(schemaFor("render_cruse", {
      description: "Create the CRUSE widgets for this response. Use this to show a consolidated form when several answers are needed, or a table, choice, report or other supported component. Widgets are preserved even if your final answer is plain text. This collects input or presents information; it does not execute website operations.",
      parameters: {
        type: "object", required: ["presentation"], additionalProperties: false,
        properties: {
          presentation: {
            type: "object", required: ["version", "components"], additionalProperties: false,
            properties: {
              version: { type: "integer", enum: [1] },
              components: { type: "array", minItems: 1, items: { type: "object" } },
            },
          },
        },
      },
    }));
  }
  return { toolByName, toolSchemas };
}

function entryAllowsParallel(entry) {
  if (!entry) return true;
  if (entry.parallelSafe === false || entry.spec?.parallel_safe === false || entry.spec?.execution?.parallel_safe === false) return false;
  return true;
}

function toolKind(entry) {
  if (!entry) return "unknown";
  return {
    agent: "agent",
    link: "linked network",
    remote: "remote network",
  }[entry.kind] || entry.kind;
}

function changed(a, b) {
  if (Object.is(a, b)) return false;
  try { return JSON.stringify(a) !== JSON.stringify(b); } catch { return true; }
}

// Execute sibling tool calls concurrently while preserving their model-visible
// result order. Each sibling receives a private sly_data snapshot; writes are
// merged back in call order so a faster tool cannot create nondeterministic state.
// A tool can opt out with parallel_safe=false.
export async function executeToolCalls(ctx, calls, parentSpan, chain, { maxConcurrency = 4 } = {}) {
  assertActive(ctx.signal);
  if (!calls.length) return [];
  if (!ctx.slyData) ctx.slyData = {};
  const initialSly = { ...(ctx.slyData || {}) };
  const concurrency = calls.every((call) => entryAllowsParallel(call.entry))
    ? Math.max(1, Math.min(maxConcurrency, calls.length))
    : 1;
  const results = new Array(calls.length);
  let next = 0;

  const worker = async () => {
    while (true) {
      assertActive(ctx.signal);
      const index = next++;
      if (index >= calls.length) return;
      const call = calls[index];
      const callCtx = { ...ctx, slyData: { ...initialSly } };
      const span = ctx.trace.start("tool", {
        parent: parentSpan,
        origin: ctx.displayOrigin,
        tool: call.name,
        callId: call.id,
        toolKind: toolKind(call.entry),
        args: call.args,
      });
      try {
        const raw = await dispatchToolCall(callCtx, call.entry || { kind: "unknown", ref: call.name }, call.args, span, chain);
        assertActive(ctx.signal);
        const encoded = typeof raw === "string" ? raw : JSON.stringify(raw);
        const content = encoded ?? String(raw ?? "");
        ctx.trace.end(span, { resultPreview: content.slice(0, 240) });
        results[index] = { ...call, status: "ok", content, slyData: callCtx.slyData };
      } catch (error) {
        const message = String(error?.message || error);
        const content = error?.receipt
          ? JSON.stringify({ ...error.receipt, diagnostic: message })
          : `Error from tool '${call.name}': ${message}`;
        ctx.trace.end(span, { status: "error", error: message, ...(error?.receipt ? { receipt: error.receipt } : {}), resultPreview: content.slice(0, 240) });
        results[index] = { ...call, status: "error", content, error, ...(error?.receipt ? { receipt: error.receipt } : {}), slyData: callCtx.slyData };
      }
    }
  };

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  assertActive(ctx.signal);
  for (const result of results) {
    for (const [key, value] of Object.entries(result.slyData || {})) {
      if (changed(initialSly[key], value)) ctx.slyData[key] = value;
    }
  }
  return results;
}

export async function dispatchToolCall(ctx, entry, args, parentSpan, chain) {
  const execution = {};
  try {
    return await scoped(ctx.signal, () => dispatchActiveToolCall(ctx, entry, args, parentSpan, chain, execution));
  } catch (cause) {
    if (execution.started && !cause.receipt) {
      const error = new Error(String(cause?.message || cause), { cause });
      error.name = cause.name;
      error.code = cause.code;
      error.receipt = { action: execution.action, requestId: execution.requestId, status: "unknown", error: error.message };
      throw error;
    }
    throw cause;
  }
}

async function dispatchActiveToolCall(ctx, entry, args, parentSpan, chain, execution) {
  assertActive(ctx.signal);

  if (entry.kind === "presentation") {
    if (!ctx.presentationOutput) throw new Error("No presentation output is available for this invocation.");
    const normalized = normalizePresentation(args.presentation, ctx.invocation);
    if (!normalized.presentation || normalized.issues.length) {
      throw new Error(normalized.issues.join(" ") || "Provide at least one valid CRUSE component.");
    }
    const result = { presentation: normalized.presentation };
    ctx.actions?.validatePresentation(result, ctx.allowedActionRefs || new Set());
    if (!result.presentation || result.presentationIssues?.length) {
      throw new Error(result.presentationIssues?.join(" ") || "Invalid CRUSE action binding.");
    }
    ctx.presentationOutput.presentation = result.presentation;
    return { status: "accepted", componentIds: result.presentation.components.map(c => c.id),
      message: "Widgets are attached to your response. Finish with a brief introduction; do not repeat the form questions in prose. This has not placed an order." };
  }

  if (entry.kind === "website") {
    const registered = ctx.actions.entries.get(entry.ref);
    if (!ctx.isTop || !registered || !ctx.manifest?.actions?.agentTools?.includes(registered.name)
      || registered.base !== ctx.baseOrigin || registered.network !== ctx.network.name
      || registered.availability !== "local-only"
      || (registered.effect === "irreversible" && typeof ctx.confirmWebsiteActions !== "function")) {
      throw new Error("Website action is not callable by this agent.");
    }
    const plan = ctx.actions.prepare({ kind: "action", action: entry.ref, arguments: args });
    const confirm = registered.effect === "irreversible"
      ? ctx.confirmWebsiteActions : async () => true;
    const receipts = await ctx.actions.execute(plan, confirm, crypto.randomUUID(), {
      signal: ctx.signal, onStart: info => Object.assign(execution, info, { started: true }),
    });
    const receipt = receipts?.[0];
    if (receipt && receipt.status !== "succeeded") {
      const error = new Error(receipt.error || "Website action did not succeed.");
      error.receipt = receipt;
      throw error;
    }
    assertActive(ctx.signal);
    return receipt || { action: entry.ref, status: "cancelled", message: "Customer declined; nothing was submitted." };
  }

  if (entry.kind === "agent") {
    const result = await runAgent(ctx, entry.ref, argsToText(args), parentSpan, chain);
    assertActive(ctx.signal);
    if (result.presentation) ctx.presentationOutput?.children?.push(result.presentation);
    return result;
  }

  if (entry.kind === "link") {
    const target = await ctx.resolveLink(entry.reference, parentSpan);
    assertActive(ctx.signal);
    if (!target) return `The user did not link '${entry.reference}'. Continue without it.`;
    return dispatchToolCall(ctx, { kind: "remote", url: target, label: entry.reference }, args, parentSpan, chain);
  }

  if (entry.kind === "remote") {
    const requestText = argsToText(args);
    const host = hostOfUrl(entry.url);
    const parsed = parseExternalAgent(entry.url, ctx.baseOrigin);
    if (chain?.includes(`${parsed.origin}::${parsed.agentName}`)) {
      const error = new Error(`Composition cycle: ${entry.url} is already in this request's call chain.`);
      error.code = "COMPOSITION_CYCLE";
      throw error;
    }
    if (requiresThirdPartyApproval(entry.url, ctx.baseOrigin)) {
      // The third-party peer has not been fetched yet, so consent genuinely
      // precedes contact. A network published by this same site stays local.
      const est = {
        totalTokens: Math.round((requestText.length + 300) / 4) * 2,
        costText: ctx.mock ? "$0.00 (mock)" : null,
      };
      const decision = await ctx.requestConsent?.({
        kind: "network", targetUrl: entry.url, parentSpan, peerLabel: entry.label || host, peerOrigin: host, requestText, est,
      });
      assertActive(ctx.signal);
      if (decision === "decline") {
        return `The user declined to contact ${host}. Proceed without it and note that to the user.`;
      }
    }
    const budgetReason = consumeRemoteBudget(ctx.composition, `${parsed.origin}::${parsed.agentName}`);
    if (budgetReason) {
      ctx.trace.note("composition_limit", {
        parent: parentSpan, origin: ctx.displayOrigin, target: entry.url,
        reason: budgetReason, remoteCalls: ctx.composition?.remoteCalls,
      });
      throw new Error(`Cannot call ${entry.label || host}: ${budgetReason}.`);
    }
    // Approved — only now fetch-and-run the peer network.
    const session = await ctx.resolveRemote(entry.url, chain, parentSpan);
    assertActive(ctx.signal);
    const downstreamSly = filterSlyData(ctx.slyData, allowedDownstreamSly(ctx.network.getAgentSpec(ctx.frontMan)) || []);
    const request = {
      user_message: { type: ChatMessageType.HUMAN, text: requestText },
      sly_data: downstreamSly,
      chat_filter: { chat_filter_type: "MINIMAL" },
    };
    const result = await session.invoke(request, { parentSpan, chain, composition: ctx.composition, signal: ctx.signal, deadline: ctx.deadline });
    assertActive(ctx.signal);
    for (const ref of proposalRefs(result)) ctx.allowedActionRefs?.add(ref);
    return result;
  }

  throw new Error(`Unsupported tool kind '${entry.kind}'${entry.ref ? `: ${entry.ref}` : ""}.`);
}

// The model one agent sends. effectiveModel keeps this in step with the settings panel.
function agentModel(ctx, spec) {
  return effectiveModel(ctx.modelOverride, spec?.llm_config?.model_name, ctx.network.config?.llm_config?.model_name);
}

// An invocation owns its deadline, all waits, and the final acceptance decision.
export async function runAgent(ctx, agentName, userText, parentSpan, chain) {
  const scope = createCallScope(ctx, ctx.network.getAgentSpec(agentName));
  ctx = bindContext(ctx, scope.signal, scope.deadline);
  const source = { origin: ctx.displayOrigin, network: ctx.network.name, agent: agentName, invocation: `cruse-${++invocationSequence}` };
  const spec = ctx.network.getAgentSpec(agentName);
  const agentSpan = ctx.trace.start("agent", {
    parent: parentSpan, ...source, displayAs: "llm_agent",
    isTopFrontMan: ctx.isTop && agentName === ctx.frontMan,
  });
  try {
    const result = await scoped(ctx.signal, async () => {
      const budgetReason = consumeAgentBudget(ctx.composition);
      if (budgetReason) {
        ctx.trace.note("composition_limit", {
          parent: parentSpan, origin: ctx.displayOrigin, agent: agentName,
          reason: budgetReason, agentCalls: ctx.composition?.agentCalls,
        });
        throw new Error(`Cannot invoke ${agentName}: ${budgetReason}.`);
      }
      if (!spec) throw new Error(`agent '${agentName}' not found`);
      // Reject invalid model configuration before any tool or provider contact.
      if (ctx.apiKey && ctx.apiKey !== "demo") {
        assertModelForRouter(agentModel(ctx, ctx.network.getAgentSpec(agentName)), ctx.mock, hostOfUrl(ctx.routerBaseUrl));
      }
      // Scope prompt context to this invocation. Never mutate a shared agent spec or
      // ctx: siblings and remote networks can be running concurrently.
      const catalog = ctx.actions?.catalog({ base: ctx.baseOrigin, network: ctx.network.name }) || [];
      const presentationContext = agentPresentationContext(ctx, agentName);
      const nativeTools = new Set(ctx.manifest?.actions?.agentTools || []);
      const proposalCatalog = catalog.filter(action => !nativeTools.has(action.name)
        || action.availability !== "local-only"
        || (action.effect === "irreversible" && typeof ctx.confirmWebsiteActions !== "function"));
      const websiteContext = proposalCatalog.length || !catalog.length
        ? actionContext(proposalCatalog)
        : "\nWebsite operations are connected as website_* tools. CRUSE forms remain available to collect missing details in one step. Return an ordinary form without submit.actions; its submitted values arrive as CRUSE interaction data on the next turn. Then call the appropriate website tool using those values. A form submission only supplies answers; checkout still requires the tool's browser confirmation. Do not report a missing integration.\n";
      const context = presentationContext + (presentationContext && ctx.actions ? websiteContext : "");
      const network = Object.create(ctx.network);
      network.getAgentSpec = (name) => {
        const spec = ctx.network.getAgentSpec(name);
        return name === agentName && spec && context ? { ...spec, instructions: `${spec.instructions || ""}\n\n${context}` } : spec;
      };
      const local = { ...ctx, network, agentSpan, invocation: source.invocation,
        presentationOutput: { presentation: null, children: [] }, allowedActionRefs: new Set(catalog.map(a => a.ref)) };
      const raw = await runAgentManual(local, agentName, userText, chain);
      assertActive(ctx.signal);
      const result = parseAgentResponse(raw, source);
      if (!result.presentation) {
        result.presentation = local.presentationOutput.presentation
          || consolidateIntakePresentations(local.presentationOutput.children);
      }
      ctx.actions?.validatePresentation(result, local.allowedActionRefs);
      if ((!result.text.trim() && !result.presentation) || functionCallOnly(result.text)) {
        const error = new Error(result.presentationIssues?.join(" ") || (result.text.trim()
          ? "Agent returned an unexecuted function call instead of an answer."
          : "Agent returned no answer or valid presentation."));
        throw error;
      }
      for (const ref of proposalRefs(result)) ctx.allowedActionRefs?.add(ref);
      ctx.trace.note("presentation_proposal", { parent: parentSpan, ...source, presentation: result.presentation, issues: result.presentationIssues });
      ctx.trace.note("agent_result", { parent: parentSpan, ...source, text: result.text, presentation: result.presentation });
      return result;
    });
    ctx.trace.end(agentSpan, { answerChars: result.text.length });
    return result;
  } catch (error) {
    ctx.trace.fail(agentSpan, error);
    throw error;
  } finally { scope.dispose(); }
}

function functionCallOnly(text) {
  const value = text.trim();
  return /^(?:<function=[\w.:-]+>(?:(?!<\/?function(?:=|>))[\s\S])*<\/function>\s*)+$/.test(value)
    || /^<function=[\w.:-]+>\s*(?:\{[\s\S]*\}|\[[\s\S]*\])?\s*$/.test(value);
}

async function runAgentManual(ctx, agentName, userText, chain) {
  const { network, llm, trace } = ctx;
  const spec = network.getAgentSpec(agentName);
  if (!spec) throw new Error(`agent '${agentName}' not found`);

  const origin = ctx.displayOrigin;
  const isTopFrontMan = ctx.isTop && agentName === ctx.frontMan;
  const agentSpan = ctx.agentSpan;

  const { toolByName, toolSchemas } = await buildToolTable(ctx, spec);

  const sysParts = [];
  if (spec.instructions) sysParts.push(spec.instructions.trim());
  if (spec.command) sysParts.push(spec.command.trim());
  const messages = [{ role: "system", content: sysParts.join("\n\n") || "You are a helpful agent." }];
  if (isTopFrontMan && ctx.history?.length) messages.push(...ctx.history);
  messages.push({ role: "user", content: userText });

  const model = agentModel(ctx, spec);
  // A partner context carries this site's step limit (engine.js _makeCtx), so a partner
  // network cannot raise it.
  const maxSteps = Math.min(spec.max_steps || network.config.max_steps || 12, ctx.maxSteps || Infinity);

  let finalText;
  for (let step = 0; step < maxSteps; step++) {
    assertActive(ctx.signal);
    if (isTopFrontMan) {
      applyPendingSteering(ctx.turnControl, (text) => messages.push({ role: "user", content: text }));
    }
    const onContentDelta = isTopFrontMan ? (t) => ctx.onAnswerDelta?.(t) : undefined;
    const attempt = await runInterruptibleModelCall(isTopFrontMan ? ctx.turnControl : null, (signal) =>
      scoped(ctx.signal, () => llm.chat({ model, messages, tools: toolSchemas, origin, parentSpan: agentSpan, onContentDelta,
        signal: signal && ctx.signal ? AbortSignal.any([ctx.signal, signal]) : ctx.signal || signal })));
    assertActive(ctx.signal);
    if (attempt.interrupted) {
      step -= 1; // steering retries the same model step; it is not an agent step
      continue;
    }
    const res = attempt.value;
    if (isTopFrontMan && ctx.turnControl?.pending.length) {
      step -= 1;
      continue;
    }
    if (res.toolCalls.length === 0) {
      finalText = res.content;
      break;
    }
    messages.push({ role: "assistant", content: res.content || null, tool_calls: res.toolCalls });
    const calls = res.toolCalls.map((tc) => {
      let args = {};
      try { args = tc.function.arguments ? JSON.parse(tc.function.arguments) : {}; }
      catch { args = { request: tc.function.arguments }; }
      return { id: tc.id, name: tc.function.name, args, entry: toolByName.get(tc.function.name) };
    });
    const toolResults = await executeToolCalls(ctx, calls, agentSpan, chain);
    for (const result of toolResults) {
      messages.push({ role: "tool", tool_call_id: result.id, name: result.name, content: result.content });
      trace.note("tool_result", { parent: agentSpan, origin, tool: result.name, preview: result.content.slice(0, 200), status: result.status, ...(result.receipt ? { receipt: result.receipt } : {}), type: ChatMessageType.AGENT_TOOL_RESULT });
    }
  }

  if (finalText === undefined) throw new Error(`Agent '${agentName}' exhausted max_steps (${maxSteps}) without an answer.`);
  return finalText;
}
