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
`review_coordinator` delegates to `conformance_reviewer`; no website actions are
connected. Hosted Otari (`https://api.otari.ai/api/v1`) is the default router,
with `alibaba/qwen3.8-flash` as the network's model hint. A provider key is required
for inference and is configured through the built-in settings.

Site B (Spec Scout) has a runnable shell that mounts its own official runtime's
built-in AI model settings and chat UI. Its network will be connected in AW3.
Site B's chat input and agent inspection are unavailable until a network is
connected. No network is loaded by the Site B shell.

Serve the repository with a local static HTTP server and open `site-a/` (or
`site-a/index.html`). The page, manifest, network, and runtime references work
under a deployment subpath as well as on a local server.

## Repository layout

- `README.md`, `package.json`, `LICENSE`: project scaffold.
- [docs/worldwide_agentic_web_mvp_spec.md](docs/worldwide_agentic_web_mvp_spec.md):
  pinned reference specification with source and license attribution.
- `site-a/runtime/`, `site-b/runtime/`: separate vendored browser runtimes.
- `site-a/`: Review Desk page and boot entry, shared site styles,
  `agent-manifest.json`, and resolved `review_desk.network.json`.
- `site-b/`: independent static site bundle with `index.html` and `site.js` shell;
  network publication is pending.
- `tests/`: Node.js smoke test scaffold.
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
runtime's existing browser storage behavior. Saving settings does not connect a
network; the shell keeps chat disabled until AW3 supplies one.

For an independent Site B deployment, use `site-b/` as the static publish root:
`index.html`, `site.js`, and `runtime/` must stay together. Site B's page styles
are inline and its runtime references are relative, so no files from Site A are
needed. The same files can be served beneath a URL subpath. Hosting configuration
and deployment are not provided by this shell task.

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
Both sites also check that BYOK uses only current tab settings and saved
profiles, with no obsolete standalone-key slot access, including cleanup after a
failed tab-setting write. Site B shell checks exercise the official UI mount,
profile and tab settings precedence, no initial network load, disabled chat,
URL key removal and ignored URL inference settings, and runtime-load failure
feedback. These checks do not verify a live provider or a deployed browser
session. No npm
dependencies are required.

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
