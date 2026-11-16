# Devpost submission draft — Agent Review Desk + Spec Scout

**Status: English draft, not submitted or submission-ready.** Runtime, converter,
CSP and configurable-deadline fixes are integrated through `origin/main`
`225890d241a9f4ef15956c9c3a69c5ece004d771`. Changed public A/B files byte-matched that
revision; 16 retired modules returned 404. The landed-tree Edge/mock-router and
local loader-error/redaction checks passed. Fresh public Edge/CDP and Firefox/BiDi
runs completed Allow → actual peer answer → caller final prose, with consent/trust
counts of 1, scoped B credential absence and zero observed A/converter/B CSP events.
These used the development router with disposable-profile LNA exceptions, not
default judge configuration. **Peer model text was partially garbled in both runs;
answer quality is not PASS.** One CLI-generated Theora loopback run produced a
final answer without observed draft/meta sentences, but its internal specialist
answer retained meta/awkward text. The earlier 90-second timeout and earlier
quality failures remain recorded, not erased. `lc.getunicorn.org` reproduced in
both browsers; user-supplied environment diagnosis attributes it to local Unicorn
Pro HTTPS filtering, not site source. Independent review/gate and entrant-owned
judge access remain separate from this bounded observation record.
Current results and gaps belong in the
[judge-ready release ledger](demo-checklist.md#6-judge-ready-fixes-release-check).
Its Round 2 handoff correction links durable recovered original stdout and field
extracts: the complete live JSON/trace arrays were lost with the old run tmp.
Deployment/serving JSON and final-answer strings were recovered with matching old
hashes; the source snapshot was rebuilt from the same commit, not newly executed.
Earlier local/public runs, failures and corrected rechecks remain in the ledger;
they are not fresh executions of this revision.

**Submission deadline: 2027-01-11 08:00 PT = 2027-01-12 01:00 KST.**
Source repository: [almightie0214/agentic-web](https://github.com/almightie0214/agentic-web)
— **PUBLIC**, **Apache-2.0**. Community-sharing activity is not recorded.
Independent judge inference access is an entrant-owned open item. Screenshots,
video and final Devpost submission are outside the current fixes-and-verification
Goal and still require the entrant's action. Otari account creation/feedback is
optional under Official Rules §4, not a release requirement.

## Project name and short description

**Agent Review Desk + Spec Scout**

Find and explain problems in portable agent-network artifacts, consult a linked
specification assistant, and convert Theora or Markdown roles into reviewable
conversation-network bundles—all from static browser sites.

## Inspiration and problem

A manifest and a plausible agent graph are not enough to show that a browser agent
site is interoperable. Authors need actionable artifact checks, but they also need
to know which claims require a browser run. We built a review desk that separates
deterministic static findings from model explanations rather than letting an LLM
announce conformance without evidence.

## What it does

**Agent Review Desk** helps authors inspect a network before publishing it. Paste
manifest/network/links JSON, choose one of four examples, or audit a public artifact
URL without a model key. Reports locate problems with stable rule IDs, JSON Pointer
paths and correction hints, while keeping acquisition errors, failed rules,
warnings and unverified runtime behavior distinct.

For an explanation, the chat coordinator delegates to a conformance reviewer that
uses the read-only local `validate_network` action (`website_validate_network` in
the runtime). It explains returned evidence rather than inventing a verdict. A
configuration graph shows intended wiring; a separate execution graph shows actual
latest-run agents, tools, peers and consent decisions.

**Spec Scout** is a separate informational agent site with cited MVP Profile 0.2
excerpts embedded in its public instructions. Ask it through Review Desk, inspect
the destination and approve contact: its exact named definition is fetched and the
peer executes locally in the caller's browser using the caller's selected router.
The visitor can decline. Site A binds `spec_scout` to
`https://spec-scout.pages.dev/spec_scout` under a closed policy with the matching
allowed origin. This is not a server-side call to B's agent or B's site actions;
its answers are specification help, not certification.

The key-free **Role Converter** accepts Theora project files, Markdown or
`.claude/agents` roles, and built-in **Claude agents team** / **Theora role team**
samples. It converts without an LLM, applies the shared static rules, and offers
`converted_team.network.json`, `agent-manifest.json` and `links.json` downloads.
Files are processed in the browser, not uploaded. **Open artifacts in Review Desk**
transfers the three objects once through same-origin sessionStorage for static
inspection only; it never loads the team into chat, executes it or grants consent.
The Node CLI uses the same pure conversion modules.

Generated front instructions now append a final-answer-only rule for the visitor;
specialists append an answer-only rule for the front's inquiry. Both exclude drafts,
plans, process notes and messages to other roles. Network/manifest descriptions
identify the selected Theora or Markdown format. These rules improve the instruction
contract, but do not guarantee a model's compliance or arbitrary answer quality.

The sites are static, on separate origins, with no application backend, database,
payment or authentication service. Static inspection/conversion require no key;
chat needs a visitor-provided OpenAI-compatible router/key. Product evidence and
measurement limits are in the [release ledger](demo-checklist.md#6-judge-ready-fixes-release-check),
not implied by this feature description.

## Testing instructions

### Key-free workflow

1. Open [Agent Review Desk / Site A](https://almightie0214.github.io/agentic-web/)
   in Edge or Firefox and wait for the ready/settings interface. Boot loads public
   metadata, not inference. If boot fails, the status should retain recovery guidance
   and a sanitized loader error; key-free checks remain available.
2. Select **Valid sample** and inspect its static report, then **Missing front_man**,
   **Invalid schema** or **Peer cycle** to see findings and hints. Or paste public
   manifest/network JSON and select **Validate pasted JSON**. The inspected network
   is data, not executed code. Do not paste secrets or private context.
3. Select **Audit This Site** or **Audit Linked Peer**, review the URL, then select
   **Audit URL**. Expect public artifact acquisition and static findings without a
   model call or peer invocation. A fetch error is not itself proof of a CORS cause.
4. Follow **Role Converter**, select **Theora role team** or **Claude agents team**,
   inspect the AW2 report and download all three JSON files. For your own public
   roles, select files/a project directory and **Convert and check**; include hidden
   directories for `.theora`/`.claude` discovery. **Open artifacts in Review Desk**
   is static review only, not execution.
5. Open [Spec Scout / Site B](https://spec-scout.pages.dev/) to check its boot and
   settings screen. No key is needed to load it; a question requires inference setup.

### Chat workflow (bring your own router access)

1. Open **⚙ AI model settings**. Hosted Otari
   (`https://api.otari.ai/api/v1`) is the default router;
   `alibaba/qwen3.8-flash` is the default model hint. Obtain authorized access to an
   OpenAI-compatible router. In **Advanced settings (optional)** set **Provider URL**
   and **Model** if needed, enter the **API key** and select **Save and start**.
   Use this same panel to switch models. We do not publish a shared key or promise
   a free inference entitlement; judge inference access remains an entrant-owned
   open item, not an inferred benefit of participant Otari credits.
2. The key is saved only in the visitor's browser, in origin-local profiles/tab
   settings, and sent to the selected inference router—not to the peer definition
   host. Never put it in a URL, prompt, artifact or shared evidence. BYOK does not
   isolate keys from untrusted JavaScript on the caller origin; request-level
   isolation claims must remain limited to actual measurements.
3. Ask Review Desk to explain supplied public artifacts. A validation question
   should produce coordinator → reviewer → local `website_validate_network` and
   a report-grounded answer; an action error is not a conformance verdict.
4. Ask: “Ask Spec Scout what MVP Profile 0.2 §3.2 requires for peer discovery.”
   Inspect the consent card for the new cross-origin contact and choose **Allow**.
   Expected post-fix behavior is a `consent` event and nonzero corresponding trust
   count, B manifest/definition fetch, `remote_call spec_scout`, peer inference on
   the caller router and a final answer. The post-deployment Edge/Firefox runs
   observed this execution path, with partial token corruption in the peer answer;
   this is not a clean/accurate-answer guarantee. The earlier 90-second timeout
   remains in the ledger. A decline is a valid refusal.
5. Inspect the execution graph/Developer view. A top-level execution failure should
   be visible as an error, not a successful answer containing failure text.
   Preparing a draft is not sending it or approving peer contact. Record deviations
   with revision/environment in the [release ledger](demo-checklist.md#6-judge-ready-fixes-release-check).

The implementer's release checks use a development router at
`http://127.0.0.1:8640/api/v1` and the fake `otk_sentinel_dev` browser key. Actual
keys remain in the user's private router key file, outside the browser; the
local router forwards to Otari. This verification setup is not a hosted judge
service or a shared-key access arrangement. Public-to-loopback setup did not finish
in default temporary profiles. Development Edge used
`--disable-features=LocalNetworkAccessChecks`; Firefox used the temporary-profile
preference `network.lna.skip-domains=127.0.0.1` (host-wide, not port-8640-only).
Firefox's initial request/settings timeout alone does not prove its precise cause;
completion under the changed condition is the measured result. Profiles were
removed afterward. These are development-router conditions, not normal judge setup,
product fixes or CSP relaxations.

## How we built it / technologies used

- JavaScript ES modules, HTML and CSS on GitHub Pages (only `site-a/`) and
  Cloudflare Pages (`site-b/`). Separate publication origins are intentional.
- Resolved JSON manifests/networks following Worldwide Agentic Web MVP Profile
  0.2 / Neuro SAN: no published includes/environment substitutions. Instructions
  and embedded excerpts are public; `site-b/spec-excerpts.json` is authoring data.
- Separately vendored nsDeploy reference runtimes from
  `cognizant-ai-labs/agentic-web`, pinned at
  `63a956cf4653f610b1c238c70946f4d7647d17a8`, not a replacement runtime. Earlier
  local changes remove obsolete compatibility paths, reject normalized duplicate
  agent names before map overwrite, and remove key-bearing cookie mirroring/hints.
  Origin-local profiles and per-tab precedence remain; old test cookies require
  private manual cleanup, not migration. Upstream licenses/documentation remain.
- Integrated runtime revision `ff3c493a569b22bd7037f3265ca215cc03d85fdb` retires
  LangChain selection/bundled loop, MCP, toolbox/REST tools, coded-tool sandbox
  workers and cross-origin action discovery/bridges/host forms. Unsupported
  declarations fail compilation; static kernel/generated classification remains
  for the validator. Same-origin action loading, `ActionRegistry`, `website_*`,
  confirmation UI, validation and write receipts remain. Local `validate_network`
  supplies the grounded capability; no MCP path is needed.
- That runtime unifies accepted-answer-or-error semantics: only `executeToolCalls`
  turns failures into error tool results, with diagnostics and uncertain-write
  receipts preserved. Empty/function-call-only answers, exhausted steps, limits,
  cycles and peer errors fail; a visitor's refusal remains normal. Valid
  presentation-only answers and normal prose about a tool error remain acceptable.
  Each invocation uses the earliest parent/composition/own absolute deadline;
  context functions, tool dispatch, model/peer I/O and pending input are scoped,
  with late input discarded. Child-only timeouts can be handled by the parent as
  tool errors; a parent timeout fails the parent and differs from steering.
- Revision `225890d241a9f4ef15956c9c3a69c5ece004d771` makes the composition deadline
  use the top network's `max_execution_seconds` (default 90, maximum 300 seconds).
  Review Desk declares 240, Spec Scout 180, and converted teams 240. Peers cannot
  extend the caller deadline. Runtime compilation rejects nonfinite/nonpositive
  time declarations and non-positive-integer `max_steps` at network/agent levels.
- Consent checks the immediate caller's policy before asking. Exactly one event
  identifies prompt Allow, prompt Always, remembered Always, Decline or headless
  default; Site A counts these separately. Both pages show sanitized loader details
  alongside fixed recovery guidance. Source changes do not prove deployed outcomes.
- A shared `site-a/validator-rules.mjs` serves the UI, local action, URL audit and
  static CLI. CLI-only checks cover local files/links, private-context declarations
  and applicable B CORS headers, not live browser behavior.
- Converter revision `495d04a6d5f488be9887900d36a2a80ef3ba1638` shares the parser's
  selected format across CLI/web emission, appending output rules (`CVT-NET-005`)
  and matching descriptions (`CVT-META-001`). The
  [mapping contract](converter.md) fixes front selection, sanitation and limits.
- CSP revision `b29ed15d5d57981df2be3e9b9f98b5707f297ace` adds restrictive meta to
  A home/converter and B home: self-only scripts, no inline script/eval or workers,
  scoped base/form/object restrictions, runtime-compatible styles, and HTTPS/
  loopback router connections. `tools/browser-check.mjs` checks candidate pages
  using headless Edge/CDP, two loopback origins and mock inference, with expected
  probe violations separated from unexpected violations. It is a Task check, not
  part of the merge gate; current results are recorded separately in the ledger.
- Node.js 24's built-in tests and static conformance CLI, without npm dependencies.
  Scripted model/fetch/storage tests are not live browser/provider observations.
- Apache-2.0 licensing, with original attribution and runtime licenses preserved.
  Local distribution notices: [A](../site-a/runtime/README.md),
  [B](../site-b/runtime/README.md). Preserved upstream prose is not support for
  locally retired capabilities.

### Converter CLI and limits

```sh
node tools/theora2hocon/theora2hocon.mjs <input-dir> <out-dir> [--front <role>] [--layout theora|markdown]
```

Auto selects exact `.theora/roles/<role>/agent.md` files when present, otherwise
Markdown; explicit layouts never fall back. Markdown discovery prefers immediate
`.claude/agents/*.md`, otherwise immediate root `*.md`. Front precedence is exact
`--front`, Theora config `front_man`, then first sorted name. Invalid input fails
rather than guessing. CLI exit 0 means written, not validated/deployed/executed.

The output is sanitized role text, a default front-to-specialist star graph and a
common `inquiry` schema, **not a Theora/Claude harness port**. Shell, git, gates,
tests, permissions, filesystem operations, scheduling, lifecycle hooks, state,
skills and source tools/MCP are not converted. Remaining prose grants none of
those capabilities. Secret/path pattern removal is incomplete: review every file,
source licensing and instruction suitability before publication. The three data
files need separate hosting with the reference runtime/settings; no app, runtime
adapter or new configuration UI is generated. A callable role alone is not proof
that a model will delegate or obey the output rule.

## Judging criteria

Source: [Devpost Official Rules §6, “Judges & Criteria”](https://cognizant-agenticweb.devpost.com/rules).
The same four criteria appear on the [competition overview](https://cognizant-agenticweb.devpost.com/).
The official wording below was supplied by the entrant; it is not part of the
pinned technical specification.

> Stage One) The first stage will determine via pass/fail whether the Project is a conforming open agentic website as described in Submission Requirements

> Stage Two) All Submissions that pass Stage One will be evaluated in Stage Two based on the following equally weighted criteria (the "Judging Criteria"), and according to the sole and absolute discretion of the judges:

Static CLI exit 0 does not establish Stage One acceptance. The responses below
describe functionality and limits, not eligibility or a judging result.

### 1. Technological Implementation

> How well is the project built, and how effectively does it use the open agentic web specification?

The project reuses the reference browser runtime and shared validator rather than
inventing a protocol or duplicating rules. Two-agent delegation, a local read-only
action, resolved public definitions, symbolic peers and separate origins map to the
MVP profile. The current runtime makes failures/cancellation explicit and puts
consent behind caller policy. The converter shares deterministic CLI/browser rules
and fits the §7 converter opportunity without pretending to port a harness. Page
CSP restricts executable code while permitting configurable inference routes.

Historical local runs cover delegation, consent/refusal, duplicate rejection,
caller-router retention, scoped key/context isolation and cycle/call-cap cases.
Historical public run 2 produced a normal section-cited peer answer but exposed a
missing Allow event; AW5 conversion loaded/delegated twice but answers leaked drafts
and garbled lines. The new source fixes those contracts, not the historical results.
The pre-deadline-config Edge flow then failed at 90 seconds. After configurable
limits landed/deployed, both public browsers returned a real peer answer and final
prose, each with one Allow event/trust count. Partial peer text corruption remains,
not a quality PASS. The CLI-generated Theora run's final answer had no observed
draft/meta text, while its specialist did. Exact conditions, local-filter request
attribution and remaining limits are in the
[release ledger](demo-checklist.md#6-judge-ready-fixes-release-check).

### 2. Design

> Does the project deliver a complete, coherent product experience not just a technical proof of concept?

The workflow connects key-free inspection, actionable report locations, reviewed
chat drafts and optional specification help. The converter adds files/samples →
conversion → static findings → downloads or one-time Review Desk inspection,
without turning inspection into execution. Static checks remain usable when chat
fails; built-in settings handle model selection instead of a second configuration
UI. Expected configuration and observed execution are shown separately. The planned
video will follow one actual correction/delegation/consent story; it has not been
recorded. Historical instruction/output failures remain in the ledger, not hidden
by a successful second run or a claim of universal model reliability.

### 3. Potential Impact

> Does the project make a credible, specific case for solving a real problem for a real audience and does the solution actually address it based on what's demonstrated? Does the project include any tools or services the Entrant built and shared with the community while creating the Project?

The audience is authors of portable browser agent networks who need to locate
invalid artifacts without confusing declarations with safety proof. Deterministic
reports and section-cited explanations make correction paths and evidence gaps
explicit. The role converter gives authors with Theora/Markdown instructions a
predictable, inspectable starting graph rather than a false claim of executable
harness equivalence. The validator, static CLI, CLI/web converter and samples/tests
are in the **PUBLIC Apache-2.0**
[repository](https://github.com/almightie0214/agentic-web).
Community-sharing activity is unrecorded; no adoption, measured improvement or
universal answer-quality result is claimed. The bounded public and converter runs
are demonstrations, not evidence of community use or complete submission readiness.

### 4. Quality of the Idea

> Is this a creative, non-obvious use of an open agentic website and does the team show genuine understanding of the problem space?

An agentic website reviews the artifacts of other agentic websites, with a separate
excerpt-grounded peer for specification context. Deterministic judgment stays
separate from model explanation, and static configuration stays separate from
runtime evidence. That evidence-led workflow reflects the trust boundaries rather
than treating every plausible model answer as certification. We make no unsupported
claim of being first, uniquely compliant or proven secure.

Official tie-breaking rule (same source):

> Tie Breaking: For each Prize listed below, if two or more Submissions are tied, the tied Submission with the highest score in the first applicable criterion listed above will be considered the higher scoring Submission. In the event any ties remain, this process will be repeated, as needed, by comparing the tied Submissions' scores on the next applicable criterion. If two or more Submissions are tied on all applicable criteria, the panel of Judges will vote on the tied Submissions.

## Challenges, observations and next work

An origin allowlist is not proof of consent, a private-context declaration is not
proof of filtering, and `_headers` is not a public response measurement. Publishing
the repository root would also mix A and B origins; the workflow publishes only
`site-a/` and B has its own root. The static CLI retains runtime uncertainty even
when local files pass. The [README spec mapping](../README.md#checks-and-spec-mapping)
connects implementation to these boundaries.

The ledger preserves the earlier evidence rather than silently promoting it to the
current release:

- **Local AW4 run 1:** delegation/action and panel switching, approval/decline,
  denied-origin no-contact paths, wrong-name refusal, sentinel field filtering,
  synthetic cycle interruption and a **24-agent cap** observation. Duplicate names
  were wrongly accepted; a key-bearing cookie reached A's static server. These
  failures remain recorded.
- **Local AW4 run 2:** corrected A/B top-loader duplicate variants and duplicate-peer
  refusal, panel persistence/tab priority/model switching and observed A/B key
  isolation with caller-router retention. Old-key revocation was later user-reported;
  unrelated run 1 cases were not all repeated.
- **Historical public §4:** HTTPS/ACAO/404 measurements at revision `298ce2b`;
  pre-run A links/manifest/review_desk bytes matched main `24395e4` (same three files
  as `298ce2b`). Public input 59 returned literal WebFetch markup and a retry was
  declined. Input 61's Edge run observed no B request before Allow, then B
  manifest/definition 200 and links 404, local peer/caller-router use and a normal
  §3.2-cited answer. Three B GETs contained no key/Cookie/Authorization/body or
  redirect. Exact quotation fidelity was unchecked; Allow event count was zero and
  a separate `lc.getunicorn.org` request had unknown attribution. This is scoped
  historical evidence, not universal non-disclosure or a new revision check.
- **Historical AW5:** a generated Theora sample on loopback loaded and delegated in
  `s3` and `s300` (2 agent and 3 model-call spans each), but **answer quality failed
  twice** with drafts/meta text and garbled lines. Same-tab trace/history located
  the text in model content, not converter/runtime corruption; provider response
  bodies and outside-runtime/other-model comparisons were absent. At that time the
  user withdrew the correction request; the current Goal subsequently introduced
  output rules. The old records neither test those rules nor prove them effective.

**Current release observations:** after `deadline-config` landed at `origin/main`
`225890d`, the implementer rechecked public changed-file bytes, ran that revision's
mock-router browser check and local duplicate-loader/redaction check, completed the
public Edge/CDP and Firefox/BiDi peer flows, and executed one CLI-generated Theora
sample on `127.0.0.1:8601`/`127.0.0.1:8602`. Public runs recorded one consent event /
`Allow once: 1` each, 32 observed B requests per browser without sentinel/Cookie/
Authorization, and zero A/converter/B CSP events. Real peer agent results matched
the successful caller tool-result prefixes; caller final prose completed. That is
runtime-contract completion, **not answer-quality PASS**: both peer answers had
partially garbled tokens. The Theora final answer had no observed draft/meta
sentences, but its specialist retained such text. No repeated paid attempts were
used to hide these outcomes. Default-profile loopback setup failures and the
throwaway-profile LNA exceptions remain explicit development conditions. The earlier
90-second timeout is still a failure record. The local Unicorn Pro diagnosis is
separate from site-source behavior. See the ledger for the observations and scoped
unknowns; this document does not establish independent review/gate or judge access.

Complete provider headers/bodies, broad context/prompt/action/error inspection,
exact quotation fidelity, arbitrary converted inputs and unrecorded subcases remain
outside what historical observations establish. Append environment, revision, exact
commands/results and sanitized observations to the
[release ledger](demo-checklist.md#6-judge-ready-fixes-release-check).
Do not retain real keys or equate a checklist with execution evidence.

## Demonstration video plan

Keep the entrant's own English explanation **under two minutes**, published as a
**public YouTube video**. Follow one actual story: broken artifact → deterministic
finding/correction → coordinator/reviewer/action → consent/exact peer → sanitized
evidence. Use the built-in panel for model switching. Never splice unexecuted
scenarios into apparent successes. Confirm duration/access before submission.
Recording, screenshots and submission are outside this Goal.

## Submission and public-access handoff

Unchecked rows are open. Owners identify the next responsible party, not proof that
an action occurred. Preserve historical failures and record URLs, dates, revisions
and evidence as new work completes; never record credentials.

**Submission deadline: 2027-01-11 08:00 PT = 2027-01-12 01:00 KST.**

| Done | Item | Owner / required input | Evidence or current state |
| --- | --- | --- | --- |
| [ ] | Finalize criterion responses against current demonstration evidence | Entrant | Current source contracts and §6 post-deployment observations described; final entrant claims review pending, residual peer/internal specialist quality limitations retained |
| [x] | Public source repository and license | Repository account owner; HTTP measured by implementer | https://github.com/almightie0214/agentic-web — PUBLIC, Apache-2.0; credential-free GitHub API 200 on 2026-11-16T05:51:41.649Z (R01, §6). This is not a community-sharing/adoption result |
| [ ] | Record community-sharing activity for reusable validator/CLI/converter | Entrant | Sharing activity unrecorded; public repository existence alone is not an activity or adoption record |
| [x] | Historical activation of A/B and paired public binding | Hosting account owners | A: https://almightie0214.github.io/agentic-web/ ; B: https://spec-scout.pages.dev/ ; §4 measured public artifacts/ACAO/404 and the paired binding at earlier revisions, not current byte correspondence |
| [x] | Preserve earlier public consent/peer flow and converter diagnosis | User / browser operator | §4 input 61 normal answer with scoped B wire isolation; input 59 markup failure, zero Allow events and unknown request attribution retained. AW5 load/delegation PASS, quality FAIL twice retained; not current release acceptance |
| [x] | Verify current deployed A/B bytes and local browser check | Release-check implementer | §6 post-deadline-config: public changed files byte-match origin/main 225890d at canonical URLs; 16 removed modules 404. Landed-tree browser-check exit 0, Edge 157.0.4341.60/mock router, unexpected CSP 0, inline/eval blocked. Fresh local boot-error/redaction check exit 0; no real-key browser entry |
| [x] | Record post-deadline-config public Edge/CDP and Firefox/BiDi observations | Release-check implementer / existing development router | §6: both execution flows completed with actual peer result/final prose, consent/trust 1 and scoped wire/CSP checks; partial peer text corruption remains, not answer-quality PASS; disposable-profile LNA exceptions required for development router |
| [x] | Run current CLI-generated Theora bundle on loopback and inspect final answer | Release-check implementer / development router | §6: 225890d CLI bundle, 8601/8602, one live run completed; no observed final draft/meta sentences, internal specialist meta/awkward text retained; old s3/s300 quality FAIL unchanged |
| [ ] | Complete independent release evidence review; retain other scoped unknowns | Independent reviewer / engine, then entrant claims review | Mandatory observation rows now have results, not universal quality/security proof. Review and engine checks are not claimed complete by this draft; provider/context/quotation claims remain unverified |
| [ ] | Capture/select English screenshots | Entrant | Outside this Goal; pending; show actual UI/findings and remove keys/personal data |
| [ ] | Publish entrant's own English explanation, under two minutes, on YouTube | Entrant / YouTube account | Outside this Goal; URL/duration/public-access check pending |
| [ ] | Final English materials review | Entrant | README/testing instructions and draft are English; screenshots/video/final form still need review |
| [ ] | Optional Otari account/feedback | Entrant / chosen account/channel | Official Rules §4 makes account/feedback optional; correspondence unrecorded, not a mandatory email or release blocker |
| [ ] | Arrange and verify independent judge inference access | Entrant / router-access arrangement and independent check | Entrant-owned open item. Static pages/artifacts need no key; chat needs supported OpenAI-compatible router/key configured in ⚙ settings. No shared key published; participant Otari credit guidance does not establish judge access |
| [ ] | Independently verify public site/artifact/video access | Entrant / independent access check | Historical A/B availability is recorded; independent judge and video access remain unverified |
| [ ] | Submit Devpost entry by the deadline above and save confirmation | Entrant / Devpost account | Outside this Goal; not submitted; confirmation URL/timestamp pending |
| [ ] | Keep sites/artifacts/video accessible through **2027-01-19 10:00 KST (UTC+09:00)** | Entrant / hosting and video accounts | Commitment/monitoring records pending; equivalent UTC is 2027-01-19 01:00 UTC |

This document authorizes no account changes and establishes no competition
acceptance. Do not mark the project submission-ready while required release
evidence or judge access remains unresolved. New source fixes do not erase old
failures, and old observations do not verify a new deployed revision.
