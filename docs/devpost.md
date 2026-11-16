# Devpost submission draft — Agent Review Desk + Spec Scout

**Status: English draft, not a submitted or release-ready entry.** The
[demo evidence ledger](demo-checklist.md) records user-supplied local browser runs,
including AW4 failures and corrected rechecks. Separately, user-approved AW5
loopback runs in Claude desktop's built-in browser loaded a converted Theora team
and completed coordinator → specialist → coordinator twice (`s3`, `s300`), but
answer quality failed twice with leaked draft/meta text and garbled lines.
Same-tab trace/history diagnostics locate the defect in model output, with no
evidence of converter/runtime corruption. The user withdrew the requested
prompt/runtime correction and required no new paid run; answer quality is not
claimed to be fixed. See
[AW5 converter dogfooding](demo-checklist.md#aw5-converter-dogfooding).
Missing runtime observations, deployed URL/revision confirmation and measured
public HTTPS/CORS, screenshots, video, Otari correspondence, final submission and
judge access remain open. Replace open fields with verified facts before
publishing; do not turn scoped local observations into full release acceptance.

## Project name and short description

**Agent Review Desk + Spec Scout**

Inspect portable agent-network artifacts, get report-grounded explanations, and
consult a linked specification assistant through two static browser agent sites.
Convert Theora or Markdown roles into reviewable portable conversation artifacts.

## Inspiration and problem

A manifest and a plausible agent graph are not enough to show that a browser agent
site is interoperable. Authors need actionable artifact checks, but they also need
to know which claims require a browser run. We built a review desk that separates
deterministic static findings from runtime observations rather than letting an LLM
announce conformance without evidence.

## What it does

Agent Review Desk (Site A) lets visitors paste public manifest/network/links JSON,
try four built-in examples, or audit public artifact URLs without a model key.
Reports show rule IDs, statuses, JSON Pointer locations, and correction hints.
Acquisition failures, rule failures, warnings, and unverified behavior stay distinct.

For model-assisted explanations, a two-agent network routes the visitor's question
from `review_coordinator` to `conformance_reviewer`. The reviewer uses the read-only
`validate_network` site action, advertised by the reference runtime as
`website_validate_network`, and is instructed to explain only returned reports.
Missing artifacts or failed actions are not successful conformance verdicts.

Spec Scout (Site B) is an independent informational agent network whose public
instructions embed cited MVP Profile 0.2 excerpts. Site A exposes a symbolic
`spec_scout` peer tool through `links.json`. The intended flow is visitor approval,
exact-name definition loading, then peer execution inside the caller's browser
with the caller's router—not a server-side call to B's agent or B's site actions.
The current binding is `https://spec-scout.pages.dev/spec_scout`, paired with
`https://spec-scout.pages.dev` in Site A's allowed origins under a closed policy.
After normal runtime boot, the linked-peer audit preset is enabled and Spec Scout
explanation drafting is available when chat is ready. These configuration/UI facts
do not establish public availability, HTTPS/CORS or a successful live peer run.

The key-free **Role Converter** at `site-a/converter.html` accepts Theora project
files, generic Markdown / `.claude/agents` roles, or two-role **Claude agents team**
and **Theora role team** samples. The page uses shared pure modules to convert
without an LLM, then applies AW2 static rules, displays findings and offers three downloads:
`converted_team.network.json` (resolved JSON), `agent-manifest.json`, and an empty
peer-binding `links.json` stub. Files are processed in the browser, not uploaded.
**Open artifacts in Review Desk** uses a same-origin sessionStorage handoff that
is removed on receipt, including invalid payloads, then structure-checked and
statically validated. It is review-only: it does not load the converted team into
chat, execute it, supply credentials or waive peer consent.

The same conversion is available from Node:

```sh
node tools/theora2hocon/theora2hocon.mjs <input-dir> <out-dir> [--front <role>] [--layout theora|markdown]
```

Without `--layout`, an exact `.theora/roles/<role>/agent.md` selects Theora;
otherwise Markdown is selected. Markdown discovery prefers immediate
`.claude/agents/*.md`, then immediate root `*.md`; an agents directory itself also
works. Explicit layout selection does not fall back. Front precedence is exact
`--front`, Theora config's `front_man`, then the first name-sorted role. CLI exit 0
means files were written, not deployment or runtime validation. The complete
[mapping contract](converter.md) defines metadata, sanitization and failure rules.

This is role text plus a default front-to-specialist star graph and common
`inquiry` schema, not an executable Theora/Claude harness. Shell, git, gates,
permissions, filesystem operations, tests, state, skills, scheduling, lifecycle
hooks and source tools/MCP are not converted. Remaining prose grants none of those
abilities. Secret/local-path pattern removal is incomplete and never replaces
publication review. Authors must review every output and the suitability and
licensing of the source instructions. The three data files are not a hosted app;
publication with the reference runtime and its existing settings is separate.
There is no generated runtime adapter or second configuration UI. A callable role
is not evidence that a model actually delegates to it.

The UI distinguishes expected configuration from latest-run trace events. It is a
review aid, not a security certificate or an automated deployment repair service.

## How we built it / technologies used

- JavaScript ES modules, HTML and CSS for the static browser pages.
- Resolved JSON network definitions and manifests following the Worldwide Agentic
  Web MVP Profile 0.2 / Neuro SAN data model; no build-time includes or environment
  substitutions in published definitions. All published instructions are public.
- Separately vendored nsDeploy reference browser runtimes from
  `cognizant-ai-labs/agentic-web`, pinned at
  `63a956cf4653f610b1c238c70946f4d7647d17a8`. We did not build a replacement runtime.
  In addition to compatibility-code removals, local browser findings led to
  normalized duplicate-agent rejection in both `kernel.js` copies and removal of
  key-bearing cookie profile storage in both `byok.js` copies and its `ui.js` hint.
  Origin-local saved profiles and per-tab priority remain. The ledger preserves
  the original failures, manual old-cookie cleanup procedure and scoped rechecks.
- A shared deterministic rule module, `site-a/validator-rules.mjs`, reused by the
  UI, site action, URL audit and `tools/check-conformance.mjs`. The CLI adds file,
  local link, private-context declaration and CORS-configuration audits without
  emulating a browser or forcing the vendor loader to run in Node.
- Deterministic converter modules in `site-a/converter/`, reused by the Node CLI
  at `tools/theora2hocon/theora2hocon.mjs` and Site A's browser converter. This
  addresses the specification §7 framework-converter opportunity as role-text
  export, not full source-framework semantics. Generated artifacts can be checked
  with the existing AW2 rules and AW4 static CLI; these checks cannot establish
  runtime behavior or answer quality. The separate local browser record shows
  load/delegation PASS but model-output quality FAIL, not a guarantee of answer quality.
- The runtime's existing AI model settings panel for router/model selection and
  BYOK. Hosted Otari (`https://api.otari.ai/api/v1`) is the default router;
  `alibaba/qwen3.8-flash` is a model hint. Live inference needs a visitor key.
- Node.js 24's built-in test runner; no npm dependencies.
- GitHub Pages workflow publishing only `site-a/`; Cloudflare Pages configuration
  in `site-b/_headers` for public artifact CORS. Separate origins are intentional.
- Apache-2.0 licensing, with upstream attribution and runtime licenses preserved.

There is no application backend, database, payment or authentication service.
External model inference is not part of the static hosting bundle.

## Judging criteria

Source: [Devpost Official Rules §6, “Judges & Criteria”](https://cognizant-agenticweb.devpost.com/rules).
The same four criteria appear on the [competition overview](https://cognizant-agenticweb.devpost.com/).
The following official wording was supplied by the entrant for this draft; it is
not part of the pinned technical specification.

> Stage One) The first stage will determine via pass/fail whether the Project is a conforming open agentic website as described in Submission Requirements

> Stage Two) All Submissions that pass Stage One will be evaluated in Stage Two based on the following equally weighted criteria (the "Judging Criteria"), and according to the sole and absolute discretion of the judges:

Stage One acceptance is not established by our static CLI exit code. The four
Stage Two response paragraphs below describe the implementation and its remaining
evidence gaps; they do not assert eligibility, acceptance or a judging result.

### 1. Technological Implementation

> How well is the project built, and how effectively does it use the open agentic web specification?

The project reuses the reference browser runtime and one shared static validator
rather than inventing a protocol or duplicating rules. A two-agent graph, a
registered read-only site action, resolved public definitions, symbolic peer links,
and separate publication roots map directly to the MVP Profile 0.2. Relative paths
support subpath deployment. The CLI audits actual files and Site B's CORS
configuration without treating it as runtime proof. Local browser records now
support consent/refusal paths, exact-name loading, corrected duplicate rejection,
caller-router retention, observed static-request key isolation, sentinel field
filtering, cycle interruption and the 24-agent cap. These are bounded observations:
provider request headers/bodies, unexercised limits and public HTTPS/CORS remain
unverified; see the ledger for missing subcases and tested snapshot provenance.
The §7 converter shares deterministic parsing/emission across CLI and browser,
then sends artifacts to the same validator rather than inventing another rule set.
Separate from AW4, its generated Theora sample loaded and delegated successfully
in two local browser runs; both visible answers failed presentation quality.
Same-tab trace/history diagnostics locate the failure in model output: coordinator
drafts were already in streamed content and specialist output already contained
garbled tokens. There is no evidence of converter/runtime corruption; the user
withdrew the prompt/runtime fix request and required no new paid run.

### 2. Design

> Does the project deliver a complete, coherent product experience not just a technical proof of concept?

The intended experience connects key-free inspection, actionable report locations,
reviewed chat explanation drafts, and specification help in one review workflow.
The converter adds files/samples → shared conversion → static findings → download
or consume-once Review Desk inspection, without turning inspection into execution.
The UI separates expected configuration from observed execution, keeps static checks
usable when chat fails, and uses the reference runtime's model settings rather
than a second configuration UI. The planned demonstration will follow one problem
through correction, delegation, consent, peer use and evidence. B01 records the
local correction/delegation/action path with instruction deviations retained; run 2
rechecks panel persistence, tab priority and model switching. This is not a broad
usability study, a completed video or a demonstrated public deployment.

### 3. Potential Impact

> Does the project make a credible, specific case for solving a real problem for a real audience and does the solution actually address it based on what's demonstrated? Does the project include any tools or services the Entrant built and shared with the community while creating the Project?

The target audience is authors publishing portable browser agent networks who
need to locate invalid artifacts and avoid mistaking declarations for safety
proof. Deterministic reports and section-cited peer explanations aim to make fixes
and evidence gaps explicit. The §7 role converter offers a concrete starting point
for authors with Theora or Markdown/Claude role instructions: portable public text,
a predictable star graph and artifacts they can inspect before publication. It
does not transfer executable harness capabilities or prove semantic equivalence.
The repository contains the reusable validator, static CLI, converter CLI/web core
and sample/test inputs under Apache-2.0; confirming public repository access and
sharing these tools with the community remains a release handoff item. The impact
case is specific to that author workflow. Two local Theora-sample runs demonstrate
load and delegation, but both fail model-output quality; no quality guarantee
follows from conversion. No adoption, measured improvement, quality resolution or
completed public sharing is claimed.

### 4. Quality of the Idea

> Is this a creative, non-obvious use of an open agentic website and does the team show genuine understanding of the problem space?

The idea uses an agentic website to review the publication artifacts of other
agentic websites, with a separate excerpt-grounded peer for specification context.
It keeps deterministic judgment separate from model explanation, and static
configuration separate from runtime evidence. This evidence-led workflow reflects
the problem's trust boundaries rather than treating every plausible model answer
as certification. It makes no unsupported claim of being first, uniquely
compliant, or proven secure.

Official tie-breaking rule (same source):

> Tie Breaking: For each Prize listed below, if two or more Submissions are tied, the tied Submission with the highest score in the first applicable criterion listed above will be considered the higher scoring Submission. In the event any ties remain, this process will be repeated, as needed, by comparing the tied Submissions' scores on the next applicable criterion. If two or more Submissions are tied on all applicable criteria, the panel of Judges will vote on the tied Submissions.

## Challenges and lessons

The main challenge is respecting the boundary between declared configuration and
observed execution. An origin allowlist is not proof of consent; a private-context
allow rule is not proof of filtering; `_headers` is not a measured public response.
The CLI therefore retains runtime uncertainty even when its static checks pass.

Another boundary is deployment: publishing the repository root would mix Site B
with Site A's origin and defeat this project's two-origin demonstration. The
workflow uploads only `site-a/`, and Site B must be deployed independently.

## What is implemented, and what is next

The repository contains both site bundles, shared artifact checks, report-backed
agent instructions, peer wiring, tests, deployment configuration and the shared
CLI/web role converter. See the
[README spec mapping](../README.md#checks-and-spec-mapping) for the implemented
checks and their limits. This draft does not claim a public live demo or complete
runtime acceptance.

The [demo checklist and execution ledger](demo-checklist.md) now contain actual
user-supplied local browser observations, not just planned procedures. Run 1 used
Chrome on Windows with separate loopback origins and disposable JSON fixtures;
run 2 identifies corrected served runtimes by SHA-256. The ledger records dates,
revision/hash correspondence, steps, sanitized trace/request observations and
limits. These are supplied reports, not a fresh browser session run by this
draft's implementer:

- **Run 1 observations:** B01 records correction, coordinator/reviewer delegation,
  a succeeded site action and built-in-panel model switching, with instruction
  deviations retained. B02–B04/B06 record approval before peer contact, decline and
  denied-origin zero-contact paths, exact-name execution and wrong explicit-name
  refusal before peer inference. B05's invalid JSON, empty graph and missing local
  reference were refused before inference. B08 records actual invocation-option
  sentinel injection and filtered `remote_call.requestPayload.sly_data` field sets (public
  field only vs {}), not exact delivered values or general upstream scoping.
  B09 records synthetic cycle interruption without forbidden re-entry; B10 records
  rejection beyond the **24-agent cap only**.
- **Failures and corrections:** B05 originally accepted duplicate names and began
  inference. B07 retained the caller router and isolated the peer, but broader
  non-disclosure failed because a loopback cookie sent the key to A's static
  server. Both runtime copies were corrected at these causes. Run 1 FAIL records
  remain; neither passing spans nor later cleanup erase them.
- **Run 2 rechecks:** A/B top loaders refuse exact, trimmed and replacement_strings
  duplicate names before model calls; the duplicate peer is refused before peer
  execution. Panel save/select/delete/reload, tab priority and two live models pass.
  Observed A/B static requests contain no key; the profile cookie is not regenerated.
  Peer calls retain A's selected router/model despite conflicting B metadata on
  both models. The user subsequently confirmed old-key revocation, not an
  independently verified account timestamp. Unrelated run 1 cases were not all
  rerun on the corrected runtime.

The [AW5 converter record](demo-checklist.md#aw5-converter-dogfooding) is separate
from AW4. Under user approval, the Claude desktop built-in browser on Windows 11
(version not captured) loaded a generated **Theora role team** bundle on loopback.
Browser conversion passed AW2 static rules with runtime items still unverified;
the served bundle was rebuilt through the CLI using the shared emitters. With
non-mock `api.otari.ai` / `alibaba/qwen3.8-flash`, each of `s3` and `s300` completed
coordinator → specialist → coordinator (2 agent spans, 3 model-call spans).
**Load/delegation: PASS; answer quality: FAIL twice.** Draft/meta text and garbled
lines appeared in both visible answers; the second also contained a readable final
outline, which does not erase the leaked draft. Follow-up inspection of the same
tab's trace/history locates the failure in model output: coordinator final calls
`s134`/`s507` already streamed the draft in content (2477/6580 characters), matching
the returned/displayed answer lengths. Specialist output was already garbled.
No converter/runtime corruption was evidenced. Provider response bodies were not
captured, and no other-model or outside-runtime comparison was performed. The user
withdrew the earlier quality-fix request and asked to retain prompts/runtime and
finish without another paid run; the quality FAIL remains recorded, not repaired.

The source run used revision `298ce2bee1001e7186e7f5325975c063729881d5`; it is
supplied evidence, not a fresh run by this draft's implementer. Converter/runtime
paths match the original Task base `27c293226bb67d7efae2429610060a79c352f324`.
That base still used the reserved Review Desk binding; the reported source and
current checkout use the `pages.dev` binding. The generated manifest instead used
empty allowed peers with a closed policy. This run does not verify CORS, consent,
limits, private-context isolation, cycles or public HTTPS. Static snapshots/AW2 reports/AW4 CLI checks and
the AW4 browser runs cannot replace missing AW5 observations or establish quality.

Next work follows the ledger's
[current acceptance summary and owners](demo-checklist.md#current-acceptance-summary-and-remaining-owners):

- Direct provider request headers/bodies, complete definition-response-body
  inspection, missing sentinel-header checks and comprehensive prompt/action/error
  inspection remain unverified. Authenticated success and negative trace checks
  cannot substitute for those boundary observations.
- Other execution limits, including in-flight deadline behavior, remain unverified.
  Browser replacement_values duplicate handling and top B malformed, empty-graph
  and missing-reference variants were not separately recorded. Node coverage is
  not browser evidence for those subcases.
- Confirm separate public hosts and deployed revisions match the configured
  `https://spec-scout.pages.dev/spec_scout` binding and paired allowed origin;
  measure public HTTPS/CORS, recheck the relevant public-revision browser paths,
  and confirm independent judging access. The binding is already configured;
  local CORS usability does not establish public Cloudflare response headers.

Append follow-up environment/revision, steps, observations, verdicts and sanitized
evidence to the ledger; never retain real keys. Node exit 0 or a written checklist
does not complete missing cases. Environment/account-blocked cases stay unverified
with the required user input identified. No separate evidence JSON download or
forced Node execution of the browser vendor loader is required.

## Demonstration video plan

Keep the entrant's own English explanation **under two minutes** and upload it as
a **public YouTube video**. Focus on one story: a broken artifact → deterministic
finding and correction → coordinator/reviewer/action → consent and exact peer call
→ sanitized evidence. Use the built-in model settings panel for model switching.
Do not splice unexecuted scenarios into apparent successes. Confirm the final
video's duration and public accessibility before putting its URL in the submission.

## Submission and public-access handoff

All unchecked items are open. Roles below indicate the next responsible party,
not an assertion that an action has occurred. Record URLs, dates, revision and
evidence locations as items are completed. Do not put credentials in this tracker.

| Done | Item | Owner / required input | Evidence or current state |
| --- | --- | --- | --- |
| [ ] | Finalize the four criterion responses against actual demonstration evidence | Entrant | Official Rules §6 quoted above; local run 1/run 2 evidence summarized here, public demonstration and final claims review pending |
| [ ] | Confirm public repository access and share the reusable tools, including the converter CLI/web core, with the community | Entrant / repository account | Public repository URL and access/sharing record pending; repository implementation is not a sharing/adoption result |
| [ ] | Activate Site A GitHub Pages and record its public HTTPS URL | Repository account owner | URL pending; workflow exists, activation unverified |
| [ ] | Deploy Site B to Cloudflare Pages on a separate origin and record its HTTPS URL | Cloudflare account owner | URL pending; `_headers` exists, public response unverified |
| [ ] | Verify deployed peer address and A's published binding/allowed origin match the configured values | Deployer + maintainer | `site-a/links.json` already binds `https://spec-scout.pages.dev/spec_scout`; `site-a/agent-manifest.json` allows the matching origin under closed policy, and `tests/peer.test.mjs` pins this URL. Placeholder replacement is complete as configuration, not proof of deployment/access. Confirm deployed revision/artifact correspondence; if the destination changes, update link, allowed origin and test expectations together and redeploy A |
| [ ] | Capture public artifact HTTPS/CORS responses and verify cross-origin browser retrieval | Deployer + browser verifier | Measured URL/status/headers/date/revision pending; local configuration is insufficient |
| [ ] | Complete missing real-browser observations and public-revision checks; resolve or explicitly retain blocked cases | Browser verifier + entrant for environment/accounts | Local run 1 and corrected run 2 observations are in the demo ledger; provider headers/bodies, unexercised limits and public acceptance remain unverified |
| [x] | Observe a converted bundle's real-browser load/delegation and record the answer-quality diagnosis | User-authorized browser operator; user decision received 2026-11-16 | [AW5 dogfooding record](demo-checklist.md#aw5-converter-dogfooding): Theora sample load/delegation PASS in `s3`/`s300` (2 agent / 3 model-call spans each); model-output quality FAIL twice. Trace/history locate drafts and garbled text in model content, without converter/runtime corruption evidence. User withdrew the prompt/runtime fix request; no new paid run required. Quality resolution and public acceptance are not claimed |
| [ ] | Capture and select English screenshots for submission | Entrant | Images pending; show actual UI and findings, remove keys/personal data |
| [ ] | Record entrant's own English explanation, under two minutes, as a public YouTube video | Entrant / YouTube account | Public URL, duration and access check pending |
| [ ] | Finalize all submission materials in English | Entrant | README and this draft are English; screenshots/video/final form still need review |
| [ ] | Send the required Otari email with improvement feedback and track any response | Entrant / confirmed recipient address and email account | Recipient, sent date, improvement feedback and correspondence record pending; no email sent by this task |
| [ ] | Verify judge access to the public sites, artifacts and video; give accurate inference setup instructions | Entrant / independent access check | Public URLs and access results pending; document visitor-key requirement without disclosing a key |
| [ ] | Complete final Devpost submission and save its confirmation/entry URL | Entrant / Devpost account | Not submitted; submission URL and timestamp pending |
| [ ] | Keep sites, public artifacts and video accessible through judging end: **2027-01-19 10:00 KST (UTC+09:00)** | Entrant / hosting and video account owners | Availability commitment and monitoring/access records pending; equivalent UTC time is 2027-01-19 01:00 UTC |

Account setup, email, publication, final submission and the availability commitment
require the entrant's action. This document does not authorize them or establish
competition acceptance. Do not mark the project submission-ready while public
HTTPS/CORS or judge access is unverified. Preserve unresolved observations honestly
rather than replacing them with static test results.
