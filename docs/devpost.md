# Devpost submission draft — Agent Review Desk + Spec Scout

**Status: English draft, not a submitted or release-ready entry.** The
[demo evidence ledger](demo-checklist.md) records user-supplied local browser runs,
including failures and corrected rechecks. Missing runtime observations, public
URLs/HTTPS/CORS, screenshots, video, Otari correspondence, final submission and
judge access remain open. Replace open fields with verified facts before
publishing; do not turn scoped local observations into full release acceptance.

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
This wiring exists, but the current target is the reserved
`https://spec-scout.invalid/spec_scout`, not a reachable public deployment.

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
provider request headers/bodies, unexercised limits and public HTTPS/CORS remain
unverified; see the ledger for missing subcases and tested snapshot provenance.

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
usability study, a completed video or a demonstrated public deployment.

### 3. Potential Impact

> Does the project make a credible, specific case for solving a real problem for a real audience and does the solution actually address it based on what's demonstrated? Does the project include any tools or services the Entrant built and shared with the community while creating the Project?

The target audience is authors publishing portable browser agent networks who
need to locate invalid artifacts and avoid mistaking declarations for safety
proof. Deterministic reports and section-cited peer explanations aim to make fixes
and evidence gaps explicit. The repository contains the reusable validator, static
CLI and sample/test inputs under Apache-2.0; confirming public repository access
and sharing these tools with the community remains a release handoff item. The
impact case is specific to that author workflow; no adoption, measured improvement
or completed public demonstration is claimed.

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
agent instructions, peer wiring, tests and deployment configuration. See the
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
- Activate separate public hosts, bind the real peer URL and allowed origin
  together, measure public HTTPS/CORS, recheck the relevant public-revision browser
  paths, and confirm independent judging access. Local CORS usability does not
  establish public Cloudflare response headers.

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
| [ ] | Confirm public repository access and share the reusable tools with the community | Entrant / repository account | Public repository URL and access/sharing record pending |
| [ ] | Activate Site A GitHub Pages and record its public HTTPS URL | Repository account owner | URL pending; workflow exists, activation unverified |
| [ ] | Deploy Site B to Cloudflare Pages on a separate origin and record its HTTPS URL | Cloudflare account owner | URL pending; `_headers` exists, public response unverified |
| [ ] | Replace reserved peer URL and paired allowed origin; update deployment-address test expectations and redeploy A | Maintainer, after actual B base is confirmed | Update `site-a/links.json` and `site-a/agent-manifest.json` together; `tests/peer.test.mjs` checks consistency and currently pins the placeholder |
| [ ] | Capture public artifact HTTPS/CORS responses and verify cross-origin browser retrieval | Deployer + browser verifier | Measured URL/status/headers/date/revision pending; local configuration is insufficient |
| [ ] | Complete missing real-browser observations and public-revision checks; resolve or explicitly retain blocked cases | Browser verifier + entrant for environment/accounts | Local run 1 and corrected run 2 observations are in the demo ledger; provider headers/bodies, unexercised limits and public acceptance remain unverified |
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
