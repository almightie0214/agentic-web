# Agent Review Desk + Spec Scout

An Open Agentic Web Challenge project built on the Worldwide Agentic Web MVP
Profile 0.2. The planned deployment is two static browser-based agent sites:
Site A (Agent Review Desk) on GitHub Pages and Site B (Spec Scout) on Cloudflare
Pages. No application backend, database, payment, or authentication service is
part of this project.

## Current status

This scaffold contains the reference specification, project metadata, license,
smoke tests, merge gate configuration, and separately vendored runtimes for Site A
and Site B. Site pages and network publication will be added in subsequent tasks;
there is not yet a runnable site.

## Repository layout

- `README.md`, `package.json`, `LICENSE`: project scaffold.
- [docs/worldwide_agentic_web_mvp_spec.md](docs/worldwide_agentic_web_mvp_spec.md):
  pinned reference specification with source and license attribution.
- `site-a/runtime/`, `site-b/runtime/`: separate vendored browser runtimes.
- `site-a/`, `site-b/`: independent static site bundles; pages are planned.
- `tests/`: Node.js smoke test scaffold.
- `tools/`: reserved for development tools when needed.

Directories are created only when they contain files; no empty placeholders are
tracked. Site-owned asset references must use relative paths so deployment under
a GitHub Pages subpath works.

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
It also checks composed UI mounting without retired activity-slot handling; it
does not yet check site pages or networks. Site B additionally checks that BYOK
uses only current tab settings and saved profiles, with no obsolete standalone-key
slot access, including cleanup after a failed tab-setting write. No npm
dependencies are required.

## Reference and license

The specification is copied from
[cognizant-ai-labs/agentic-web](https://github.com/cognizant-ai-labs/agentic-web)
at commit `63a956cf4653f610b1c238c70946f4d7647d17a8`, file
`docs/worldwide_agentic_web_mvp_spec.md` (MVP Profile 0.2). Its original text is
preserved below an added provenance note in the local copy. Both runtimes are
copied from `skills/agentify-website/runtime/` at the same pinned commit, with
only the obsolete runner alias, legacy mock-router inference, legacy confirm-text
inference, and retired activity-slot handling removed. Site B also removes the
obsolete standalone-key slot compatibility in `byok.js`; Site A still has this
path, tracked as follow-up work. Each copy preserves the
original `LICENSE.txt` and upstream documentation; the source runtime contains no
NOTICE file. Local changes are noted in
[site-a/runtime/README.md](site-a/runtime/README.md) and
[site-b/runtime/README.md](site-b/runtime/README.md).

This project and the upstream reference material are licensed under
[Apache License 2.0](LICENSE). The specification retains its Cognizant AI Lab
attribution.
