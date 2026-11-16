# Browser runtime

## Local distribution notice

Agent Review Desk + Spec Scout copied this runtime from
`cognizant-ai-labs/agentic-web` at commit
`63a956cf4653f610b1c238c70946f4d7647d17a8`, directory
`skills/agentify-website/runtime/`. To comply with this project's prohibition on
backward-compatibility code, local changes remove the obsolete `langgraph`
runner alias in `index.js`, the old `mock`/`base_url` manifest fallback for
`mockUrl` in `ui.js`, and inference of missing `confirmText` from `confirmLabel`
or a default in `cruse.js` and `ui.js`. The retired `activity` theme slot lookup,
clearing/hiding branch, and dedicated CSS are also removed from `ui.js`; current
chat, agents, and settings mounts and in-chat turn status are preserved. Welcome
widgets now use the same presentation validation as responses. Confirm widgets
must provide explicit, nonblank `confirmText`; `confirmLabel` remains an optional
button label. LangChain selection and its optional bundled execution loop are
retired: all calls use the same runtime loop, with no runner selection in `boot`.
Provider URL precedence is preserved. In `byok.js`, the obsolete standalone-key slot
`nsweb-byok-key` is no longer read, written, or cleared. Only current tab settings
and saved profiles supply BYOK settings. After AW4 browser testing, cookie profile
mirroring (including loopback) and its UI hint were removed from `byok.js` and
`ui.js` to avoid sending provider keys to the static host. Profiles now persist
only in origin-scoped localStorage; tab settings keep their sessionStorage
precedence, and profile selection/deletion remain available. Existing test-host
cookies must be deleted manually by the user before loading this version; there
is no cookie migration, reader or automatic cleanup. See
[the browser ledger](../../docs/demo-checklist.md) for the cleanup/recheck procedure.
`kernel.js` now rejects duplicate agent names after `filterConfig` replacement and
trimming, before `specMap` can overwrite an entry; this applies to both top and
peer compilation.

The local runtime also retires MCP, toolbox/REST tools, coded-tool sandbox workers,
and cross-origin action discovery/bridges, including discovered catalogs and host
forms. Their declarations are rejected before execution rather than silently
ignored. Static kernel classification and generated validation remain available
for the key-free validator. Local same-origin action modules, `ActionRegistry`,
`website_*` tools, confirmation UI, validation and write receipts are retained.

Agent calls and tool dispatch now either return an accepted answer/result or throw.
Only `executeToolCalls` converts failures into error tool results, preserving
website receipts and uncertain write outcomes; diagnostics never become answer
text. Each invocation inherits the earliest parent, composition or own deadline.
The top network's `max_execution_seconds` sets the query budget (90 seconds when
absent, capped at 180 seconds); peers cannot extend it. Agent limits are also
capped at 180 seconds. Review Desk declares 180 seconds, Spec Scout 120 seconds,
and converter output 90 seconds. These declarations round twice each network's
longest approved top-level run up to a 30-second multiple; the runtime maximum is
max(90, those three declarations). See [the calculation ledger](../../docs/demo-checklist.md#8-measured-execution-limits)
for the original-precision durations and measurement scope. The undeclared query
default remains 90 seconds. Compilation rejects declared time limits unless they are
finite positive numbers, and declared `max_steps` unless they are positive integers.
Model and peer I/O and all context functions share that invocation's cancellation
scope; pending consent, link and action-confirmation UI close on abort and ignore
late input. Policy is checked before consent, and every consent decision has one
trace event with its source. The hosting pages expose sanitized loader errors.
`runner.js` forwards the executing agent's `llm_config.temperature`, falling back
only to that agent's own network. `llm.js` includes it in model requests only when
present, preserving zero. Caller router/key and model-override policies are
unchanged; choosing a model in settings does not replace temperature. Compilation
checks both network and agent declarations for finite numbers in [0, 2], even
when an agent overrides the network value.

Peer references now resolve once against the immediate caller's publication base,
including its path prefix. Policy, consent, cycle detection, cache, budget and reads
share that canonical network target. Published network names are separate from
path-based model tool aliases; collisions after sanitization or truncation receive
unique aliases without replacing targets or native runtime tool names.
Relative peers have no implicit page-location fallback. Published manifests,
definitions and links are fetched only from that publication's origin, with
redirects forbidden (including same-origin redirects).
Cross-origin definition URLs are rejected before any request; optional links do not
swallow publication-policy or redirect failures. Existing same-origin relative
artifact paths and peer policy modes are unchanged.

`Engine.runEditor(input, userText, {signal})` runs an editor JSON definition as a
peer without a publication base. Publication loading and editor definitions share
`_compileDefinition`, including capability rejection, validation and caller-only
router selection. The editor manifest cannot choose the router or receive a key.
Editor agents use the visitor's model (or the top front's model), the top step
limit and the same query budget factory as chat; their own temperature remains.
They inherit cancellation, have no website tools or action catalog, and neither
read nor persist stored links. Link choices last only within that editor run.
Every absolute peer call, even back to this site's origin, passes policy and
consent; relative peers are rejected because no publication base exists. Traces
label the definition `editor`. Editor runs do not receive or append chat history.
`running` guards both entry points against overlap, is true at run-start events,
and is false before run-end events. Chat also accepts an external abort signal.

These are local corrections to the copied reference runtime, not a replacement runtime. The license and upstream documentation below are
preserved; runtime claims there do not replace the local browser evidence ledger.

## Upstream documentation

This folder runs the agent network in the visitor's browser. Copy it into each
agentified site, and do not change it there.

It is a copy of the [nsdeploy](https://github.com/cognizant-ai-lab/nsdeploy) browser
runtime (Apache 2.0, see `LICENSE.txt`) at nsdeploy commit `53a787c` (2026-11-11), with
the edits listed below.

Why it is edited. A site's page has its own functions, called actions, like a room
search. nsdeploy's runtime does not let an agent use them as tools. The agent can only
offer a button or form. The visitor must click it and, by default, confirm the action.
The agent cannot answer until the visitor writes again.

Without editing the runtime, a site can plug in its own confirmation dialog, but not
tools that run the page's functions: the runtime builds the tool list in its own code. So
the runtime is edited. nsdeploy has no issue or pull request for this, so the edits live
here.

With the edits, each action the site's settings file (`agent-manifest.json`) lists under
`agentTools` becomes a `website_<name>` tool. Look-ups and undoable changes, such as
filling in the booking form, run without asking. Only actions the site marks
`irreversible`, like a booking, wait for the visitor to confirm. The AI model cannot
change these marks.

Linked sites need one more edit. When this site calls a partner site's network, that
network runs in this visitor's browser and on their key. In nsdeploy's runtime, the
partner network chooses the model and how many steps it takes, so it chooses what the
visitor pays for. With the edit, it runs on the visitor's model or, if they picked none,
this site's model, within this site's step limit.

Edited files. Each one has a line near its top saying that it was changed:

- `runner.js` offers each local-only action listed in the manifest's `actions.agentTools`
  as a `website_<name>` tool and runs it through the site's action registry. Actions with
  the `irreversible` effect ask the visitor first. Only the visitor's own site gets these
  tools, never a partner network. It also adds a `render_cruse` tool for forms and tables
  in the chat. It stops a partner agent at the step limit `engine.js` passes.
- `engine.js` passes the page's confirmation dialog to `runner.js`. It also runs a partner
  network on the visitor's model or, when the visitor picked none, on this site's
  front-agent model, and passes this site's step limit, so a partner network cannot choose
  what the visitor pays for.
- `cruse.js` accepts CRUSE replies without code fences and merges forms from several
  agents into one. It also tells agents about the `render_cruse` tool.
- `ui.js` shows a time picker for `format: "time"` fields and option labels from
  `x-ui.enumLabels`. It groups radio buttons under a legend and links each field to its
  description for screen readers. The ⚙ AI model settings panel lists hosted Otari first,
  the template's default router, and fills in its settings for a key that starts with
  `otk_`.
- `action-transport.js` opens the confirmation dialog with focus on its heading, so a
  stray Enter cannot confirm an action. Closing the dialog puts focus back where it was.
- `index.js` tells visitors that only actions that cannot be undone ask first, when the
  site offers `website_*` tools.

Protocol name: `nsdeploy`. Use it for `<protocol_name>` in `agent-manifest.json`. It
names the discovery files, such as `.well-known/nsdeploy.json`, that nsdeploy's tools read.

Do not edit or replace these files for one site. This copy is for use until nsdeploy's
own runtime offers these tools and partner limits.

nsdeploy plans to move to a runtime built on the neuro-san TS package (nsdeploy PR #10).
That runtime has no `website_*` tools yet. Before a site switches to it, move the edits
above to it and check that it offers those tools and runs a partner network on the
caller's model and step limit.
