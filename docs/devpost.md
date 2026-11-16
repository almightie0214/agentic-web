# Devpost submission draft — Agent Review Desk + Spec Scout

**Status: English draft, not a submitted or release-ready entry.** Public URLs,
real-browser evidence, screenshots, video, Otari correspondence, final submission,
and judge access still need confirmation. Replace open fields with verified facts
before publishing; do not turn planned behavior into a completed result.

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
configuration, while preserving uncertainty about consent, exact-name loader
refusal, key/router isolation and runtime limits. Those behaviors and deployed
HTTPS/CORS still need real-browser evidence.

### 2. Design

> Does the project deliver a complete, coherent product experience not just a technical proof of concept?

The intended experience connects key-free inspection, actionable report locations,
reviewed chat explanation drafts, and specification help in one review workflow.
The UI separates expected configuration from observed execution, keeps static checks
usable when chat fails, and uses the reference runtime's model settings rather
than a second configuration UI. The planned demonstration will follow one problem
through correction, delegation, consent, peer use and evidence. A complete deployed
experience and actual browser usability are not yet demonstrated here.

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
checks and their limits. This draft does not claim a live demo or completed
browser validation.

Next, the demo-kit task must record actual browser runs at an identified revision:

- Two-agent delegation and the local site action; default inference and a
  user-selected router/model using the built-in model settings panel.
- Approval before peer contact, refusal with no contact, the exact peer network,
  and a denied origin with visible errors.
- Malformed networks, duplicate agent names and wrong explicit peer names rejected
  before any model call; synthetic composition cycles and exceeded limits stopped.
- Keys absent from definition-fetch URLs, headers and bodies; peer router metadata
  unable to replace the caller's active router.
- Harmless sentinels passed through existing runtime invocation options, with
  post-filter `TraceBus` `remote_call` `requestPayload` fields inspected for denied
  and explicitly allowed private context, including return behavior. JSON properties
  alone do not inject runtime context.

Record browser/environment, revision, steps, observed results, verdicts and sanitized
trace/log or screen evidence in demo-kit's `docs/demo-checklist.md` (not yet present
at this revision). Never retain real keys in evidence. Node exit 0 or a written
checklist does not complete these cases. Environment/account-blocked cases stay
unverified and identify the user input needed. No separate evidence JSON download
or forced Node execution of the browser vendor loader is required.

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
| [ ] | Finalize the four criterion responses against actual demonstration evidence | Entrant | Official Rules §6 names/definitions are quoted above; completed demo evidence still pending |
| [ ] | Confirm public repository access and share the reusable tools with the community | Entrant / repository account | Public repository URL and access/sharing record pending |
| [ ] | Activate Site A GitHub Pages and record its public HTTPS URL | Repository account owner | URL pending; workflow exists, activation unverified |
| [ ] | Deploy Site B to Cloudflare Pages on a separate origin and record its HTTPS URL | Cloudflare account owner | URL pending; `_headers` exists, public response unverified |
| [ ] | Replace reserved peer URL and paired allowed origin; update deployment-address test expectations and redeploy A | Maintainer, after actual B base is confirmed | Update `site-a/links.json` and `site-a/agent-manifest.json` together; `tests/peer.test.mjs` checks consistency and currently pins the placeholder |
| [ ] | Capture public artifact HTTPS/CORS responses and verify cross-origin browser retrieval | Deployer + browser verifier | Measured URL/status/headers/date/revision pending; local configuration is insufficient |
| [ ] | Complete real-browser cases with sanitized evidence and resolve or explicitly retain blocked cases | Demo-kit verifier + entrant for environment/accounts | No completed browser observations claimed here |
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
