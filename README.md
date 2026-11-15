# Agent Review Desk + Spec Scout

An Open Agentic Web Challenge project built on the Worldwide Agentic Web MVP
Profile 0.2. The planned deployment is two static browser-based agent sites:
Site A (Agent Review Desk) on GitHub Pages and Site B (Spec Scout) on Cloudflare
Pages. No application backend, database, payment, or authentication service is
part of this project.

## Current status

This scaffold contains the reference specification, project metadata, license,
smoke tests, merge gate configuration, and the vendored Site A runtime. Site B's
runtime, site pages, and network publication will be added in subsequent tasks;
there is not yet a runnable site.

## Repository layout

- `README.md`, `package.json`, `LICENSE`: project scaffold.
- [docs/worldwide_agentic_web_mvp_spec.md](docs/worldwide_agentic_web_mvp_spec.md):
  pinned reference specification with source and license attribution.
- `site-a/runtime/`: vendored browser runtime for Site A.
- `site-a/`, `site-b/`: independent static site bundles; pages and Site B's runtime
  are planned.
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
Site A's runtime entry point and license. It also checks the current runner
selection contract, explicit mock-router settings, and required confirmation text
in response and welcome confirm widgets, including welcome form preservation;
it does not yet check site pages or networks. No npm dependencies are required.

## Reference and license

The specification is copied from
[cognizant-ai-labs/agentic-web](https://github.com/cognizant-ai-labs/agentic-web)
at commit `63a956cf4653f610b1c238c70946f4d7647d17a8`, file
`docs/worldwide_agentic_web_mvp_spec.md` (MVP Profile 0.2). Its original text is
preserved below an added provenance note in the local copy. Site A's runtime is
copied from `skills/agentify-website/runtime/` at the same pinned commit, with
only the obsolete runner alias, legacy mock-router inference, and legacy
confirm-text inference removed. Its `LICENSE.txt` and upstream documentation are
preserved; local changes are noted
in [site-a/runtime/README.md](site-a/runtime/README.md). Site B's runtime will use
the same pinned source.

This project and the upstream reference material are licensed under
[Apache License 2.0](LICENSE). The specification retains its Cognizant AI Lab
attribution.
