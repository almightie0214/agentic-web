import { validateNetwork } from './validator-rules.mjs';
import { auditUrl } from './audit.js';
import { is_mcp_ref } from './runtime/generated/graph.gen.mjs';
import { artifactDownloads } from './artifact-download.js';

const $ = selector => document.querySelector(selector);
const root = $('#agent-app');
const status = $('#site-status');
const fields = { manifest: $('#manifest-json'), network: $('#network-json'), links: $('#links-json'),
  baseUrl: $('#review-base'), networkName: $('#network-name'), activePeerChain: $('#peer-chain') };
let runtime;
let reviewed;
let currentChecks = [];
let generation = 0;
let controller;
let latestRun = null;
const spans = new Map();
const decisions = [];

function updateWorkflow() {
  const current = window.location?.hash || '#review-tools';
  for (const link of document.querySelectorAll('nav[aria-label="Team workflow"] a')) {
    if (new URL(link.href).hash === current) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
}
window.addEventListener?.('hashchange', updateWorkflow);
updateWorkflow();

let releaseDownloads;
let testController;
let observedRunActive = false;
window.addEventListener?.('pagehide', event => {
  if (!event.persisted) releaseDownloads?.();
  testController?.abort();
});

function canTestRun() {
  return !!reviewed && !currentChecks.some(check => ['fail', 'error'].includes(check.status));
}

function updateRunControls() {
  $('#test-run-start').disabled = !runtime || !canTestRun() || !!testController
    || observedRunActive || !!runtime.engine.running || !$('#test-run-message').value.trim();
  $('#test-run-stop').disabled = !testController || testController.signal.aborted;
  $('#test-run-message').disabled = !!testController;
}

$('#test-run-message').addEventListener('input', updateRunControls);
$('#test-run-form').addEventListener('submit', async event => {
  event.preventDefault();
  updateRunControls();
  if ($('#test-run-start').disabled) return;
  const active = new AbortController();
  testController = active;
  const chatControls = ['#ns-input', '#ns-send', '#ns-newchat'].map(selector => root.querySelector(selector)).filter(Boolean);
  const disabledStates = chatControls.map(control => control.disabled);
  for (const control of chatControls) control.disabled = true;
  $('#test-run-answer').textContent = '';
  $('#test-run-status').textContent = 'Running the checked editor definition. Stop cancels this run.';
  $('#test-run-status').dataset.state = '';
  updateRunControls();
  try {
    const result = await runtime.engine.runEditor(reviewed, $('#test-run-message').value.trim(), { signal: active.signal });
    if (active.signal.aborted) throw active.signal.reason;
    $('#test-run-answer').textContent = result.text;
    $('#test-run-status').textContent = 'Test run completed. This answer belongs to one message, without previous conversation history.';
  } catch (error) {
    const message = active.signal.aborted ? 'Test run cancelled.' : `Test run failed: ${bootError(error)}`;
    $('#test-run-answer').textContent = message;
    $('#test-run-status').textContent = message;
    $('#test-run-status').dataset.state = 'error';
  } finally {
    testController = undefined;
    chatControls.forEach((control, index) => { control.disabled = disabledStates[index]; });
    updateRunControls();
  }
});
$('#test-run-stop').addEventListener('click', () => {
  testController?.abort();
  updateRunControls();
});

function jsonText(value, missing = '(not declared)') {
  return value === undefined ? missing : typeof value === 'string' ? value : JSON.stringify(value);
}

function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = jsonText(text);
  if (className) element.className = className;
  return element;
}

function reviewStatus(message, state = '') {
  $('#review-status').textContent = message;
  $('#review-status').dataset.state = state;
}

function clearReview(message) {
  generation++;
  controller?.abort();
  reviewed = null;
  currentChecks = [];
  releaseDownloads?.();
  releaseDownloads = undefined;
  updateRunControls();
  $('#rule-report').replaceChildren();
  $('#review-graph').textContent = 'No current report. Validate the current inputs.';
  reviewStatus(message);
  return generation;
}

function fillInput(input) {
  for (const [key, field] of Object.entries(fields)) {
    field.value = input[key] === undefined ? '' : ['baseUrl', 'networkName'].includes(key)
      ? jsonText(input[key]) : JSON.stringify(input[key], null, 2);
  }
}

function parseInput() {
  const input = {};
  for (const [key, field] of Object.entries(fields)) {
    const source = field.value.trim();
    if (!source && !['manifest', 'network'].includes(key)) continue;
    if (['baseUrl', 'networkName'].includes(key)) input[key] = source;
    else {
      try { input[key] = JSON.parse(source); }
      catch (error) {
        return { error: { ruleId: 'input.json', status: 'error', path: `/${key}`,
          message: `Invalid JSON: ${error.message}`, hint: 'Correct the JSON syntax at the indicated position, then validate again. Supply JSON, not HOCON.' } };
      }
    }
  }
  return { input };
}

function linkBindings(input, entry) {
  const published = typeof entry?.name === 'string' ? input?.links?.networks?.[entry.name] : undefined;
  return { ...input?.network?.links, ...published };
}

function peerTargets(input) {
  const entries = Array.isArray(input?.manifest?.networks) ? input.manifest.networks : [];
  const entry = input?.networkName === undefined ? entries[0] : entries.find(item => item?.name === input.networkName);
  const config = input?.network;
  const bindings = linkBindings(input, entry);
  const targets = [];
  const agents = Array.isArray(config?.tools) ? config.tools : [];
  const locals = new Set(agents.map(agent => agent?.name));
  for (const agent of agents) {
    for (const ref of Array.isArray(agent?.tools) ? agent.tools : []) {
      if (typeof ref !== 'string' || locals.has(ref) || is_mcp_ref(ref)) continue;
      const named = Object.hasOwn(config?.link_slots ?? {}, ref);
      const target = named ? bindings[ref] : ref;
      if (typeof target !== 'string' || !(named ? /^https?:\/\//i : /^(https?:\/\/|\/(?!\/))/i).test(target)) continue;
      try {
        const url = new URL(target, input.baseUrl);
        const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
        const placeholder = /(^|\.)(test|invalid|example)$/.test(url.hostname)
          || /(^|\.)example\.(com|org|net)$/.test(url.hostname)
          || /placeholder|replace[-_]?me|your[-_]?host/i.test(url.href);
        if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:'))
          || url.username || url.password || placeholder || url.pathname.endsWith('/')) continue;
        targets.push(url);
      } catch { /* Unbound references are configuration, not executable presets. */ }
    }
  }
  return targets;
}

function runtimeInput() {
  const top = runtime?.engine.top;
  return top ? { manifest: top.manifest, network: { ...top.network.config, links: top.network.links },
    baseUrl: `${top.base}/`, networkName: top.network.name } : null;
}

function updatePeerPreset() {
  const peer = peerTargets(runtimeInput())[0];
  $('#audit-peer').disabled = !peer;
  $('#peer-status').textContent = peer
    ? `Configured peer: ${peer.href}. Audit only retrieves public JSON; this is not proof of availability or permission to invoke it.`
    : 'Linked peer not configured or uses a placeholder; this preset is unavailable. You may enter a public URL manually.';
}

function configurationGraph(container, input) {
  container.replaceChildren();
  if (!input) { container.textContent = 'Configuration unavailable.'; return; }
  const manifest = input.manifest;
  const config = input.network;
  const entries = Array.isArray(manifest?.networks) ? manifest.networks : [];
  const entry = input.networkName === undefined ? entries[0] : entries.find(item => item?.name === input.networkName);
  const graph = node('ul', undefined, 'desk-graph');
  graph.append(node('li', `Manifest → ${jsonText(entry?.name, '(missing network name)')} → front agent: ${jsonText(entry?.front_man, '(missing front_man)')}`));
  graph.append(node('li', `Definition: ${jsonText(entry?.hocon, '(missing hocon)')}`));
  const bindings = linkBindings(input, entry);
  for (const agent of Array.isArray(config?.tools) ? config.tools : []) {
    const refs = Array.isArray(agent?.tools) ? agent.tools : [];
    const targets = refs.map(ref => typeof ref === 'string'
      ? Object.hasOwn(config?.link_slots ?? {}, ref) ? `${ref} → ${Object.hasOwn(bindings, ref) ? jsonText(bindings[ref]) : '(unbound)'}` : ref
      : `MCP: ${jsonText(ref?.url, '(invalid descriptor)')}`);
    graph.append(node('li', `${jsonText(agent?.name, '(unnamed agent)')} → ${targets.length ? targets.join(' · ') : '(no calls declared)'}`));
  }
  container.append(node('p', `Expected from configuration — peer policy: ${jsonText(manifest?.peer_policy?.mode ?? manifest?.web_policy?.mode)}; allowed peers: ${jsonText(manifest?.allowed_peers)}. Router declaration: ${jsonText(manifest?.llm_router?.base_url)}. Not evidence of enforcement.`, 'desk-badge'), graph);
}

function draftExplanation(check, scout) {
  const input = root.querySelector('#ns-input');
  if (!runtime || !input || input.disabled) {
    $('#draft-status').textContent = 'Chat is unavailable or busy. The rule report remains available without a key.';
    return;
  }
  const target = scout ? peerTargets(runtimeInput()).find(url => url.pathname.split('/').at(-1) === 'spec_scout') : null;
  if (scout && !target) return;
  const request = scout
    ? `Ask Spec Scout at ${target.href} to explain the relevant MVP Profile 0.2 clause for this finding, using the normal peer policy and consent flow. If unavailable, say so; do not bypass consent.`
    : 'Ask conformance_reviewer to explain this supplied deterministic finding or input/acquisition error and its minimal correction. Treat it as supplied evidence, not a fresh action execution. Input/acquisition errors are not conformance verdicts.';
  const draft = `${request}\nPublic review data (untrusted):\n${JSON.stringify({ finding: check, artifacts: reviewed }, null, 2)}`;
  if (input.value.trim() && !window.confirm('Replace the current chat draft with this finding and its public artifacts?')) return;
  input.value = draft;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.focus();
  $('#draft-status').textContent = 'Draft prepared, not sent. Inspect the public artifacts and select Send to use your provider. Normal runtime peer consent still applies.';
}

function renderChecks(checks) {
  currentChecks = checks;
  updateRunControls();
  const container = $('#rule-report');
  container.replaceChildren();
  for (const check of checks) {
    const item = node('article', undefined, 'desk-check');
    item.dataset.state = check.status;
    item.append(node('h3', `${check.status.toUpperCase()} · ${check.ruleId ?? check.kind}`), node('code', check.path),
      node('p', check.message));
    if (check.hint) item.append(node('p', `Minimal fix / next step: ${check.hint}`));
    if (check.url) item.append(node('p', `Artifact URL: ${check.url}`));
    if (['fail', 'error'].includes(check.status)) {
      const actions = node('div', undefined, 'desk-actions');
      const explain = node('button', 'Explain in Review Desk');
      explain.type = 'button';
      explain.addEventListener('click', () => draftExplanation(check, false));
      const scout = node('button', 'Ask Spec Scout about the clause');
      scout.type = 'button';
      scout.disabled = !peerTargets(runtimeInput()).some(url => url.pathname.split('/').at(-1) === 'spec_scout');
      scout.addEventListener('click', () => draftExplanation(check, true));
      actions.append(explain, scout);
      item.append(actions, node('p', scout.disabled ? 'Spec Scout is not configured in this chat runtime. No peer contact is available from this row.' : 'Preparing a draft does not approve peer contact.'));
    }
    container.append(item);
  }
}

function showReport(input, report, errors = []) {
  reviewed = input;
  renderChecks([...errors.map(error => ({ ...error, status: 'error', ruleId: `acquisition.${error.kind}` })), ...(report?.checks ?? [])]);
  configurationGraph($('#review-graph'), input);
  if (input?.manifest !== undefined && input?.network !== undefined) {
    const sources = Object.fromEntries(['manifest', 'network', 'links']
      .filter(key => input[key] !== undefined).map(key => [key, fields[key].value]));
    releaseDownloads?.();
    releaseDownloads = artifactDownloads($('#review-downloads'), input, { sources, networkName: input.networkName });
  }
}

$('#validate-form').addEventListener('submit', event => {
  event.preventDefault();
  clearReview('Checking JSON…');
  const { input, error } = parseInput();
  if (error) {
    renderChecks([error]);
    reviewStatus('Input could not be parsed. No rule verdict was produced.', 'error');
    return;
  }
  const report = validateNetwork(input);
  showReport(input, report);
  reviewStatus(report.valid ? 'Static checks passed; warnings may remain. Runtime behavior is unverified.'
    : 'Static review is not ready. Review failures and unverified checks below.', report.valid ? '' : 'error');
});

for (const field of Object.values(fields)) field.addEventListener('input', () => clearReview('Inputs changed. Validate again for a current report.'));
for (const button of document.querySelectorAll('[data-sample]')) button.addEventListener('click', async () => {
  const token = clearReview('Loading public sample JSON…');
  try {
    const response = await fetch(new URL(`./samples/${button.dataset.sample}.network.json`, import.meta.url), { credentials: 'omit' });
    if (!response.ok) throw new Error('Sample unavailable');
    const input = await response.json();
    if (token !== generation) return;
    fillInput(input);
    const report = validateNetwork(input);
    showReport(input, report);
    reviewStatus(`Sample: ${button.textContent}. ${report.valid ? 'Static checks passed; warnings may remain.' : 'Static review is not ready; inspect the findings.'} Runtime behavior is unverified.`);
  } catch {
    if (token === generation) reviewStatus('The sample could not be loaded as JSON. Check local sample files; this is not a rule violation.', 'error');
  }
});

$('#audit-this').addEventListener('click', () => {
  clearReview('This site selected. Review the URL and select Audit URL.');
  $('#audit-url').value = new URL('./', import.meta.url).href;
  fields.networkName.value = '';
});
$('#audit-peer').addEventListener('click', () => {
  const peer = peerTargets(runtimeInput())[0];
  if (!peer) return;
  clearReview('Linked peer selected. Review the URL and select Audit URL.');
  $('#audit-url').value = new URL('./', peer).href;
  fields.networkName.value = peer.pathname.split('/').at(-1);
});
$('#audit-noncors').addEventListener('click', () => {
  clearReview('Illustrative external destination selected; its CORS behavior is not verified. Select Audit URL to fetch public artifacts.');
  $('#audit-url').value = 'https://example.com/';
  fields.networkName.value = '';
});
$('#audit-url').addEventListener('input', () => clearReview('URL changed. Select Audit URL to retrieve the new artifacts.'));
$('#audit-form').addEventListener('submit', async event => {
  event.preventDefault();
  const token = clearReview('Fetching public JSON only…');
  controller = new AbortController();
  const result = await auditUrl($('#audit-url').value, { signal: controller.signal,
    ...(fields.networkName.value.trim() ? { networkName: fields.networkName.value.trim() } : {}) });
  if (token !== generation) return;
  fillInput(result.input);
  showReport(result.input, result.report, result.errors);
  reviewStatus(result.readiness.summary, result.readiness.status === 'static-ready' ? '' : 'error');
});

function observe(event) {
  if (event.kind === 'run' && ['start', 'end'].includes(event.phase)) {
    observedRunActive = event.phase === 'start';
    updateRunControls();
    if (!observedRunActive) queueMicrotask(updateRunControls);
  }
  if (event.kind === 'run' && event.phase === 'start') {
    latestRun = event.id;
    spans.clear();
    decisions.length = 0;
  }
  if (event.kind === 'link') {
    configurationGraph($('#runtime-config'), runtimeInput());
    updatePeerPreset();
    renderChecks(currentChecks);
  }
  if (!latestRun || !(event.id === latestRun || spans.has(event.parent) || spans.has(event.id))) return;
  if (event.id) spans.set(event.id, event);
  else if (['consent', 'composition_limit'].includes(event.kind)) decisions.push(event);
  const list = $('#runtime-events');
  list.replaceChildren();
  for (const span of [...spans.values(), ...decisions]) {
    const identity = span.kind === 'model_call'
      ? `${span.routerHost ?? '(router not reported)'} / ${span.model ?? '(model not reported)'} / ${span.mock ? 'mock' : 'non-mock request'}`
      : span.agent ?? span.tool ?? span.network ?? span.peerOrigin ?? '';
    const label = `${span.parent ? `${span.parent} → ` : ''}${span.id ?? span.kind}: ${span.kind} ${identity} — ${span.decision ?? span.status ?? 'observed'}`;
    list.append(node('li', label));
  }
  const counts = kind => [...spans.values()].filter(span => span.kind === kind).length;
  const consent = decisions.filter(item => item.kind === 'consent');
  const consentCounts = [
    ['prompt_allow', 'Allow once'], ['prompt_always', 'Always allow now'],
    ['remembered_always', 'Remembered always allow'], ['decline', 'Decline'],
    ['headless_default', 'No UI hook default allow'],
  ].map(([source, label]) => `${label}: ${consent.filter(item => item.source === source).length}`).join('; ');
  $('#trust-state').textContent = `Observed in latest run ${latestRun}: ${spans.get(latestRun)?.status ?? 'running'}; ${counts('agent')} agent spans, ${counts('model_call')} model-call spans, ${counts('remote_fetch')} peer-fetch spans, ${counts('remote_call')} peer-call spans, ${consent.length} explicit consent-decision events (${consentCounts}). These are runtime reports, not proof of credential or private-context isolation. CORS policy, cycle interruption, and limit enforcement remain unverified.`;
}

const urlSecrets = [...new URLSearchParams(globalThis.location?.search || "")]
  .filter(([name]) => /key|token|secret|password|authorization|cookie/i.test(name))
  .map(([, value]) => value).filter(Boolean);

function bootError(error) {
  let message = String(error?.message || error || "Unknown loader error");
  for (const value of urlSecrets) message = message.split(value).join("[redacted]");
  return message.replace(/https?:\/\/[^\s<>"']+/gi, value => {
    try { const url = new URL(value); return url.origin + url.pathname; }
    catch { return "[redacted URL]"; }
  }).replace(/\b(authorization|cookie)\s*:\s*[^\r\n]+/gi, "$1: [redacted]")
    .replace(/(["']?(?:api[_-]?key|key|token|secret|password|authorization|cookie)["']?\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi, "$1[redacted]");
}

async function mountDesk() {
  try {
    const { boot } = await import('./runtime/index.js');
    runtime = await boot(root, {
      originUrl: new URL('./', import.meta.url).href,
    });
    root.hidden = false;
    status.textContent = 'Review Desk is ready. Configure AI model settings with your provider key to start chatting. Static validation and URL audits need no key.';
    configurationGraph($('#runtime-config'), runtimeInput());
    updatePeerPreset();
    runtime.trace.addEventListener('event', event => observe(event.detail));
    for (const event of runtime.trace.events) observe(event);
    renderChecks(currentChecks);
    updateRunControls();
  } catch (error) {
    root.hidden = true;
    status.setAttribute('role', 'alert');
    status.dataset.state = 'error';
    status.textContent = 'Review Desk chat could not be loaded. Serve this site over HTTP or HTTPS, check that its runtime, agent-manifest.json, and network definition are available and valid, and reload. Key-free checks and URL audits remain available above.' + ` Loader error: ${bootError(error)}`;
  }
}

function receiveConvertedInput() {
  const key = 'agent-review-desk:converter';
  let source;
  try { source = window.sessionStorage.getItem(key); }
  catch { return; }
  if (source === null) return;
  try {
    window.sessionStorage.removeItem(key);
    const input = JSON.parse(source);
    const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
    if (!object(input) || Object.keys(input).length !== 3
      || !['manifest', 'network', 'links'].every(name => Object.hasOwn(input, name) && object(input[name]))
      || !Array.isArray(input.manifest.networks) || !Array.isArray(input.network.tools)
      || !object(input.links.networks)) throw new Error('Invalid converter transfer');
    fillInput(input);
    const report = validateNetwork(input);
    showReport(input, report);
    reviewStatus(report.valid
      ? 'Converted artifacts received. Static checks passed; warnings may remain. Runtime behavior is unverified.'
      : 'Converted artifacts received. Static review is not ready; inspect the findings. Runtime behavior is unverified.', report.valid ? '' : 'error');
  } catch {
    reviewStatus('Converted artifacts could not be received safely. Return to the converter and try again. No converted network was executed.', 'error');
  }
}

updateRunControls();
receiveConvertedInput();
await mountDesk();
