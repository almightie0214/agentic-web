# Agent Review Desk + Spec Scout

An Open Agentic Web Challenge project built on the Worldwide Agentic Web MVP
Profile 0.2. The planned deployment is two static browser-based agent sites:
Site A (Agent Review Desk) on GitHub Pages and Site B (Spec Scout) on Cloudflare
Pages. No application backend, database, payment, or authentication service is
part of this project.

## Current status

This scaffold contains the reference specification, project metadata, license,
smoke tests, merge gate configuration, and separately vendored runtimes for Site A
and Site B. Site A now loads the published `review_desk` two-agent network through
the reference runtime's built-in settings, chat, and agent inspection UI. Its
`review_coordinator` routes conformance questions to `conformance_reviewer`, which
uses the read-only `validate_network` site action and explains only its deterministic
rule reports, preserving warnings and unverified observations. The manifest exposes
the action to the reference runtime as `website_validate_network`. Static reports
are not proof of live hosting, CORS, consent, or successful execution. Missing
artifacts and action errors are not conformance verdicts.
Hosted Otari (`https://api.otari.ai/api/v1`) is the default router,
with `alibaba/qwen3.8-flash` as the network's model hint. A provider key is required
for inference and is configured through the built-in settings.

Site B (Spec Scout) loads its published `spec_scout` one-agent network through
its own reference runtime's `boot()` and built-in AI model settings and chat UI.
The network includes cited MVP Profile 0.2 excerpts in its instructions; the page
does not fetch or inject `spec-excerpts.json`, the authoring source. Direct visits
and peer loading use the same published evidence. Answers are informational, not
conformance certification. Site A's coordinator now exposes the symbolic
`spec_scout` peer tool, resolved through `site-a/links.json` to the reserved URL
`https://spec-scout.invalid/spec_scout`, with a matching allowed origin in
`site-a/agent-manifest.json`. This wiring is implemented, but actual deployment,
CORS, consent behavior, and live interoperability remain unverified. In AW4, when
the real Site B URL is established, update both `site-a/links.json` and
`site-a/agent-manifest.json`'s `allowed_peers` together.

Serve the repository with a local static HTTP server and open `site-a/` (or
`site-a/index.html`). The page, manifest, network, and runtime references work
under a deployment subpath as well as on a local server.

## Review Desk checks and explanations

Open `site-a/` over HTTP or HTTPS. Static checks, the four built-in samples, and
URL audits need no provider key and remain usable while chat loads or if chat
boot fails. Chat uses the vendored runtime and the provider settings described above.

- Paste manifest and resolved network JSON in the two editors, optionally adding
  links JSON, a publication base URL (including its path), an exact network name,
  and known active ancestor peer URLs. Select **Validate pasted JSON**. Only known
  context should be supplied; an omitted parameters schema uses the runtime default.
- The four sample buttons load and immediately check valid artifacts, a missing
  front agent, an explicitly invalid parameters schema, or a self-peer composition
  cycle. They do not execute the sample networks or contact their synthetic peers.
- For a live audit, enter a site base or manifest URL, inspect the destination,
  and select **Audit URL**. The audit retrieves public manifest, network, and
  `links.json` using credential-free GETs and reuses the same rules. Referenced
  artifacts and redirects may use other origins. Acquisition errors are separate
  from rule failures; a generic fetch error does not establish a CORS cause.
  The readiness summary covers static artifacts only, never runtime safety.
- **Audit This Site**, **Audit Linked Peer**, and **Non-CORS example** only fill
  the URL; you still select **Audit URL** to initiate retrieval. The linked-peer
  preset is disabled without a configured non-placeholder peer. The external
  example uses example.com as an illustration, not a guaranteed CORS failure
  service. Site A publishes `links.json`, but its Spec Scout destination is still
  the reserved address above, so the linked-peer preset remains disabled. Site A's
  own URL audit reports actual artifact acquisition and static check results; the
  peer binding is not evidence of a reachable deployment or live interoperability.
- Reports preserve rule IDs, pass/fail/warning/unverified statuses, JSON Pointer
  locations, and minimal fixes or next steps as visible text. Editing the inputs
  invalidates the old report; stale fetch results cannot replace it. The reviewed
  configuration graph is labelled as expected configuration, not execution.
- A failure or acquisition/input error can prepare an explanation draft in the
  built-in chat. Review the included public artifacts and send it yourself;
  existing drafts require replacement confirmation. Spec Scout drafting stays
  disabled until a real Spec Scout peer is configured in the chat runtime.
  Drafting does not contact a peer, grant consent, or bypass runtime policy.
- The separate Review Desk execution graph reads the runtime's manifest, effective
  link bindings, and actual trace events. Its latest-run spans show parent edges,
  agents/tools, model router/model labels, peer activity, and recorded decisions.
  Before a chat run it says **Not run**. Declared expectations and observed events
  are not security certification: CORS policy, consent without a recorded event,
  credential/private-context isolation, cycle interruption, and limit enforcement
  remain unverified. Request summaries cannot prove these properties. The page
  adds no probe, sentinel, report-download builder, or runtime adapter.

## Repository layout

- `README.md`, `package.json`, `LICENSE`: project scaffold.
- [docs/worldwide_agentic_web_mvp_spec.md](docs/worldwide_agentic_web_mvp_spec.md):
  pinned reference specification with source and license attribution.
- `site-a/runtime/`, `site-b/runtime/`: separate vendored browser runtimes.
- `site-a/`: Review Desk page and boot entry, shared site styles,
  `agent-manifest.json`, `links.json`, and resolved `review_desk.network.json`.
- `site-b/`: independent static site bundle with `index.html`, `site.js` boot entry,
  `agent-manifest.json`, resolved `spec_scout.network.json`, and authoring data
  `spec-excerpts.json` (not a runtime data source).
- `tests/`: Node.js smoke, validator, URL audit, and Review Desk UI tests.
- `tools/`: reserved for development tools when needed.

Directories are created only when they contain files; no empty placeholders are
tracked. Site-owned asset references must use relative paths so deployment under
a GitHub Pages subpath works.

## Preview Site B

Serve the files over HTTP or HTTPS rather than opening `index.html` as a file.
For example, with Python 3 available, run from the repository root:

```sh
python -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000/site-b/`. The built-in settings panel supports
Provider URL, model entry and suggestions, BYOK, and saved profiles using the
runtime's existing browser storage behavior. The page loads and validates the
published network before showing the chat UI. Configure a provider key to ask
questions; initial boot retrieves public artifacts but makes no model request.
If the runtime or published artifacts cannot be loaded or validated, the app
stays hidden and an error explains what to check.

For an independent Site B deployment, use `site-b/` as the static publish root:
`index.html`, `site.js`, `agent-manifest.json`, `spec_scout.network.json`, and
`runtime/` must stay together. The network already contains its evidence, so
`spec-excerpts.json` is not required for execution. Site B's page styles are inline
and its runtime and artifact references are relative, so no files from Site A are
needed. The same files can be served beneath a URL subpath. Hosting configuration
and deployment are not provided by this boot change.

## Tests

Use Node.js 24 and run:

```sh
npm test
```

The script is `node --test "tests/**/*.test.mjs"`. The merge gate in
`theora.gate.json` uses the same glob with a five-minute timeout. The smoke test
currently checks the gate configuration, npm test command, and the presence of
both sites' runtime entry points and licenses. For each runtime it also checks the
current runner selection contract, explicit mock-router settings, and required confirmation text
in response and welcome confirm widgets, including welcome form preservation.
It also checks composed UI mounting without retired activity-slot handling;
it checks Site A's published two-agent graph, default router and model hint,
relative artifact loading and validation, and boot success/failure visibility.
The Site A loading smoke check also exercises manifest-based loading of the real
validator action and scripted coordinator-to-reviewer-to-action dispatch. It checks
the assembled model instructions, returned rule reports (including warnings and
unverified checks), malformed JSON action errors, and missing-artifact handling.
The scripted model verifies wiring, not a live model's adherence to instructions.
`tests/desk-ui.test.mjs` drives the real page module through a minimal DOM and
substituted boot boundary with the real trace bus, validator, and URL audit module.
It covers key-free sample/paste/audit paths, JSON error locations and hints,
acquisition errors, stale input/fetch invalidation, pending/failed chat independence,
placeholder peer presets, explanation drafts, effective links, and latest-run event
attribution. These substitute-event checks do not verify actual browser layout,
live peer consent, deployed CORS, a live provider, or credential isolation.
Both sites also check that BYOK uses only current tab settings and saved
profiles, with no obsolete standalone-key slot access, including cleanup after a
failed tab-setting write. Site B boot checks exercise real manifest/network loading
and UI mounting, unchanged embedded instructions, profile and tab settings
precedence, enabled chat after successful loading, URL key removal and ignored
URL inference settings. They check hidden UI while loading and error feedback for
runtime, manifest, network, JSON, and graph failures. Initial metadata fetches are
distinguished from authoring-data retrieval and model requests. These checks do
not verify a live provider or a deployed browser session. No npm dependencies are
required.

## Reference and license

The specification is copied from
[cognizant-ai-labs/agentic-web](https://github.com/cognizant-ai-labs/agentic-web)
at commit `63a956cf4653f610b1c238c70946f4d7647d17a8`, file
`docs/worldwide_agentic_web_mvp_spec.md` (MVP Profile 0.2). Its original text is
preserved below an added provenance note in the local copy. Both runtimes are
copied from `skills/agentify-website/runtime/` at the same pinned commit, with
only the obsolete runner alias, legacy mock-router inference, legacy confirm-text
inference, retired activity-slot handling, and obsolete standalone-key slot
compatibility in `byok.js` removed. Both sites use only current tab settings and
saved profiles for BYOK. Each copy preserves the
original `LICENSE.txt` and upstream documentation; the source runtime contains no
NOTICE file. Local changes are noted in
[site-a/runtime/README.md](site-a/runtime/README.md) and
[site-b/runtime/README.md](site-b/runtime/README.md).

This project and the upstream reference material are licensed under
[Apache License 2.0](LICENSE). The specification retains its Cognizant AI Lab
attribution.
