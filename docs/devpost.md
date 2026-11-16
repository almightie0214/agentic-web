# Agent Review Desk + Spec Scout

A browser workspace for authors of portable agent networks: find artifact problems,
understand the findings, consult a specification peer, and turn existing role files
into a reviewable network—without running an application backend.

[Review Desk](https://almightie0214.github.io/agentic-web/) ·
[Role Converter](https://almightie0214.github.io/agentic-web/converter.html) ·
[Spec Scout](https://spec-scout.pages.dev/)

## Inspiration

Publishing an agent graph should be easier than debugging it. Authors need to know
where a manifest or network is wrong before spending model tokens, and need a way
to ask what the specification actually says. We wanted deterministic checks and
agent explanations to work together without confusing a plausible answer with a
conformance verdict.

## What it does

**Agent Review Desk** accepts pasted public JSON, built-in samples, or a public
artifact URL. Its key-free report gives rule IDs, JSON Pointer locations and
correction hints. Optional chat delegates from a coordinator to a reviewer, which
uses the local read-only validation action to explain the returned findings.

**Spec Scout** answers questions from cited MVP Profile 0.2 excerpts. Review Desk
can ask this separate site for help: the visitor reviews the destination and
approves contact, then the exact named peer network loads and runs in the caller's
browser with the caller's selected inference router and model policy.

**Role Converter** turns Theora or Markdown roles into a front-to-specialist
conversation graph, or Google ADK Agent Config into a graph preserving its
multi-level `sub_agents` edges. ADK starts at `root_agent.yaml` and reads only
reachable config files. It checks the result and offers a network, manifest and
links file for download. Unmapped ADK and Markdown frontmatter keys such as
`tools` and `model` produce sanitized key-name notices outside the artifacts;
unsafe key names appear only as counts, and values are never included. Files are
processed in the browser; the same modules power the Node CLI. Opening artifacts
in Review Desk transfers data for static inspection, without automatically running
it. After checks have no failures, the visitor can explicitly **Run** one message
in the same tab using Review Desk's provider settings, inspect the answer and
delegation spans, and download the checked artifacts. **Stop** cancels a test;
chat and test runs cannot overlap. The imported network is an unpublished peer:
it inherits neither this site's actions nor stored links, cannot select the key's
router or increase the caller's budgets, and needs policy and consent for any
other-site call. Relative peer references are refused without a publication base.
The converter exports sanitized instructions and edges, not source-harness permissions, tools,
model choices, scheduling or filesystem access. ADK control transfer becomes
call-and-answer delegation, not equivalent ADK execution.

### Try it without a key in one minute

1. Open Review Desk and select **Valid sample** to see a static report.
2. Select **Missing front_man** to see a located finding and correction hint.
3. Open Role Converter, select **Theora role team**, and inspect/download its three
   JSON artifacts. No model request or API key is needed for these steps.

### Chat and peer demonstration with an Otari key

1. In Review Desk, open **⚙ AI model settings**. Enter your authorized Otari API key
   and select **Save and start**. Otari is the default provider. **Advanced settings
   (optional)** exposes **Provider URL** and **Model** for an OpenAI-compatible
   router or a model change. No shared key or key-free inference is included.
2. Ask: **“Ask Spec Scout what MVP Profile 0.2 §3.2 requires before and while a caller
   loads a peer agent site.”** This refers to *Protocol for Loading a Peer Agent
   Site*, not a discovery service.
3. Review the consent card and choose **Allow**. Inspect the peer reply, final answer
   and execution graph/Developer view. **Decline** is also a valid choice. To try
   Spec Scout directly, configure its own origin's settings and ask it a question.

Keys are stored in the visitor's browser and sent to the selected inference router,
not the peer definition host. Treat the caller origin's JavaScript as trusted when
entering a key. Only share public, non-sensitive artifacts or prompts.

## How we built it

We publish two static sites on separate origins: Review Desk and Role Converter on
GitHub Pages, Spec Scout on Cloudflare Pages. Public JSON manifests, resolved
networks and named links connect them using the Worldwide Agentic Web MVP Profile
0.2 data model. B permits cross-origin artifact retrieval through CORS.

We reuse the nsDeploy reference browser runtime from
[cognizant-ai-labs/agentic-web](https://github.com/cognizant-ai-labs/agentic-web).
The local distribution supports one agent loop, internal delegation, same-origin
registered actions and consent-controlled peer loading. A peer contributes data,
not remote execution or the caller's credentials. Unsupported executable features,
including MCP in this distribution, are rejected rather than silently simulated;
the grounded capability here is the registered local validation action.

The UI, action, URL audit and static CLI share one validator. The converter shares
pure parsing/emission modules between browser and CLI. Network time declarations
are bounded by the runtime ceiling; peers cannot extend the caller's deadline.
Generation temperature comes from the executing agent, falling back to its network,
independently of the visitor's model selection. Page CSP restricts scripts to the
site origin and disallows inline scripts, eval and workers.

## Challenges we ran into

The central design challenge is making trust boundaries visible. An artifact check
is not a browser execution test; approving contact is not trusting peer instructions;
a returned tool response is not automatically a successful outcome. We keep rule
findings, acquisition errors, runtime failures, consent decisions and model prose
separate in both reports and execution views.

Conversion has a similar boundary: portable instructions and schemas do not carry
a framework's execution machinery. The generated graph is intentionally inspectable,
and authors must review its public instructions before publishing it.

## Accomplishments

- A useful first experience without an API key: sample inspection, actionable
  findings, public URL auditing and role conversion.
- A connected explanation workflow: coordinator → reviewer → local validation,
  with specification help available through an explicitly approved peer.
- Reusable, dependency-free static-check and role-conversion CLIs in the public
  [Apache-2.0 repository](https://github.com/almightie0214/agentic-web).
- Observable execution alongside configuration, so a visitor can inspect what ran
  rather than infer it from a diagram.

## What we learned

Deterministic validation and language-model assistance are complementary. Keep the
judgment in code, give the model the evidence, and let visitors inspect the boundary
between a published graph and an actual run. A converter is most useful when it is
explicit about the semantics it does not preserve.

## What's next

Make the correction-and-explanation workflow easier to navigate, improve guidance
for authors reviewing converted instructions, and gather feedback on the reusable
CLIs. Broader model compatibility and support for more source layouts need their
own evaluation rather than assumptions about portability.

## Built with

JavaScript ES modules, HTML, CSS, JSON / Neuro SAN HOCON data model, JSON Schema,
nsDeploy browser runtime, OpenAI-compatible inference, Otari, GitHub Pages,
Cloudflare Pages, Node.js built-in tooling. Project and retained upstream material
are distributed under Apache-2.0 with attribution.

## Judging criteria — short responses

| Criterion | Current product evidence |
| --- | --- |
| Technological Implementation | Shared deterministic validation, resolved public definitions, browser delegation, a registered local action and exact-name peer loading use the profile's actual data and execution boundaries. |
| Design | A key-free sample-to-finding path leads into optional explanation; conversion leads to inspection and downloads without silently executing imported roles. Settings, consent and execution views stay in the same browser workspace. |
| Potential Impact | Portable-network authors can locate artifact errors before inference and reuse the static-check and converter CLIs. Existing role instructions become an inspectable starting graph, not an opaque framework port. |
| Quality of the Idea | An agentic website helps review other agentic websites and consults a separate specification peer, while keeping deterministic findings distinct from model interpretation. |

These describe the product, not a judging result or full conformance certification.
Verification records and observation limits: [demo ledger](demo-checklist.md#7-judge-facing-public-check).

## Otari feedback candidate (optional, not sent)

In our small diagnostic sample, qwen3.8-flash responses became garbled with streaming
and no explicit temperature, while non-streaming responses were readable; the
recorded browser runs with explicit temperature 0.2 were readable too. Please expose
effective generation defaults and investigate the streaming/default-setting interaction;
these observations do not identify a provider-side root cause.

## Submission and public-access handoff

**Submission deadline: 2027-01-11 08:00 PT = 2027-01-12 01:00 KST.**
This is an English form draft, not a submitted entry. The following work belongs to
the entrant; do not put credentials or personal account details in this repository.

| Entrant task | Needed result |
| --- | --- |
| Screenshots | English captures of actual findings, conversion and approved peer execution, with keys/personal data removed. |
| Video | Entrant's own English explanation, under two minutes, on public YouTube: one story from artifact problem through correction, delegation and consent. |
| Otari account email / optional feedback | Provide account email privately if requested in the submission form; review the feedback candidate and send only through the chosen private/form channel. |
| Judge inference access | Explain the visitor-key setup and arrange any entrant-owned access required for the demonstration; public pages and static tools themselves need no key. |
| Final Devpost submission | Review claims, attach screenshots/video and required form information, submit before the deadline and retain confirmation. |
| Public availability | Keep the sites, artifacts and video accessible through **2027-01-19 10:00 KST (UTC+09:00)**; check their independent public accessibility. |
