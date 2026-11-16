# Agent Review Desk + Spec Scout

An Open Agentic Web Challenge project built on the Worldwide Agentic Web MVP
Profile 0.2: inspect portable agent-network artifacts, explain deterministic
findings, and ask a linked, excerpt-grounded specification assistant.

Two static browser-based sites are configured for separate hosts: Site A (Agent
Review Desk) on GitHub Pages and Site B (Spec Scout) on Cloudflare Pages. There is
no application backend, database, payment, or authentication service. Inference
uses an external LLM router; static inspection requires no provider key.

## Current status and verification boundary

- **Implemented:** Site A's two-agent network, read-only validation action,
  key-free paste/sample/URL inspection, configuration and execution graphs; Site
  B's informational one-agent network; symbolic peer wiring; a repository static
  conformance CLI; Site A deployment workflow and Site B CORS configuration.
- **Not a live peer URL:** `site-a/links.json` still binds `spec_scout` to
  `https://spec-scout.invalid/spec_scout`. `site-a/agent-manifest.json` allows the
  matching reserved origin under a closed peer policy. This is not a public
  deployment. The linked-peer audit preset and Spec Scout explanation draft stay
  disabled while that placeholder is configured.
- **Observed locally:** user-supplied real-browser records in the
  [demo checklist and evidence ledger](docs/demo-checklist.md) cover delegation and
  the site action, panel model switching, consent approval/decline, exact-name peer
  loading and wrong-name refusal, denied origins, invalid networks, sentinel field
  filtering, a synthetic composition cycle, and the 24-agent invocation cap.
  These are local disposable-fixture observations, not a public deployment test or
  a fresh browser run by this document's implementer.
- **Failures corrected and rechecked:** run 1 accepted duplicate agent names and
  disclosed the key to A's static server through a loopback cookie. Both runtime
  copies were corrected. Run 2 records A/B normalized-duplicate top-loader refusal,
  duplicate-peer refusal before peer inference, panel persistence/model switching,
  and key absence on observed A/B static requests with caller-router retention on
  both models. Run 1 failures remain in the ledger; unrelated cases were not all
  rerun on the corrected runtime. The user subsequently confirmed old-key revocation.
- **Still unverified:** direct provider request headers/bodies, complete definition
  response-body inspection, missing sentinel-header checks, unexercised execution
  limits (including in-flight deadline behavior), and other unrecorded subcases.
  See the ledger's [current acceptance summary](docs/demo-checklist.md#current-acceptance-summary-and-remaining-owners)
  for scope and owners. Node tests or static CLI exit 0 do not fill these gaps.
- **Public release pending:** hosting activation, real HTTPS URLs, measured public
  CORS responses, public-revision browser checks, and judge access are not established
  here. Do not describe the entry as submission-ready until these are confirmed.

See [the English submission draft and handoff tracker](docs/devpost.md) for open
release items. The demo checklist contains procedures, sanitized observations and
revision/runtime-hash provenance for run 1 and the corrected run 2 rechecks. A
checklist alone is not an execution result.

## Architecture

```text
Site A: Agent Review Desk (GitHub Pages origin)
  key-free editors / samples / public URL audit
       -> validator-rules.mjs -> deterministic report
  reference browser runtime + built-in AI model settings / chat
       -> review_coordinator -> conformance_reviewer
                               -> website_validate_network (local site action)
       -> spec_scout (symbolic link in links.json)
            -> origin policy + visitor consent -> fetch Site B's public definition
            -> execute peer agents locally in A's browser runtime

Site B: Spec Scout (separate Cloudflare Pages origin)
  agent-manifest.json -> spec_scout.network.json (embedded cited excerpts)
  own reference runtime / settings / chat for direct visits

tools/check-conformance.mjs -> imports Site A's shared validator rules
                           -> reads both publication roots + Site B _headers
```

The agents explain evidence; they do not invent conformance verdicts. The
coordinator delegates conformance questions to `conformance_reviewer`, which uses
`validate_network`, exposed by the runtime as `website_validate_network`.
Missing artifacts and action errors are not conformance verdicts. Spec Scout's
answers preserve source sections and evidence limits; they are not certification.
`site-b/spec-excerpts.json` is authoring data: the published network already embeds
its excerpts and neither direct visits nor peer loading inject that file.

Both sites use separately vendored copies of the nsDeploy reference browser
runtime, not a new runtime. Published networks are resolved JSON with no
include/environment dependencies. Instructions are public; never put secrets or
provider keys in definitions, prompts, action arguments, or shared evidence.

Hosted Otari (`https://api.otari.ai/api/v1`) is the default router, with
`alibaba/qwen3.8-flash` as the model hint. Inference requires a visitor's provider
key. The existing runtime is intended to keep the caller's active router/model
policy when loading peers and send the key only to that router, not Site B.
The local B07/run 2 records support caller-router retention and observed A/B
static-request key isolation, not universal non-disclosure: direct provider
headers/bodies remain unobserved. BYOK does not isolate a key from other JavaScript
on the caller origin; do not host untrusted scripts or combine Site B's files with
Site A's publication root.

## Local setup and use

Use Node.js 24 for checks. There are no npm dependencies to install. With Python 3
available, start a static preview from the repository root:

```sh
python -m http.server 8000 --bind 127.0.0.1
```

Open:

- Site A: `http://127.0.0.1:8000/site-a/`
- Site B: `http://127.0.0.1:8000/site-b/`

Serve over HTTP/HTTPS, not `file://`. Site-owned references are relative and support
hosting beneath a URL subpath. This single-server preview is convenient for UI
inspection, **not a two-origin isolation or deployed CORS test**. It also does not
replace the reserved peer binding with a working local destination.

### Key-free Review Desk

- Paste manifest and resolved network JSON; optionally supply links JSON, the
  actual publication base URL (including its path), an exact network name, and
  known active ancestor peer URLs. Select **Validate pasted JSON**. Omit unknown
  context rather than guessing. An omitted parameters schema uses the runtime default.
- The four sample buttons check valid artifacts, a missing front agent, an invalid
  parameters schema, or self-peer composition. They never execute sample networks
  or contact synthetic peers.
- Enter a public site base or manifest URL, inspect the destination, and select
  **Audit URL**. Acquisition uses credential-free GETs for public artifacts and
  shares the same rules. Referenced artifacts and redirects may cross origins.
  Acquisition errors are separate from rule failures; a generic fetch error does
  not establish a CORS cause.
- **Audit This Site**, **Audit Linked Peer**, and **Non-CORS example** fill the URL
  only; select **Audit URL** to fetch. The example.com preset is illustrative, not
  a guaranteed CORS-failure service. The linked-peer preset needs a real configured peer.
- Reports retain rule IDs, pass/fail/warning/unverified statuses, JSON Pointer
  paths, and minimal fixes or next steps. Editing inputs invalidates old reports;
  stale fetch results cannot replace them. The configuration graph shows expected
  configuration, not execution.

### Chat and runtime observations

Use the built-in **AI model settings** panel to select the router/model and enter
a key; use this same panel for model switching. Saved profiles use origin-local
localStorage; applied tab settings use sessionStorage and take priority. Cookie
mirroring has been removed. Before serving corrected code on a previously used test
host, follow the ledger's safety hold to remove old test cookies privately and
revoke exposed keys; there is no automatic cookie cleanup or migration. Do not put
keys in URLs or public artifacts. Initial boot loads metadata but does not make a
model request. If runtime/artifact loading fails, chat stays hidden with error
feedback; Site A's key-free checks remain usable independently.

A failed check or input/acquisition error can prepare a chat explanation draft.
Review the public artifacts included in it and send it yourself. Replacing an
existing draft requires confirmation. Drafting neither contacts a peer nor grants
consent. Spec Scout drafting needs a real peer configured in the chat runtime.

Site A's separate execution graph reads effective bindings and actual trace events,
showing latest-run agents/tools, parent edges, router/model labels, peer activity,
and recorded decisions. Before a run it says **Not run**. Request summaries alone
cannot prove key isolation, filtered private context, CORS, consent without a
recorded event, or limit/cycle enforcement. The page adds no probe, sentinel
injection UI, evidence-download builder, or runtime adapter.

## Checks and spec mapping

Run the repository static check from the root:

```sh
node tools/check-conformance.mjs
```

Exit 0 means the checked local publication artifacts pass the static policy;
warnings and `runtime.*` unverified observations remain visible. Exit 1 means
blocking static failures. The CLI imports `site-a/validator-rules.mjs` (the AW2
rules), rather than reimplementing manifest/network rules. CLI-only checks cover
readable site-local files, links and local peer-name consistency, private-context
**declarations**, and applicable Site B `_headers` rules. It does not fetch live
URLs, execute the vendor loader, emulate DOM/storage, or invoke models. JSON
`sly_data` properties do not inject invocation context or prove filtering.

The mapping below is an implementation/check guide, not a full conformance claim.
Section references are to the [pinned MVP Profile 0.2 specification](docs/worldwide_agentic_web_mvp_spec.md).

| Spec requirement | Implementation and static checks | Local browser evidence / remaining checks |
| --- | --- | --- |
| §§2.1–2.2: portable resolved data, unique agents, front agent, schemas, references | Both manifests and `*.network.json`; shared `manifest.*`, `network.*`, `agent.*`, `tool.*` reports | B05/run 2 record invalid-network refusal and normalized-duplicate top/peer loader refusal before inference, within the ledger's variants; replacement_values and top B malformed/empty/missing-reference cases remain unverified. Static schema checks do not validate instances/provider compatibility |
| §§3.1, 6: two-agent delegation and grounded capability | A coordinator → reviewer → registered read-only `validate_network` action; scripted wiring tests | B01 run 1 records delegation, a succeeded action receipt and report-backed explanation, with instruction deviations retained; not a full run 2 rerun |
| §§3.2–3.4: exact peer resolution and public artifacts | A `links.json` + `allowed_peers`, B manifest name, CLI `publication.*`, `tests/peer.test.mjs`, B `_headers` | B02–B04/B06 record approval before contact, decline/denied-origin zero-contact paths and wrong-name refusal before peer inference; public HTTPS/CORS and public-revision checks remain unverified |
| §4: pluggable inference and router-only key disclosure | Built-in settings, default Otari metadata, reference runtime; scripted router inheritance tests | B07/run 2 record both panel-selected models, caller-router retention despite conflicting peer metadata, and key absence on observed A/B static requests after cookie removal; direct provider headers/bodies and comprehensive prompt/action/error inspection remain unverified |
| §§2.1, 5, 6: private context by named exception | CLI `publication.private_context` audits per-agent allow declarations | B08 records actual invocation-option injection and post-filter `remote_call.requestPayload.sly_data` field sets (public_sentinel only vs {}), with peer execution; exact delivered values, upstream/general scoping and missing sentinel-header checks remain unverified |
| §§3.1–3.2, 5–6: cycles, finite execution and fail closed | Shared `peer.composition` diagnoses known active-chain re-entry with supplied context; `execution.limit` declaration checks/warnings | B09 records synthetic ancestor re-entry skipped with no forbidden invocation; B10 records visible rejection beyond the 24-agent cap. Other limits, including in-flight deadline behavior, remain unverified |

For the automated test suite:

```sh
npm test
```

This expands to `node --test "tests/**/*.test.mjs"`. The merge gate runs that
command and `node tools/check-conformance.mjs` with a five-minute timeout. Tests
cover publication/boot, shared validator reports, action wiring, URL acquisition,
UI stale-result handling, peer-policy/consent dispatch with substituted fetch and
model calls, CORS configuration, and CLI failure cases. Runtime smoke tests also
guard the local compatibility-code removals and duplicate-name/cookie corrections
listed below. DOM/storage/fetch substitutes and scripted model calls are not actual
browser or provider evidence.

Real-browser procedures and supplied run 1/run 2 observations are in
[docs/demo-checklist.md](docs/demo-checklist.md), including environment, tested
revision/runtime hashes, steps, verdicts and sanitized excerpts. Its current
acceptance summary distinguishes historical failures, corrected rechecks and
missing observations. Follow-up capture must observe definition fetches as well as
post-filter remote-call fields without retaining real keys. No forced vendor-loader
execution in Node or separate evidence JSON download is required. Cases blocked by
environment/accounts remain **unverified**, with the required user input recorded.

## Deployment configuration and release handoff

1. **Site A / GitHub Pages:** `.github/workflows/pages.yml` deploys on `main` pushes
   that change `site-a/` or the workflow, or on manual dispatch. It uploads
   **only `site-a`**, never the repository root.
   Enable GitHub Pages with GitHub Actions and confirm the deployed URL and workflow
   result in the repository account. Workflow presence does not prove activation.
2. **Site B / Cloudflare Pages:** deploy `site-b/` as the independent static publish
   root on a different origin, preserving `runtime/`, manifest, network and `_headers`.
   No application build is needed. `site-b/_headers` declares
   `Access-Control-Allow-Origin: *` for `/*`. That local configuration is not
   evidence of response headers at a public URL. `spec-excerpts.json` is not needed
   for execution, but the published network with its embedded evidence is.
3. **Bind the actual peer:** once the Site B HTTPS base is confirmed, set
   `site-a/links.json` → `networks.review_desk.spec_scout` to
   `<Site B base>/spec_scout` and update `site-a/agent-manifest.json` →
   `allowed_peers` to the matching origin **together**. Keep the closed peer policy
   and exact published name. `tests/peer.test.mjs` checks paired declarations and
   currently pins the reserved URL; update its expected deployment address in the
   URL-change task too. Rerun peer tests and the static CLI, then redeploy Site A.
4. **Measure, do not infer:** verify public HTTPS artifact responses and CORS from
   Site A's origin, preserve sanitized response evidence with URLs/date/revision,
   and perform the real-browser cases. A successful local CLI, hosting setting, or
   deployment job cannot substitute for those observations or judge access.

Track public URLs, screenshots, an under-two-minute public YouTube explanation by
the entrant, English materials, Otari email/feedback, final submission, and public
availability through **2027-01-19 10:00 KST (UTC+09:00)** in
[docs/devpost.md](docs/devpost.md#submission-and-public-access-handoff).
These account-owned actions remain open; no credentials should be committed.

## Repository layout

- `site-a/`: Review Desk page, styles, boot entry, manifest, links, resolved network,
  validator/action/audit modules, samples and independent `runtime/`.
- `site-b/`: Spec Scout page/boot, manifest, resolved network, excerpt authoring
  data, `_headers` and independent `runtime/`.
- `tools/check-conformance.mjs`: static repository publication audit.
- `tests/`: Node smoke, validator, action, URL audit, UI, peer and CLI tests.
- `.github/workflows/pages.yml`: Site A-only Pages deployment.
- `docs/worldwide_agentic_web_mvp_spec.md`: attributed reference specification.
- `docs/devpost.md`: English submission draft and release handoff tracker.
- `docs/demo-checklist.md`: browser procedures, local evidence ledger and remaining
  acceptance owners.
- `LICENSE`, `package.json`: Apache-2.0 license and dependency-free check command.

## Reference and license

The specification is copied from
[cognizant-ai-labs/agentic-web](https://github.com/cognizant-ai-labs/agentic-web)
at commit `63a956cf4653f610b1c238c70946f4d7647d17a8`, file
`docs/worldwide_agentic_web_mvp_spec.md` (MVP Profile 0.2). Its original text is
preserved below an added provenance note in the local copy. Both runtimes are
copied from `skills/agentify-website/runtime/` at the same pinned commit. Local
compatibility removals cover the obsolete runner alias, legacy mock-router and
confirm-text inference, retired activity-slot handling, and obsolete standalone-key
slot in `byok.js`. AW4 browser findings also led to two corrections in both copies:
`kernel.js` rejects duplicate agent names after configuration replacement/trimming,
before map overwrite; `byok.js` no longer reads/writes key-bearing profile cookies,
and `ui.js` no longer advertises cookie sharing. Profiles remain origin-local with
tab settings taking priority; existing test cookies require manual user cleanup,
not a compatibility reader or migration. The ledger preserves the failures and
scoped browser rechecks. Each copy preserves the original `LICENSE.txt` and
upstream documentation; the source runtime contains no NOTICE file. Local changes
are noted in [site-a/runtime/README.md](site-a/runtime/README.md) and
[site-b/runtime/README.md](site-b/runtime/README.md).

This project and the upstream reference material are licensed under
[Apache License 2.0](LICENSE). The specification retains its Cognizant AI Lab
attribution.
