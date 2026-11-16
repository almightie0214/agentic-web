# Devpost submission draft — Agent Review Desk + Spec Scout

**Status: English draft, not a submitted or release-ready entry.** The
[demo evidence ledger](demo-checklist.md) records user-supplied local browser runs,
including failures and corrected rechecks, and 2026-11-16 public HTTPS/ACAO/404
measurements against revision `298ce2bee1001e7186e7f5325975c063729881d5`.
Site A and Site B are publicly hosted and the public binding is deployed. The
user-operated public run 2 (input 61) observed consent UI→Allow→B artifact reads→
local peer execution on the caller's Otari router→a normal §3.2-cited answer, with
wire-level key/Cookie/Authorization absence on the three B GETs. Pre-run A links,
manifest and review_desk bytes matched main `24395e4238994a5f76f5cd630d1aa17de4412896`
(the same three files as binding revision 298ce2b). Input 59's failed answer remains
historical; its WebFetch-markup failure did not recur and its cause is unknown.
The zero Allow event count remains a defect candidate; quotation fidelity and
attribution of a separate `lc.getunicorn.org` request are unchecked. Other missing
runtime observations, screenshots, video, final submission and independent judge
access remain open.
Otari account creation/feedback is optional under Official Rules §4, not a release
requirement. Replace open fields with verified facts before publishing; do not turn
scoped observations into full release acceptance.

## Project name and short description

**Agent Review Desk + Spec Scout**

Inspect portable agent-network artifacts, get report-grounded explanations, and
consult a linked specification assistant through two static browser agent sites.

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
The public [Site A](https://almightie0214.github.io/agentic-web/) now binds to
`https://spec-scout.pages.dev/spec_scout`, with the matching allowed origin under
closed policy. [Site B](https://spec-scout.pages.dev/) serves its manifest and exact
network as JSON with ACAO `*`; absent paths return 404 rather than an SPA fallback.
Immediately before 03:00Z on 2026-11-16, credential-free GETs of A's links,
manifest and review_desk definition matched main 24395e4 byte-for-byte; those three
files are unchanged from 298ce2b. In public run 2, a fresh Edge
157.0.4341.60 (Chromium 157) temporary profile on Windows 11 x64 used CDP Network +
ExtraInfo wire capture and the built-in panel with an Otari competition-credit key
and `alibaba/qwen3.8-flash`. At 03:02:14.216Z the consent card was visible with zero B
requests; Allow at 03:02:15.732Z preceded B manifest at .733Z and definition at .834Z
(both 200, application/json, ACAO `*`) and absent links.json at .985Z (404,
text/html;charset=utf-8, ACAO `*`). All three were GETs without redirect or body,
Authorization or Cookie; no `otk_` marker appeared in URL/header values/body.
The trace showed `remote_fetch`→`remote_call spec_scout`→peer agent/model, then a
normal caller answer at 03:03:37.312Z citing §3.2 and separating requirements from
observations. Exact quotation fidelity is unchecked. Caller/peer/caller produced
three POST 200s, two models GET 200s and five OPTIONS 200s on `api.otari.ai`, with
no other model host observed. The Allow event count remained zero; this is a defect
candidate, not missing visual/wire ordering evidence. A separate `lc.getunicorn.org`
request has unknown attribution; observed B isolation is not universal key
non-disclosure proof. Public run 1 (input 59) returned literal WebFetch markup and
a retry was declined; run 2 did not reproduce it, without establishing its cause.
See [the public ledger](demo-checklist.md#4-public-deployment-measurements-and-judging-handoff).

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
comprehensive provider/prompt/action/error inspection and unexercised limits remain
unverified. Public HTTPS/ACAO/404 responses are measured. Public run 2 adds visual
consent→Allow→B manifest/definition/links wire reads→peer/caller-router model use
and a normal §3.2-cited answer, plus key/Cookie/Authorization absence on B GETs.
Input 59's failed answer remains historical. The zero Allow event count remains a
defect candidate; quotation fidelity and attribution of the separate
`lc.getunicorn.org` request remain open. See the ledger for bounded observations,
not a universal security claim or a substitute for independent judge access.

### 2. Design

> Does the project deliver a complete, coherent product experience not just a technical proof of concept?

The intended experience connects key-free inspection, actionable report locations,
reviewed chat explanation drafts, and specification help in one review workflow.
The UI separates expected configuration from observed execution, keeps static checks
usable when chat fails, and uses the reference runtime's model settings rather
than a second configuration UI. The planned demonstration will follow one problem
through correction, delegation, consent, peer use and evidence. B01 records the
local correction/delegation/action path with instruction deviations retained; run 2
rechecks panel persistence, tab priority and model switching. This is not a broad
usability study or a completed video. Public run 2 in §4 reached the peer and
returned a normal answer with §3.2 attribution and requirements/observations
separated. Public run 1's WebFetch-markup failure remains historical and unexplained;
a successful second run does not establish universal model reliability or exact
quotation fidelity.

### 3. Potential Impact

> Does the project make a credible, specific case for solving a real problem for a real audience and does the solution actually address it based on what's demonstrated? Does the project include any tools or services the Entrant built and shared with the community while creating the Project?

The target audience is authors publishing portable browser agent networks who
need to locate invalid artifacts and avoid mistaking declarations for safety
proof. Deterministic reports and section-cited peer explanations aim to make fixes
and evidence gaps explicit. The repository contains the reusable validator, static
CLI and sample/test inputs under Apache-2.0; confirming public repository access
and sharing these tools with the community remains a release handoff item. The
impact case is specific to that author workflow; no adoption or measured improvement
is claimed. Public run 2 demonstrates one bounded specification-question flow,
not adoption or a complete submission demonstration.

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
workflow uploads only `site-a/`, and Site B is deployed independently to
`https://spec-scout.pages.dev/` with `site-b/` as its publication root. Public
responses, rather than configuration alone, now establish the measured ACAO and
missing-path 404 behavior.

## What is implemented, and what is next

The repository contains both site bundles, shared artifact checks, report-backed
agent instructions, peer wiring, tests and deployment configuration. See the
[README spec mapping](../README.md#checks-and-spec-mapping) for the implemented
checks and their limits. Public A and B now serve the paired publication artifacts;
the HTTP measurements alone do not establish a live peer demo. Public run 2 adds
actual browser consent/peer/caller-router execution, B wire isolation observations
and a normal answer after input 59's failure. Complete runtime acceptance is not
established; retained defects, unknowns and unrelated missing cases remain explicit.

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
- Separate public hosts and the paired binding are deployed. Credential-free GETs
  on 2026-11-16 measured HTTPS 200/ACAO `*` for both sites' home pages, manifests
  and exact definitions, no redirects, and B's missing paths returning 404.
  A links/manifest initially byte-matched 298ce2b; 02:31Z and 03:06Z HTTP probes
  reconfirmed responses and hashes. Just before 03:00Z the operator also checked
  A links/manifest/review_desk bytes against main 24395e4, unchanged from 298ce2b.
  Public run 2 (input 61) then captured zero pre-Allow B requests,
  manifest/definition 200 and links 404 with response headers, B wire
  key/Cookie/Authorization absence, `remote_call spec_scout`, caller-router model
  calls and a normal §3.2-cited answer. This closes input 59's missing B wire
  observations, not every runtime case. Allow event count remains zero; quotation
  fidelity, the first run's failure cause, separate-request attribution and
  independent judging access remain open.

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
| [ ] | Finalize the four criterion responses against actual demonstration evidence | Entrant | Official Rules §6 quoted above; local runs and public input 61's successful bounded answer/wire observations summarized, input 59 failure retained; final claims review pending |
| [ ] | Confirm public repository access and share the reusable tools with the community | Entrant / repository account | Public repository URL and access/sharing record pending |
| [x] | Activate Site A GitHub Pages and record its public HTTPS URL | Repository account owner; HTTP measured by implementer | https://almightie0214.github.io/agentic-web/ — 2026-11-16 public 200; §4 records artifact correspondence to 298ce2b |
| [x] | Deploy Site B to Cloudflare Pages on a separate origin and record its HTTPS URL | Cloudflare account owner; HTTP measured by implementer | https://spec-scout.pages.dev/ — public manifest/network 200 + ACAO `*`, missing paths 404, no redirects; §4 |
| [x] | Publish public peer URL and paired allowed origin; align production tests and redeploy A | Maintainer | Commit 298ce2bee1001e7186e7f5325975c063729881d5 binds https://spec-scout.pages.dev/spec_scout and allows https://spec-scout.pages.dev; deployed A files byte-match source; production tests derive paired settings, one assertion pins public B |
| [x] | Capture credential-free public artifact HTTPS/ACAO/404 responses | Implementer | §4: 2026-11-16T01:41:11.454Z–01:41:12.661Z, 02:31:27.844Z–02:31:28.965Z and latest 03:06:50.606Z–03:06:51.131Z probes, Node v24.16.0/Windows x64, revision 298ce2b, URLs/status/Content-Type/ACAO/redirects and hashes recorded |
| [x] | Observe public consent→peer→caller-router flow and B request key isolation | User / delegated browser operator | Input 61, 2026-11-16 03:02–03:03Z, Edge 157/Windows 11 x64 fresh profile, CDP Network + ExtraInfo: consent before all three B GETs, manifest/definition 200 and links 404 with ACAO `*`, no B key/Cookie/Authorization/body/redirect; caller/peer/caller Otari POST 200; normal §3.2-cited answer. Pre-run A bytes match main 24395e4 (same three source files as 298ce2b). Allow event count zero remains a defect candidate; quotation fidelity and separate-request attribution unchecked. Input 59 failure remains historical, cause unknown; §4 |
| [ ] | Complete missing real-browser observations and public-revision checks; resolve or explicitly retain blocked cases | Browser verifier + entrant for environment/accounts | Local run 1 and corrected run 2 observations are in the demo ledger; comprehensive provider/prompt/action/error inspection and unexercised limits remain unverified; public run 2 flow is observed, not full runtime acceptance; retain zero Allow event count and other §4 limits |
| [ ] | Capture and select English screenshots for submission | Entrant | Images pending; show actual UI and findings, remove keys/personal data |
| [ ] | Record entrant's own English explanation, under two minutes, as a public YouTube video | Entrant / YouTube account | Public URL, duration and access check pending |
| [ ] | Finalize all submission materials in English | Entrant | README and this draft are English; screenshots/video/final form still need review |
| [ ] | Optional: create an Otari account and provide improvement feedback; email only if the entrant chooses | Entrant / account or chosen feedback channel | Official Rules §4: “Optionally create an Otari account and provide feedback”; not a mandatory email or submission blocker. No email sent by this task; any chosen correspondence remains unrecorded |
| [ ] | Verify judge access to the public sites, artifacts and video; give accurate inference setup instructions | Entrant / independent access check | A/B URLs are recorded above, but independent judge access and video access remain unverified; live inference requires the visitor's supported router/key, never a shared published key |
| [ ] | Complete final Devpost submission and save its confirmation/entry URL | Entrant / Devpost account | Not submitted; submission URL and timestamp pending |
| [ ] | Keep sites, public artifacts and video accessible through judging end: **2027-01-19 10:00 KST (UTC+09:00)** | Entrant / hosting and video account owners | Availability commitment and monitoring/access records pending; equivalent UTC time is 2027-01-19 01:00 UTC |

Optional Otari account/feedback or email, video publication, final submission and
the availability commitment require the entrant's action. This document does not
authorize account changes or establish competition acceptance. Do not mark the
project submission-ready while required runtime evidence, retained defect review
or judge access remains unresolved. Preserve unresolved observations honestly rather
than replacing them with static test results.
