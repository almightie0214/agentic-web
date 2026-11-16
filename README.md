# Agent Review Desk + Spec Scout

**Rules decide. Agents explain.** Agent Review Desk helps agent-network authors and
reviewers spot publication mistakes before sharing a network: paste public JSON or
load an example to get deterministic findings with locations and correction hints.
Role Converter turns existing role instructions into portable network artifacts;
Spec Scout is a separate agent site for questions about the Worldwide Agentic Web
MVP Profile 0.2. Together they let you inspect a network first, then explore how
agents delegate and load a peer with your approval.

[**Review Desk**](https://almightie0214.github.io/agentic-web/) ·
[**Role Converter**](https://almightie0214.github.io/agentic-web/converter.html) ·
[**Spec Scout**](https://spec-scout.pages.dev/)

## Try it in one minute — no API key

1. Open **Review Desk** and select **Valid sample**, then **Missing front_man**.
   Compare the rule IDs, JSON Pointer locations and correction hints in **Rule
   report**. The configuration graph describes the input; it does not execute it.
2. Select **Audit Linked Peer**, inspect the filled destination, then select
   **Audit URL** to inspect Spec Scout's public artifacts. This is a public-file
   fetch, not a model request or permission to run the peer.
3. Open **Role Converter**, choose **Claude agents team**, **Google ADK team**, or
   **Theora role team**, and inspect the unmapped-key notices and three downloadable
   JSON artifacts. **Open artifacts in Review Desk** transfers them for static
   inspection, not execution.

You can also paste your own public manifest and resolved network JSON into Review
Desk. Do not include credentials or private context. Static checks, URL audits and
conversion need no key; chat and explicit test runs use visitor-provided inference.

## Chat with your Otari key

1. In Review Desk, open **⚙ AI model settings**, enter your Otari **API key**, and
   select **Save and start**. The configured provider is
   `https://api.otari.ai/api/v1`, with `alibaba/qwen3.8-flash` as the model hint.
   **Advanced settings (optional)** lets you choose another authorized
   OpenAI-compatible **Provider URL** and **Model**. There is no shared key or
   included inference allowance.
2. Ask Review Desk to explain supplied public manifest/network JSON. Its
   coordinator can delegate to the reviewer, which uses the read-only
   `website_validate_network` action. Failure rows can prepare an explanation
   draft; inspect and send it yourself.
3. For the cross-site flow, ask:
   > Ask Spec Scout what MVP Profile 0.2 §3.2 requires before and while a caller loads a peer agent site.

   Inspect the peer destination on the consent card and choose **Allow** to try
   loading Spec Scout. **Decline** refuses contact. Watch **Review Desk execution
   graph** and **⚙ Developer** for the actual calls and results. The peer runs in
   your caller tab, not on Spec Scout's server.
4. You can also open Spec Scout directly, configure its own settings panel and ask
   a specification question. Browser settings are origin-local; configuring Review
   Desk does not configure the Spec Scout page.

The browser saves your settings locally and sends the key to the selected inference
router. Use only trusted caller pages and providers; do not put keys in prompts,
URLs, artifacts or screenshots. Specification explanations are not certification,
and model output should be checked against its cited source.

## Where to inspect the seven MVP interoperability checks

These are inspection routes for [MVP Profile 0.2 §6](docs/worldwide_agentic_web_mvp_spec.md),
not a table of pass claims. Runtime-event summaries are not wire-level security
proof; use browser network inspection for routing and credential checks.

| §6 check | Where and how to inspect |
| --- | --- |
| Publish a two-agent network and manifest over HTTPS | Open Review Desk's [manifest](https://almightie0214.github.io/agentic-web/agent-manifest.json) and [resolved network](https://almightie0214.github.io/agentic-web/review_desk.network.json). Compare `front_man`, the coordinator/reviewer definitions and the manifest reference; use **Audit This Site → Audit URL** for a static report. |
| Run in a browser with the published router/model and visitor-selected inference | In **AI model settings**, inspect the default Otari configuration, supply your key and send a chat request. Change **Provider URL** or **Model** for the visitor-selected path; compare model-call trace entries with browser network requests. |
| Call an internal agent and a grounded capability | Supply public artifacts and ask for a conformance explanation. In **Review Desk execution graph** and **Developer**, inspect coordinator → reviewer → `website_validate_network`, its receipt and the report used in the explanation. |
| With approval, load an exact named network from a second origin and run it locally | Send the Spec Scout question above. Inspect the consent destination, choose **Allow**, then inspect B's manifest/definition fetch and `remote_call spec_scout` in the caller tab. Compare the exact name with [links.json](https://almightie0214.github.io/agentic-web/links.json). |
| Keep the user key away from the peer and retain the caller's router | In browser Network, inspect requests to `spec-scout.pages.dev` for credential absence and compare inference destinations before/during the peer call. Inspect locally without copying keys into evidence; the trust display alone cannot establish this. |
| Keep private context absent unless named fields are explicitly allowed | Use the local `site-a/samples/test-slydata.network.json` probe with harmless sentinels and the controlled browser procedure in the verification ledger. Compare peer inputs for deny-by-default and named-field cases. The normal public chat UI does not inject private context, and a declaration-only report cannot prove filtering. |
| Stop invalid networks, cycles, over-budget requests and denied origins visibly | Start with **Missing front_man**, **Invalid schema** and **Peer cycle** to inspect static findings. For runtime refusal, use controlled local fixtures and inspect visible errors and **Developer** traces for each case; static sample reports alone do not exercise runtime stopping. |

## Tools you can reuse

Use Node.js 24 from the repository root. These tools have no npm dependencies to
install.

### Check the repository's published artifacts

```sh
node tools/check-conformance.mjs
```

The CLI reads both local publication roots, reuses Review Desk's validation rules,
and checks file references, link consistency, private-context declarations and
Spec Scout's CORS configuration. Each line includes a status, rule ID and path;
`Static repository conformance: PASS` with exit 0 means the checked local static
artifacts have no failing checks. Exit 1 means a failure. Warnings and runtime
`unverified` findings remain meaningful: this command does not fetch a deployment,
run agents or establish browser consent, credential isolation or answer quality.

### Convert role instructions to portable network JSON

Try the included Markdown sample:

```sh
node tools/theora2hocon/theora2hocon.mjs site-a/converter/samples/claude-agents .theora/tmp/role-demo --layout markdown --front coordinator
```

Try the included three-level Google ADK Agent Config sample:

```sh
node tools/theora2hocon/theora2hocon.mjs site-a/converter/samples/adk .theora/tmp/adk-demo --layout adk
```

For your own Theora project:

```sh
node tools/theora2hocon/theora2hocon.mjs ./my-role-project .theora/tmp/theora-demo --layout theora
```

The command writes `converted_team.network.json`, `agent-manifest.json` and
`links.json`. Exit 0 means the files were written, not deployed or executed. CLI
and web use the same parser and emitters. Theora input is selected from
`.theora/roles/<role>/agent.md`; ADK starts at the input root's `root_agent.yaml`
and reads only its reachable `sub_agents` config files. Markdown uses immediate
`.claude/agents/*.md` when present, otherwise immediate `*.md`. Automatic selection
prefers Theora, then ADK, then Markdown. Explicit `--front` wins over Theora's
config, then the first name-sorted role is the default; ADK always uses its root
agent and refuses a different explicit front.

Theora and Markdown export sanitized role text with a default front-to-specialist
graph. ADK preserves its multi-level `sub_agents` edges and their order, but maps
control transfer to call-and-answer delegation—not equivalent ADK execution.
Unmapped ADK and Markdown frontmatter keys, such as `tools` and `model`, appear as
sanitized key-name notices (unsafe names only as counts), never with their values
or inside the three artifacts. Source tools, model choices, permissions,
scheduling and the source harness are not exported. Review every artifact before
sharing: pattern removal is not a complete secret detector. Importing into Review
Desk performs static inspection only; after checks have no failures, explicitly
select **Run** in **Test run** to send one message using your Review Desk provider
settings. The imported network runs as an unpublished peer, without this site's
actions or stored links. Other-site calls still require policy and consent;
relative peer references have no publication base and are refused. **Stop** cancels
the test, and chat and test runs cannot overlap. Inspect the full answer or error
and latest execution graph, then download the current checked artifacts. Separate
publication is needed only to host the team as its own site.
See the [converter mapping contract](docs/converter.md) for input rules and semantics.

## Architecture in brief

- **Two origins, static hosting:** Review Desk and Role Converter are on GitHub
  Pages; Spec Scout is on Cloudflare Pages. There is no application backend or
  database. Each site publishes a manifest and resolved data-only network.
- **Browser orchestration:** Review Desk delegates locally to its reviewer and
  registered read-only validation action. Its symbolic `spec_scout` link targets
  B's exact network name. Policy checks and visitor consent precede peer loading;
  the loaded peer runs locally using the caller's router and key.
- **BYOK inference:** Visitors choose the router/model in the runtime's settings
  panel. Agent/network `llm_config.temperature` is a separate generation hint;
  model switching preserves it. Keys stay in origin-local browser settings and
  are used for requests to the chosen router, not as peer-definition credentials.
- **Bounded execution:** Networks declare execution time limits under a runtime
  cap. Peer calls cannot extend the caller's deadline; invalid definitions,
  exhausted limits and unresolved or unauthorized calls surface as failures.
- **CSP and consent:** Pages restrict scripts to their own origin, disallow inline
  scripts/eval, workers and objects, and allow connections for HTTPS peers and
  configurable routers. Consent controls peer contact; CSP is not a substitute for
  trusting the caller's JavaScript or the chosen provider.

Verification conditions, full observations and limitations: [demo checklist](docs/demo-checklist.md).

## Source and license

This project is [Apache-2.0 licensed](LICENSE). The
[MVP Profile 0.2 specification](docs/worldwide_agentic_web_mvp_spec.md), attributed
to Cognizant AI Lab, and the vendored nsDeploy reference browser runtime come from
[cognizant-ai-labs/agentic-web](https://github.com/cognizant-ai-labs/agentic-web).
Original runtime documentation and licenses are retained. Local distribution
notices in [Site A's runtime README](site-a/runtime/README.md) and
[Site B's runtime README](site-b/runtime/README.md) describe supported features and
local changes; upstream documentation is provenance, not a promise that every
upstream feature is enabled here.
