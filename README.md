# Agent Review Desk + Spec Scout

Review portable agent networks before publishing them. **Agent Review Desk** turns
pasted JSON, built-in examples, or a public artifact URL into deterministic findings
with rule IDs, JSON Pointer locations and correction hints. Its two-agent chat can
explain those findings using a read-only validation action. **Spec Scout**, a linked
site, answers specification questions from cited MVP Profile 0.2 excerpts after
visitor consent. The **Role Converter** turns Theora or Markdown role instructions
into three portable conversation-network artifacts, ready to inspect and download
without a model key.

Try [Agent Review Desk](https://almightie0214.github.io/agentic-web/),
[Role Converter](https://almightie0214.github.io/agentic-web/converter.html), or
[Spec Scout](https://spec-scout.pages.dev/). These are two static browser-based sites
on separate origins: GitHub Pages for A and Cloudflare Pages for B. There is no
application backend, database, payment or authentication service. Chat uses an
external OpenAI-compatible router; static inspection and conversion need no key.

Source: [almightie0214/agentic-web](https://github.com/almightie0214/agentic-web)
(**PUBLIC**, **Apache-2.0**). Community-sharing activity is not recorded.
Submission deadline: **2027-01-11 08:00 PT = 2027-01-12 01:00 KST**.
Independent judge inference access remains an entrant-owned open item; no shared
provider key is published. Video, screenshots and final submission are outside the
current fixes-and-verification work.

## Current status and verification boundary

The integrated source includes the following judge-ready fixes:

- Runtime revision `ff3c493a569b22bd7037f3265ca215cc03d85fdb`: one execution loop;
  fail-closed agent/tool boundaries; inherited per-invocation deadlines; policy
  checks before consent; one trace event per consent decision with decision-source
  counts in Site A's trust display; and sanitized loader errors on both pages.
- Converter revision `495d04a6d5f488be9887900d36a2a80ef3ba1638`: converter-owned
  final-answer rules appended to each role and Theora/Markdown-specific descriptions
  in both network and manifest. CLI and browser use the same pure modules.
- CSP revision `b29ed15d5d57981df2be3e9b9f98b5707f297ace`: restrictive CSP meta on
  A's home/converter pages and B's home page, plus a dependency-free local browser
  check. Source policies do not establish the deployed browser's violation count.

**Post-deployment release observations are recorded at `225890d241a9f4ef15956c9c3a69c5ece004d771`.**
That `deadline-config` revision makes the top network's query limit configurable
(default 90 seconds, maximum 300); Review Desk declares 240 seconds, Spec Scout 180,
and converted teams 240. Invalid time/step declarations fail runtime compilation.
The public changed files byte-matched this integration revision; all 16 removed
modules returned 404. The landed-tree Edge/mock-router check passed with zero
unexpected CSP violations and blocked inline/eval probes. Local Edge confirmed
concrete loader errors and URL-secret redaction on both sites.

Fresh public Edge/CDP and Firefox/BiDi runs completed Allow → peer answer → final
prose, with one consent event and `Allow once: 1` each, no sentinel/Cookie/Authorization
on the observed B requests, and zero observed CSP violations on A/converter/B.
These runs used the development router and disposable-profile loopback-access
exceptions, **not default judge configuration**. Both peer answers still contained
partially garbled model text: execution completed, but **answer quality is not PASS**.
A CLI-generated Theora team also completed one loopback run; its final answer had
no observed draft/process notes, while its internal specialist answer retained
meta text and awkward tokens. Neither result guarantees model compliance.
The earlier 90-second timeout remains a failure record. `lc.getunicorn.org`
reproduced in both browsers; user-supplied environment diagnosis attributes it to
local Unicorn Pro HTTPS filtering, not site source. Independent review/gate and
entrant-owned judge access are separate from these bounded observations.
See [judge-ready release checks](docs/demo-checklist.md#6-judge-ready-fixes-release-check)
for the current evidence, commands, revisions and remaining owners. Its evidence
handoff correction identifies durable recovered run-514 stdout/field extracts,
exact-restored deployment/serving JSON and a rebuilt source snapshot. The old run
tmp and complete live JSON/trace arrays were lost; recovery is not a fresh live run.

Historical evidence remains in the [demo ledger](docs/demo-checklist.md), not a
fresh execution of this source:

- Local AW4 run 1 found duplicate-agent acceptance and key-bearing cookie leakage
  to A's static server. Both runtime copies were corrected; run 2 rechecked
  normalized-duplicate refusal, panel persistence/model switching and key absence
  on observed A/B static requests with caller-router retention. Old-key revocation
  was subsequently reported by the user. Unrelated cases were not all rerun.
- [Public measurements and public run 2](docs/demo-checklist.md#4-public-deployment-measurements-and-judging-handoff)
  recorded HTTPS/ACAO/404 responses and one Edge consent → B definition fetch →
  peer → normal §3.2-cited answer, with no key/Cookie/Authorization on the three
  observed B GETs. This preceded the current fixes. Public run 1 returned WebFetch
  markup; run 2 did not reproduce it, but recorded zero Allow events and an
  unattributed `lc.getunicorn.org` request. Those observations are preserved; new
  code is not proof that public behavior has been corrected.
- [AW5 converter dogfooding](docs/demo-checklist.md#aw5-converter-dogfooding)
  recorded two loopback Theora-team load/delegation successes (`s3`, `s300`) and
  **two answer-quality failures**: draft/meta text and garbled lines. Trace/history
  diagnostics located that text in model output, not converter/runtime corruption.
  The then-requested correction was withdrawn; the present Goal subsequently added
  output rules. The new one-run final-answer observation and its internal specialist
  limitations are recorded separately in §6; they do not erase those failures.

Static tests and checklists do not establish browser behavior, universal key
non-disclosure, exact quotation fidelity, arbitrary input quality or judge access.
The [English submission draft and handoff tracker](docs/devpost.md) separates
implemented functionality, historical observations and still-open release work.

## Testing instructions

### Without an API key

1. Open [Site A](https://almightie0214.github.io/agentic-web/) over HTTPS in Edge or
   Firefox. Wait for the ready message and settings/chat interface. Initial boot
   loads public metadata, not a model request. If loading fails, the status shows
   fixed recovery guidance and a sanitized loader error; static checks remain usable.
2. Choose **Valid sample**, then **Missing front_man**, **Invalid schema** or
   **Peer cycle**. Expect static findings with rule IDs, locations and hints;
   runtime checks remain unverified. Alternatively paste public manifest/network
   JSON and select **Validate pasted JSON**. Sample inspection never executes the
   supplied network. Do not paste credentials or private context.
3. Select **Audit This Site** or **Audit Linked Peer**, inspect the filled URL and
   select **Audit URL**. This retrieves public artifacts with credentials omitted,
   not inference or a peer invocation. Acquisition errors are separate from rule
   failures; a fetch error alone does not identify a CORS cause.
4. Open **Role Converter**, select **Theora role team** or **Claude agents team**
   (or choose public role files and **Convert and check**). Inspect the AW2 report
   and download `converted_team.network.json`, `agent-manifest.json` and
   `links.json`. **Open artifacts in Review Desk** transfers them for one-time
   static inspection only; it does not run the converted team or approve contact.
5. Open [Site B](https://spec-scout.pages.dev/) to check its boot/settings screen.
   Asking it a question, unlike booting it, requires inference setup.

### Chat and Spec Scout (visitor-provided inference)

1. Open **⚙ AI model settings**. The default router is hosted Otari
   (`https://api.otari.ai/api/v1`), with `alibaba/qwen3.8-flash` as the model hint.
   Supply an API key for an OpenAI-compatible router you are authorized to use.
   Under **Advanced settings (optional)** set **Provider URL** and **Model** when
   needed; enter the **API key** and select **Save and start**. Use the same panel
   for model switching. No shared key or free inference entitlement is included.
2. Keys are saved only in the visitor's browser (origin-local profiles/tab settings)
   and sent to the selected router for inference, not to the peer definition host.
   Do not put keys in URLs, prompts, artifacts or evidence. BYOK does not protect a
   key from untrusted JavaScript on the caller's own origin. This is the storage and
   routing design, not a universal non-disclosure claim.
3. Ask Review Desk to explain supplied public artifacts; expect coordinator →
   reviewer → `website_validate_network` and a report-grounded explanation when
   the question requires validation. A failed action is not a conformance verdict.
4. Ask: “Ask Spec Scout what MVP Profile 0.2 §3.2 requires for peer discovery.”
   For a new cross-origin approval, inspect the destination on the consent card
   and choose **Allow**. Expect a `consent` event, a nonzero corresponding trust
   count, B's public definition fetch, `remote_call spec_scout`, peer model use on
   the caller's selected router, and a final answer. The §6 post-deployment runs
   observed this path in both browsers, but peer model text was partially garbled;
   this is not a guarantee of a clean or accurate specification answer. The earlier
   90-second timeout remains recorded. Declining is a valid refusal,
   not an execution failure. Merely preparing a draft never grants consent.
5. Inspect the execution graph and Developer view for actual spans/decisions.
   Configuration is not execution evidence. A top-level runtime failure should
   appear as an error, not a successful answer containing error text. Record any
   discrepancy with environment/revision in the
   [release ledger](docs/demo-checklist.md#6-judge-ready-fixes-release-check).

For the implementer-run development release protocol, real keys remain outside
the browser: the implementer reuses or starts the loopback router and enters its
`http://127.0.0.1:8640/api/v1` URL and fake `otk_sentinel_dev` key in the panel.
Only the local router reads the private key file and forwards to Otari. This is a
development verification setup, not a hosted service or a judge-access arrangement.
Default-profile public-to-loopback setup failed: Edge reported an LNA block;
Firefox's models/preflight requests did not finish before the settings timeout.
That Firefox symptom alone does not establish the precise cause. Development
Edge used `--disable-features=LocalNetworkAccessChecks`; Firefox completed with
`network.lna.skip-domains=127.0.0.1` only in its disposable profile. The Firefox
exception is host-wide, not restricted to port 8640. Both profiles were removed
afterward. These are development-router conditions, not normal judge setup,
site changes or CSP fixes.

## Architecture and runtime contract

```text
Site A: Agent Review Desk (GitHub Pages origin)
  key-free editors / samples / public URL audit
       -> validator-rules.mjs -> deterministic report
  reference browser runtime + AI model settings / chat
       -> review_coordinator -> conformance_reviewer
                               -> website_validate_network (local site action)
       -> spec_scout (symbolic link in links.json)
            -> caller policy + visitor consent -> fetch B's public definition
            -> execute peer agents locally using the caller's router

Site B: Spec Scout (separate Cloudflare Pages origin)
  agent-manifest.json -> spec_scout.network.json (embedded cited excerpts)
  own reference runtime / settings / chat for direct visits

Node CLI / Site A Role Converter
  -> shared site-a/converter/ parser + emitters
  -> converted_team.network.json + agent-manifest.json + links.json
  -> static report / downloads / consume-once Review Desk inspection (not execution)

tools/check-conformance.mjs -> shared Site A rules + local publication/CORS checks
```

A binds `spec_scout` to `https://spec-scout.pages.dev/spec_scout` and allows
`https://spec-scout.pages.dev` under closed policy. Exact-name loading never silently
runs another network. B's published network embeds its cited excerpts;
`site-b/spec-excerpts.json` is authoring data, not fetched prompt injection.
Agents explain evidence; they do not invent conformance verdicts or certification.

Both sites use separately vendored nsDeploy reference runtimes, not a replacement
runtime. The current copies retire **LangChain selection and its bundled loop,
MCP, toolbox/REST tools, coded-tool sandbox/workers, and cross-origin action
discovery/bridges/host forms**. Unsupported declarations fail at compilation;
static kernel classification and generated validation remain for the key-free
validator. Local same-origin action modules, `ActionRegistry`, `website_*` tools,
confirmation UI, validation and write receipts remain. A's grounded capability is
the read-only local `validate_network` action, not MCP.

`runAgent` accepts an answer or throws; `dispatchToolCall` returns a result or
throws. Only `executeToolCalls` converts failures into model-visible error tool
results with diagnostic/status information. Website failures preserve receipts and
uncertain write outcomes without retrying. Empty answers, unexecuted function-call-only
answers, exhausted steps, limits, cycles and peer errors are failures; visitor
refusal remains a normal refusal result. Valid presentation-only answers and normal
prose explaining a tool failure can still be accepted. Validation issues do not
become fabricated answer text.

The top network's `max_execution_seconds` sets the composition deadline, capped at
300 seconds; absence alone uses 90 seconds. A peer cannot extend it. Both network
and agent time declarations must be finite positive numbers, and `max_steps` must
be a positive integer. Review Desk declares 240 seconds and Spec Scout 180 seconds.
Each invocation gets one absolute deadline: the earliest parent deadline,
composition deadline, or its own `max_execution_seconds`. Scoped context functions,
tool dispatch, model/peer fetches and human-input waits enforce cancellation and
ignore late results. A child's own timeout becomes an error tool result; expiration
of the parent's scope fails the parent. Timeout is distinct from user steering.
Consent checks the immediate caller's policy first, then records exactly one event
for prompt Allow, prompt Always, remembered Always, Decline or headless default.
Site A's trust display counts these sources separately.

A's home/converter pages and B's home page declare CSP meta: same-origin scripts
(no inline script/eval), no workers/objects, same-origin base/form actions,
same-origin plus inline styles for runtime style injection, self/data/blob images,
and self/HTTPS/loopback connections for public peers and configurable routers.
The landed-tree Edge check measured zero unexpected violations and blocked inline/
eval probes on all three pages. The post-deadline-config public Edge/Firefox flows
recorded zero CSP events on A, converter and B; Security/Log captures also recorded
no CSP messages. This scoped observation does not prove that a local HTTPS filter
cannot inject scripts before the browser applies policy, or make the earlier
90-second timeout PASS.

## Local setup and conversion

Use Node.js 24 for project tools; there are no npm dependencies to install. With
Python 3, a convenient single-server preview from the repository root is:

```sh
python -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000/site-a/` or `http://127.0.0.1:8000/site-b/`.
Use HTTP/HTTPS, not `file://`. Relative site-owned references support URL subpaths.
This preview is **not a two-origin isolation or deployed CORS test** and does not
replace the public B binding. The release protocol uses separate loopback origins
`127.0.0.1:8601` (A) and `127.0.0.1:8602` (B), paired with the development router.

The [converter mapping contract](docs/converter.md) defines the shared CLI/web flow:

```sh
node tools/theora2hocon/theora2hocon.mjs <input-dir> <out-dir> [--front <role>] [--layout theora|markdown]
```

- Auto-detection selects Theora for an exact `.theora/roles/<role>/agent.md`;
  otherwise Markdown. Explicit layouts never fall back or merge input sets.
- Theora accepts a project root and optional `.theora/config/theora.json`.
  Markdown prefers immediate `.claude/agents/*.md`, otherwise immediate `*.md`.
  Browser directory selection must include hidden directories to discover them.
- Front precedence is exact `--front`, config `front_man`, then first name-sorted
  role. Invalid names/config fail rather than guessing. The default graph is a
  front-to-specialists star with a common `inquiry` schema and no outgoing specialist
  calls. There are no generated peers or capabilities.
- `CVT-NET-005` appends a converter-owned output rule after sanitized source text:
  front answers only the visitor; specialists answer only the front's inquiry;
  neither should include drafts, plans, process notes or messages to other roles.
  `CVT-META-001` uses the selected input format for matching network/manifest
  descriptions: `Converted Theora role conversation network.` or
  `Converted Markdown role conversation network.` Rules do not guarantee model compliance.
- Exactly three data files are emitted: `converted_team.network.json`,
  `agent-manifest.json` and `links.json`. CLI and web use the same format-aware
  emitters/serialization. Exit 0 means written, not validated/deployed/executed.
- **Open artifacts in Review Desk** uses a same-origin sessionStorage payload,
  removed on receipt even when invalid. It fills static inputs, never runs chat.
  Execution needs a separate publication with the reference runtime/settings.

This exports sanitized role text and a default conversation graph, **not the
Theora/Claude harness**. Shell, git, gates, tests, filesystem access, permissions,
scheduling, state, skills, lifecycle policies and source tools/MCP are not converted.
Pattern-based secret/path removal is incomplete: review all outputs, licensing and
instruction suitability before sharing. Published instructions are public.

Saved AI profiles are origin-local localStorage; applied tab settings are
sessionStorage and take precedence. Cookie mirroring was removed. On previously
used test hosts, privately remove old test cookies and revoke exposed keys as the
ledger describes; there is no compatibility reader, migration or automatic cleanup.
Chat boot failures hide chat and show sanitized loader details while key-free
inspection remains available. Drafting an explanation requires the visitor to
review and send it. The execution graph shows latest-run runtime reports, not proof
of wire-level credential/private-context isolation or a security guarantee.

## Checks and spec mapping

```sh
node tools/check-conformance.mjs
npm test
```

The static CLI imports `site-a/validator-rules.mjs`, adding local publication-file,
link consistency, private-context **declaration** and applicable B `_headers`
audits. Exit 0 means checked local static artifacts pass; warnings/runtime
unverified statuses remain. It does not fetch public URLs, execute the loader,
emulate browser storage or invoke models. JSON `sly_data` alone injects no context.

`npm test` expands to `node --test "tests/**/*.test.mjs"`. The merge gate runs that
suite and the static CLI. Tests include publication/boot, validator/action/audit/UI,
peer policy, runtime failures/scopes/consent and converter behavior using controlled
fetch/model/storage substitutes. They are not live browser/provider evidence.

`node tools/browser-check.mjs` uses Node 24 and local headless Edge/CDP, two loopback
site origins and a mock router. It checks boot/render, samples, conversion/download,
chat/peer consent/fetch and CSP probes without real keys or external network.
Expected inline-script/eval probe violations are counted separately from unexpected
violations. It is a Task check, **not part of the project merge gate**;
current command results belong in the
[release ledger](docs/demo-checklist.md#6-judge-ready-fixes-release-check), not inferred here.

The mapping is an implementation guide, not full conformance or competition acceptance.
References use the [pinned MVP Profile 0.2 specification](docs/worldwide_agentic_web_mvp_spec.md).

| Spec requirement | Current implementation/checks | Evidence boundary |
| --- | --- | --- |
| §§2.1–2.2: resolved data, unique agents, schemas/references | Manifests/resolved JSON; shared rule reports; loader rejects normalized duplicates and unsupported retired tools before execution | Historical B05/run 2 records duplicate refusal; current browser boot-error checks and source/deployment correspondence are tracked in §6 |
| §§3.1, 6: delegation and grounded capability | Coordinator → reviewer → local `website_validate_network`; action registry, confirmation/receipts retained | Historical B01 action/delegation observation retains instruction deviations; not a fresh current-source run |
| §§3.2–3.4: exact peer resolution | Paired A links/allowed origin, exact B network; immediate-caller policy before consent; decision-source events/counts | §6 post-deployment Edge/Firefox each recorded Allow/event/trust 1, B fetch, actual peer result and caller final prose; partial peer token corruption remains, not answer-quality PASS |
| §4: pluggable inference, router-only key routing and CSP | Built-in settings/default Otari; peer uses caller router/model; no cookie mirroring; restrictive page CSP | §6 post-deployment runs: A/converter/B CSP 0 in both browsers, 32 observed B requests per browser free of sentinel/Cookie/Authorization, local-filter request attribution; dev-router LNA exceptions, not universal non-disclosure/default judge access |
| §§2.1, 5, 6: named private-context exceptions | Per-agent allow declarations checked; runtime filters downstream context | Historical B08 observed public_sentinel-only vs {} field sets; exact delivery and broader scoping are not established by static declarations |
| §§3.1–3.2, 5–6: finite execution/fail closed | Single loop; error-only failure propagation at tool boundary; scoped earliest deadlines; step/call/cycle enforcement | Deterministic checks are separate from historical B09/B10 cycle/24-agent-cap observations; those old runs do not verify current in-flight cancellation |
| §7: framework converter opportunity | Pure CLI/web conversion, output rules, format-specific descriptions and 240-second limit; AW2 reports/downloads | §6 CLI-generated Theora loopback run completed with no observed final draft/meta text; internal specialist meta/awkward tokens remain. Old AW5 quality FAIL retained; not a harness port or general quality/adoption claim |

## Deployment configuration and release handoff

1. **Site A:** `https://almightie0214.github.io/agentic-web/`.
   `.github/workflows/pages.yml` uploads **only `site-a/`**, never the repository
   root, on relevant `main` pushes or manual dispatch. This documentation task does
   not change deployment settings.
2. **Site B:** `https://spec-scout.pages.dev/`, independent `site-b/` publication
   root and no build command. Preserve runtime, manifest/network, `_headers` and
   script-free `404.html`. Historical public GETs measured ACAO `*` and missing
   paths returning 404, not SPA fallback. R01 in §6 now records changed-file byte
   correspondence to main; B `/index.html` redirects to `/`, whose bytes match.
3. **Paired binding:** `review_desk.spec_scout` targets
   `https://spec-scout.pages.dev/spec_scout`, allowed origin
   `https://spec-scout.pages.dev`, closed policy/exact name retained. If changed,
   update link, allowed origin and production test expectations together, rerun
   relevant checks, redeploy A and compare deployed bytes to source.
4. **Release observations:** §6 records the post-`deadline-config` `origin/main`
   revision `225890d`, changed-file public byte correspondence, landed-tree browser/
   boot checks, public Edge/Firefox live peer flows and one CLI-generated Theora
   run with the development router. Execution completion and residual model quality
   are separate verdicts. The earlier fixed-90-second timeout is preserved, not
   promoted to PASS. See [§6 of the ledger](docs/demo-checklist.md#6-judge-ready-fixes-release-check)
   for exact conditions and remaining limits. Independent review and the engine's
   gate, not this observation summary, determine acceptance.

See [the submission/public-access tracker](docs/devpost.md#submission-and-public-access-handoff)
for entrant-owned judge inference access, screenshots, an English public YouTube
explanation under two minutes, final submission and availability through
**2027-01-19 10:00 KST (UTC+09:00)**. Otari account/feedback is optional under
Official Rules §4. No credentials belong in the repository or tracker.

## Repository layout and provenance

- `site-a/`: Review Desk, validator/action/audit modules, samples, runtime,
  `converter.html`/`converter.js` and shared pure `converter/` modules/samples.
- `site-b/`: Spec Scout, manifest/network, excerpt authoring data, runtime, CORS
  `_headers` and script-free `404.html`.
- `tools/check-conformance.mjs`: static publication audit.
- `tools/theora2hocon/theora2hocon.mjs`: role-conversion CLI.
- `tools/browser-check.mjs`: local headless Edge release check with mock inference.
- `tests/`: Node publication/runtime/validator/action/audit/UI/peer/CLI tests and
  converter fixtures/parser/emitter/e2e/web tests.
- `docs/converter.md`: stable mapping IDs, sanitation and loss-of-semantics contract.
- `docs/devpost.md`: English submission draft and handoff tracker.
- `docs/demo-checklist.md`: historical evidence plus current release-check ledger.
- `.github/workflows/pages.yml`: Site A-only deployment; `LICENSE`/`package.json`:
  Apache-2.0 and dependency-free check command.

The [specification](docs/worldwide_agentic_web_mvp_spec.md) and original runtime
come from [cognizant-ai-labs/agentic-web](https://github.com/cognizant-ai-labs/agentic-web),
commit `63a956cf4653f610b1c238c70946f4d7647d17a8`, respectively
`docs/worldwide_agentic_web_mvp_spec.md` and `skills/agentify-website/runtime/`.
The specification preserves its original text below a provenance note and its
Cognizant AI Lab attribution. Runtime licenses/upstream documentation are retained;
there was no upstream NOTICE file.

Local runtime changes include earlier obsolete alias/mock/confirm-text/activity/key-slot
removals, normalized duplicate rejection and cookie-mirroring removal, plus the
current single-loop, feature-retirement, failure, deadline, consent and loader-error
work described above. Details are in the Local distribution notice of
[Site A's runtime](site-a/runtime/README.md) and
[Site B's runtime](site-b/runtime/README.md). Upstream documentation is provenance,
not a promise that retired features remain supported locally.

This project and the upstream reference material are licensed under
[Apache License 2.0](LICENSE).
