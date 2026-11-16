# Demo checklist and browser evidence ledger

## Status: post-deployment observations recorded; quality limits retained

The [§6 release check](#6-judge-ready-fixes-release-check) now includes the
post-`deadline-config` integration revision `225890d241a9f4ef15956c9c3a69c5ece004d771`
(`origin/main`, not the divergent local `main`). The implementer verified public
changed-file bytes, reran landed-tree Edge/mock-router and local loader/redaction
checks, completed public Edge/CDP and Firefox/BiDi peer execution, and ran one
CLI-generated Theora team on loopback. Each public browser recorded one Allow
consent event/trust count and zero A/converter/B CSP events under the documented
development-router/temporary-profile LNA conditions. **Execution completion is not
answer-quality PASS:** both public peer answers contained partial token corruption.
The Theora final answer had no observed draft/meta sentences, but its specialist
still had meta/awkward text. Independent review and the engine gate are not claimed
complete here; judge access remains entrant-owned and open.

The earlier `ff3c493` public Edge 90-second timeout remains a failure record, not
PASS. Input 62 makes browser execution implementer-owned; no human browser-evidence
handoff is pending. No actual provider key is used in the browser: the existing
local development router holds credentials and the panel receives only
`otk_sentinel_dev` and `http://127.0.0.1:8640/api/v1`. Historical results below remain
unchanged; the new execution update explicitly supersedes earlier pending status.

### Historical status — before judge-ready fixes (2026-11-16)

The user supplied run 1 browser records on 2026-11-16. The implementer read the
sanitized Markdown records, not a live browser session or screenshots. Local
observations and their limitations are recorded in §3; they are not fresh
implementer-run checks. **B05 failed:** duplicate agent names were accepted before
inference. B07 demonstrates peer key isolation and caller-router preservation,
but the loopback cookie mirror sent the key to A's own static server, so broader
key non-disclosure failed. Minimal runtime corrections are implemented. Run 2's
A/B duplicate-name top-loader and peer-loader rechecks passed, as did panel
save/select/delete/reload, tab priority, model switching and A/B static-request
key non-disclosure with caller-router preservation on both models. These are
user-supplied browser observations, tied to the runtime hashes in §3, not an
implementer-operated browser run. Direct provider request headers/bodies and
unexercised limits remain UNVERIFIED. In user input 54, received on 2026-11-16
after 00:13Z, the user confirmed revocation of the exposed run 1 key. Input 55
adds an approximate user-recalled revocation time of **2026-11-16 00:01Z** (not
an exact/account-verified timestamp); no dashboard or credential was reviewed.
**Not submission-ready.**
Public HTTPS/ACAO/404 responses are now measured against revision 298ce2b (§4).
User input 59 supplies the first public-browser run (§4): peer execution reached
the caller router, but **the requested answer failed** and wire key isolation was
UNVERIFIED. That record is retained. Input 61 supplies a separate Edge/CDP run 2:
zero B requests before Allow, B manifest/definition reads and links.json 404,
`remote_call spec_scout`, caller-router inference and a completed section-cited
answer. The three captured B GETs contain no Cookie, Authorization, body or `otk_`
in URL/header values/body. This is a scoped wire observation, not a universal
non-disclosure guarantee or verification of the answer's quotations. Allow still
has no dedicated consent event; an unrelated request origin remains unexplained.
Independent judging access, video and final submission remain incomplete. Writing
this checklist, passing Node checks, or merging it does not complete broader
runtime acceptance or establish submission readiness.

**AW5 converter:** the user-authorized local browser record now reports generated
Theora-team loading and coordinator → specialist delegation **PASS**, twice, but
answer presentation quality **FAIL**, twice (draft/meta text and garbled lines).
Follow-up trace/history diagnostics locate the quality failure in model content,
without evidence of converter/runtime corruption. In input 60 the user withdrew
the prompt/runtime fix request and required no new paid run. The quality FAIL is
retained, not repaired. See [AW5 dogfooding](#aw5-converter-dogfooding) for evidence,
revision correspondence and diagnostic limits; the AW4 records remain separate.

### Original preparation record (before user run; not browser evidence)

- Inspected source revision: `3e5040b05f664bcf1b7f56d5584f01e364fc0fa4`.
  This was the document-only preparation base. After run 1, reviewer-approved
  runtime corrections were added (see §3). Record the candidate revision and
  runtime file hashes again when executing the recheck.
- Available command environment: Windows x64, Node.js `v24.16.0`.
- Executed availability probe:
  `node -e "console.log(JSON.stringify({node:process.version,platform:process.platform,arch:process.arch}));for(const name of ['playwright','puppeteer','@playwright/test']){try{console.log(name+': '+import.meta.resolve(name))}catch{console.log(name+': not resolvable')}}"`
  exited 0 and printed:

  ```text
  {"node":"v24.16.0","platform":"win32","arch":"x64"}
  playwright: not resolvable
  puppeteer: not resolvable
  @playwright/test: not resolvable
  ```

  This establishes only module availability, not whether a browser is installed.
  No browser-control tool, observed browser session, or provider access was
  supplied to this implementation session. Nothing was installed or configured.
- At that historical preparation revision, the binding pointed to
  `https://spec-scout.invalid/spec_scout` in `site-a/links.json`, with the matching
  reserved origin in `site-a/agent-manifest.json`. Revision 298ce2b replaced both
  with the public B address; deployed artifact correspondence is now recorded in §4.
- `site-b/_headers` declares `Access-Control-Allow-Origin: *`. This is a local
  configuration observation, not a measured response header.
- At preparation time no browser run or video had occurred. The later user-run
  environment, revision, models, origins and sanitized trace/request observations
  are recorded in §3. No video or screenshot was reviewed by the implementer.

### Browser execution — user decision, 2026-11-16 (supersedes the handoff below)

- The **implementer executes the browser scenarios itself** and records the
  evidence. Do not ask the user or an operator to run a browser, capture Network
  traffic or supply browser evidence; the advisor answers such questions instead
  of escalating them.
- Tools already on this machine: installed Microsoft Edge (headless, CDP, as in
  `tools/browser-check.mjs`) and Firefox (WebDriver BiDi), each with a fresh
  temporary profile deleted after the run. No software installation is needed.
- Keyed runs use the dev router `.theora/tools/aw-dev-router.mjs`
  (`http://127.0.0.1:8640/api/v1`). Start it if the port is not listening. It reads
  the user's keys from `%USERPROFILE%\.theora\secrets\keys\otari.key`; the browser panel
  gets only the router URL and the sentinel key `otk_sentinel_dev`. Never read,
  print or copy the key file's contents. Otari-side per-key limits cap spending on
  competition credits.
- The user remains responsible only for what an agent cannot do: issuing,
  placing or revoking Otari keys, account and credit state, video, screenshots for
  submission, and the final Devpost submission. Escalate only those.

### Confirmed execution handoff — user decision, 2026-11-16 (superseded above)

- The **user executes the browser scenarios** and supplies sanitized screenshots,
  trace excerpts and Network observations. No implementation-side browser session
  or browser automation installation will be provided. The implementer prepares
  this procedure, reviews supplied evidence and records actual results; the user
  decision does not itself supply execution evidence or waive any case.
- Use the site default hosted Otari router `https://api.otari.ai/api/v1` and
  model `alibaba/qwen3.8-flash`. Use **only Otari competition credits**: no personal
  spending is authorized. Check the remaining credits before running; if credits
  are insufficient, stop and ask the user again rather than enabling billing or
  silently switching providers. The repeated-call budget case needs particular
  care; do not assume a successful setup means sufficient credits for that case.
- The second model is **deliberately not selected in advance**, following the
  user's subsequent decision on 2026-11-16. During execution, open **⚙ AI model
  settings → Advanced settings (optional) → Model**, choose an available Otari
  model other than `alibaba/qwen3.8-flash` from the list, and record its exact ID.
  Apply it with **Save and start** before the comparison run. Do not ask for model
  selection again or guess an ID. An unauthenticated
  `GET https://api.otari.ai/api/v1/models` returned HTTP **401** (no inference
  request); it supplied no model list. The authenticated browser panel is the
  selection surface, and a missing list is a blocked model-switch observation,
  not permission to use another provider or personal funds.
- The user has registered for the competition and will issue an Otari key if
  needed, entering it **only in the built-in panel**. Never send the key in a task
  reply, document, URL, fixture or evidence attachment. Do not install software,
  change account settings, activate hosting or incur unapproved charges.

The user-run evidence has now arrived; see §3 for actual verdicts, failures and
open observations. For subsequent runs use the local setup below or the public A/B
HTTPS URLs recorded in §4. Preserve failed attempts and distinguish earlier
runtime observations from revalidation of a corrected candidate. Request minimal
scope approval for runtime defects and recheck after correction. The public HTTP
measurement, public-browser acceptance and independent judging access are separate
observations; see §4 for their current status.

## 1. Common setup and evidence rules

Reference contract: [MVP Profile 0.2](worldwide_agentic_web_mvp_spec.md), especially
§§3.1–3.4, 4, 5 and the interoperability demonstrations in §6.

1. Record UTC time, operator, commit, dirty diff/fixture changes, browser name and
   exact version, OS, A base URL including subpath, B base URL, selected router and
   model (no key), and whether the run is local or publicly deployed. Verify the
   served artifacts correspond to that revision; keep fixture source and changes
   with the run record. A later revision needs revalidation of affected cases.
2. Serve A with `site-a/` as its publication root and B separately with `site-b/`
   as its root. Different paths on one origin do **not** test peer isolation.
   HTTPS is required publicly; loopback HTTP is only a local-development check.
   B must serve its public JSON with CORS; a generic static server may ignore
   `_headers`. Record actual server commands and response behavior, not just that
   file's presence. Do not serve the repository root as the deployed A artifact.
3. For local/adversarial runs use disposable copies of the artifacts and the
   unchanged vendored runtime. Change A's peer binding and `allowed_peers` together
   to B's real origin/network. Never mutate production data. Local fixture results
   do not establish that the production binding or public deployment works.
4. Start each independent case with a fresh page/engine and cleared disposable
   test-origin state; cached sessions, saved links and remembered consent must not
   hide a fetch or grant policy access. **New chat** resets history, not all peer
   cache/consent. Never clear the user's unrelated profiles. Do not select
   **Always allow** for default-consent checks.
5. Open **AI model settings**, expand **Advanced settings (optional)**, choose or
   enter a supported **Model** and **Provider URL**, enter the key privately, and
   select **Save and start**. It saves a browser setup and reloads. Use this same
   built-in panel to switch to a second available model; record requested and
   provider-reported model separately. Do not switch via query parameters, code
   patches, or a new product panel. Keep the hosted Otari router unchanged and
   record the non-default model selected from its authenticated list. Missing
   access to a second model is UNVERIFIED, not a successful model-switch
   demonstration.
6. Open the browser's Network panel before loading A. Disable cache and preserve
   the log across the setup reload. Keep it through the whole turn, including
   the consent pause. Open the runtime's **Developer** view for agent/tool spans.
   The Review Desk configuration graph is an expectation, not execution evidence.
7. For each case record the actual trigger, preconditions, expected result,
   observed result, run/span IDs, request counts and order, and PASS/FAIL/UNVERIFIED.
   A model saying it used a tool or protected a secret is not evidence. Observe the
   relevant trace and browser requests. If the model never reaches the intended
   call/limit, record that unmet precondition and leave the case UNVERIFIED.
8. Copy only reviewed, sanitized excerpts or screenshots into the run record;
   retain seq/parent/id and timestamps for ordering. Do not publish raw HAR, full
   storage, key-panel screenshots, provider request headers, or raw trace exports.
   Privately inspect headers, URLs (including redirects/query strings), prompts,
   bodies, action arguments, errors and traces for the active key, then record only
   presence/absence and `<redacted>` values. Remove cookies, Authorization values,
   session identifiers and other credentials before sharing. If a leak occurs,
   stop, report FAIL without the secret, and have the user revoke exposed keys.
   Redaction in an attachment must not conceal that the runtime leaked a key.

A separate evidence JSON download is not required. The existing Developer view,
DevTools and inline sanitized excerpts/screenshots are sufficient. Do not create a
Node browser simulation, force the vendor loader to execute in Node, replace
`fetch`/LLM/consent with stubs, or add a runtime harness or product toggle.

### Local two-origin start (user-operated reproduction procedure)

If Python 3 is already installed, use the commands below from the repository
root (including in Windows PowerShell). Do not install it just for this procedure
without approval. First prepare **new disposable copies** and a reachable binding;
the copy command intentionally refuses to overwrite an existing site copy. If
`.theora/aw4-demo/site-a` or `site-b` already exists, stop its servers and archive
that run first, then use a new run directory consistently in all commands.

```sh
python -c "import shutil; from pathlib import Path; d=Path('.theora/aw4-demo'); d.mkdir(parents=True,exist_ok=True); shutil.copytree('site-a',d/'site-a'); shutil.copytree('site-b',d/'site-b')"
python -c "import json; from pathlib import Path; d=Path('.theora/aw4-demo/site-a'); p=d/'agent-manifest.json'; m=json.loads(p.read_text(encoding='utf-8')); m['allowed_peers']=['http://localhost:8001']; p.write_text(json.dumps(m,indent=2),encoding='utf-8'); p=d/'links.json'; j=json.loads(p.read_text(encoding='utf-8')); j['networks']['review_desk']['spec_scout']='http://localhost:8001/spec_scout'; p.write_text(json.dumps(j,indent=2),encoding='utf-8')"
```

In two separate terminals, serve those copies. These servers only serve static
files; they do not simulate a browser or replace the runtime:

```sh
python -m http.server 8000 --bind 127.0.0.1 --directory .theora/aw4-demo/site-a
```

```sh
python -c "from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer; from functools import partial; H=type('CORSHandler',(SimpleHTTPRequestHandler,),{'end_headers':lambda self:(self.send_header('Access-Control-Allow-Origin','*'),SimpleHTTPRequestHandler.end_headers(self))}); ThreadingHTTPServer(('127.0.0.1',8001),partial(H,directory='.theora/aw4-demo/site-b')).serve_forever()"
```

Open A at `http://127.0.0.1:8000/`; use B at `http://localhost:8001/` and the peer
URL `http://localhost:8001/spec_scout`. These origins and hostnames differ, avoiding
same-host cross-port cookie assumptions. Inspect the actual requests regardless.
Stop the servers with Ctrl+C when finished. The B command adds development CORS;
it does **not** validate Cloudflare's deployed `_headers` behavior. Run 1 used a
separate Python logging server with CORS and no-store, not these exact commands;
record actual commands and browser reachability for every new run.

**Safety hold after run 1:** do not reuse run 1's uncorrected runtime or exposed
key. Different loopback hostnames protected B, but did not prevent A's own server
receiving the mirrored key cookie. **Before requesting/serving the corrected code**,
the user must stop old pages/servers, revoke the exposed key privately, and remove
`nsweb_byok_profiles_v1` via the browser's cookie/site-data controls without
opening/copying its value. Cookies are host-scoped, not port-scoped: clean every
used loopback host (`127.0.0.1`, `localhost`, and IPv6 loopback if used), including
other ports on those hosts. Clear only disposable test-origin BYOK local/session
state; preserve unrelated profiles. The implementer must not change the user's
browser state. Then copy the corrected artifacts to a new run directory and start
servers. Cookie removal alone is not a patch success: save/reload using the panel
and confirm no cookie is regenerated and no key reaches A or B (§3 recheck).
Do not export storage or log cookie values; retain the failed record.

For reachable/adversarial variants, use disposable copies rather than editing the
checkout or production. Keep the copy's runtime/site assets together, replace the
B peer URL and allowed origin together in the copied A JSON, and point each
command's directory at the respective copy. Keep local files, fixtures and
sanitized evidence under the project's `.theora/` development area; do not publish
that area. Record the exact copy changes and served paths with the run. Verify
both manifests are readable at their respective base before starting inference.
For B08, retain the `samples/` directory in A so its console snippet can fetch the
original envelope; replace only the three served fixture artifacts as instructed.

Save the reachable baseline copies before adversarial changes. For each case
restore from that baseline, change only that case's JSON in your editor, save as
UTF-8, and reload with cache disabled. In the run record include the changed
fields/full harmless fixture so the implementer can reproduce it. Do not combine
B04's closed policy, B05's invalid graph and B06's wrong name in one fixture: an
earlier rejection would hide the condition being tested. Never edit files inside
the copied `runtime/` directories.

## 2. Browser scenarios (expected observations, not results)

### B01 — Inspect, correct, delegate to two agents, execute the site action

- Load **Missing front_man** in Review Desk and select the current pasted validation
  action as needed. Record the deterministic failure's `ruleId`, path, message and
  hint. Correct the missing manifest `networks[0].front_man` to `review_entry` in
  the editor; validate again and retain warnings/unverified checks. This is a
  static inspection exercise, not proof that the malformed network was executed.
- Supply the complete corrected public manifest and network in chat and ask:
  “Ask conformance_reviewer to validate these complete public artifacts using
  website_validate_network, then explain the report without changing its statuses.”
  Append the actual JSON; never ask it to invent missing artifacts.
- Observe one run with `review_coordinator` → local `conformance_reviewer` agent
  spans and a `tool` span for `website_validate_network`. Inspect the actual
  succeeded receipt and its `result.valid` / `result.checks`, including warnings
  and unverified rows. Compare the explanation with that receipt. A supplied
  report, a UI-only validation, or a claimed tool call is not this action run.
- With **Save and start**, switch the model through the built-in panel, repeat a
  small request and observe `model_call` plus the actual provider request/response.
  Record both chosen models; do not substitute a mock for live inference.

### B02 — Consent, exact peer name and local execution on the caller router

- On a fresh A session with a reachable B binding ask:
  “Ask the linked Spec Scout to explain MVP Profile 0.2 §3.2 exact network matching;
  cite its source and distinguish requirements from observed evidence.”
- Pause at the normal consent UI. Capture its destination origin and purpose/
  request, and the Network timeline showing **zero B requests before approval**.
  Choose **Allow**, not Always allow; record approval time and the first B request.
- Observe B's `agent-manifest.json`, the exact `spec_scout` entry and its declared
  definition URL, then `spec_scout.network.json` and any `links.json` attempt.
  B currently has no links file; record its actual 404 separately. Confirm
  `remote_fetch` and `remote_call.network === 'spec_scout'`, and a descendant
  `spec_scout` agent/model call in A's runtime. Record a real answer with source
  sections; do not treat it as a conformance report.
- Inspect every definition fetch's full URL, redirect destinations, method,
  request header names and sanitized values, request body (expected none for
  GET), status, response headers and public response body. Observe actual CORS
  access from A; a successful command-line fetch cannot establish browser CORS.
- Correlate the peer model span with the provider request in the Network panel.
  A peer executes locally; `remote_call.requestPayload` is **not an HTTP POST to
  B**. No B page code or site action is needed for this informational peer.

### B03 — Decline consent

Repeat B02 in a fresh session, pause to establish the pending consent and zero B
requests, then choose **Decline**. Record the `consent` note with
`decision: 'declined'`, the visible limitation/tool result, and zero B definition
fetches, `remote_call` spans and B model calls for this attempt. Count through turn
completion, not just while the dialog is open. B02's approval must not carry over.
(Use B02 as the allowed control.) Allowed decisions may have no dedicated consent
trace note; the UI and Network timeline must then establish approval order.

### B04 — Denied origin without a caller-owned grant

In a disposable A network replace the peer tool reference with a **direct** B
network URL; remove the named link slot/binding for that tool and set
`allowed_peers: []`, `peer_policy: { mode: 'closed' }`. Keep a valid local front
agent. Start fresh; do not enter B through the link dialog or retain runtime
origin grants. Ask the front agent to call the direct tool and approve contact if
the UI asks, so consent rejection cannot mask the policy check. Expect a visible
`Policy: … allowed_peers` refusal, zero B requests and zero peer invocations.
Confirm the tool attempt occurred and compare with an otherwise identical allowed
control. Named-link resolution can add caller-owned origin grants; using that
path would not isolate the closed-manifest denial being tested here.

### B05 — Invalid networks rejected by the actual loader

Use separate disposable fixture revisions and a fresh browser page for each.
Load malformed definitions through `boot()`/the page's normal loader, not just the
Review Desk editor. Record the fetched bad body, compile error and zero model
requests for that invalid network. For a bad peer, A may call its own model to
request delegation; the zero-call requirement applies to the rejected peer.

- Invalid JSON and a valid JSON network with `tools: []`: both must refuse loading
  visibly before inference. Also test a missing local reference on an otherwise
  valid graph; do not let malformed JSON mask that structural validation case.
- **Duplicate agent names:** on a valid two-agent graph keep a distinct front
  agent referencing `worker`, then declare two agents named `worker` with valid
  instructions and empty tool arrays. Keep the manifest/front relationship and
  all other fields valid. This isolates duplicate identity, rather than relying
  on an unrelated missing-front or missing-reference error. Expect loader refusal
  before any model call. An overwritten duplicate in an internal map is a FAIL,
  even if Review Desk or the CLI flags the duplicate correctly.
- Retain a valid control loaded with the same browser/server setup. Provider
  authentication failure does not prove a malformed network was refused.

### B06 — Wrong explicit peer network name never falls back

On a fresh disposable A bind to `<B-base>/does_not_exist` while B publishes only
`spec_scout`. Keep the B origin allowed, use a valid A graph, and approve the
normal consent UI. Do not use interactive link entry/name normalization as a
substitute for this explicit published URL. Observe the actual B manifest and the
`No published network named 'does_not_exist'` error (or equivalent exact-name
refusal), no fallback definition fetch and zero B model calls/`remote_call`
starts. A caller model may already have selected the tool. Repeat B02 as the
correct-name control. A DNS error at `.invalid` would not exercise this condition.

### B07 — Key non-disclosure and caller router preservation

With active BYOK repeat B02 against a disposable B whose `llm_router` points at a
different harmless, operator-controlled endpoint (no key in that manifest), while
A selects the real router in its built-in panel. Keep everything else valid.
Record B's conflicting declaration and the selected A router before the run.

Privately inspect the active key against all definition-fetch URLs, headers and
bodies, redirects, model prompts, action arguments, trace fields and errors.
Record only booleans and sanitized header shapes: B must never receive it. Only
requests to the chosen router may carry the provider credential; distinguish the
panel's optional `/models` catalog request from inference. Observe the B agent's
actual model request still reaching A's selected router/model policy, no request
to B's advertised router, and the matching `model_call` fields. Metadata alone,
the success badge alone, or keyless execution is insufficient. Check a fresh
second-model run after switching in the panel as well.

Run 1's BYOK setup mirrored profiles to a loopback host cookie across ports. The
corrected source removes that path; remove existing cookies manually **before any
new code request**, as described in the safety hold. Do not assume port separation
isolates cookies. Inspect A's own static requests as well as B, the advertised
router and the selected provider; require no key on A/B URLs, headers or bodies
and no regenerated BYOK cookie after panel save/reload. Never omit a
credential-bearing request from the verdict.

### B08 — Inject private context through the existing runtime option

1. Fetch `site-a/samples/test-slydata.network.json` as **inspector input**. It is
   an envelope, not a deployable definition or invocation context. In a disposable
   A copy serve `sample.manifest` as `agent-manifest.json`, `sample.network` as
   `test_slydata.network.json`, and `sample.links` as `links.json`. Keep the existing
   runtime and page boot; replace the reserved B binding and allowed origin
   together. Configure the model through the built-in panel as above.
2. After boot/settings reload, in the real browser's DevTools use the existing
   debug handle and invocation option (no fetch/consent/model stubs):

   ```js
   const { engine, trace } = window.__nsweb;
   const sample = await (await fetch('./samples/test-slydata.network.json')).json();
   const firstSeq = trace.events.at(-1)?.seq ?? -1;
   const result = await engine.runTurn(
     'Ask context_observer to restate this public question, then ask Spec Scout: what does MVP Profile 0.2 say about private context?',
     { slyData: sample.network.sly_data }
   );
   const peerStarts = trace.events.filter(e =>
     e.seq > firstSeq && e.kind === 'remote_call' && e.phase === 'start');
   peerStarts.map(e => ({ id: e.id, parent: e.parent, seq: e.seq,
     network: e.network, requestPayload: e.requestPayload }));
   ```

   Keep the existing consent UI; choose Allow there while the promise waits. Do
   not send another chat turn concurrently. The API result is inspected in
   DevTools; it need not appear as a new chat bubble. Confirm `peerStarts` is
   nonempty and belongs to this run, with the intended peer/model actually run.
3. Confirm at the invocation boundary that **both** harmless values were passed:
   `private_sentinel: 'AW4_PRIVATE_SENTINEL_NOT_A_SECRET'` and
   `public_sentinel: 'AW4_PUBLIC_SENTINEL_NOT_A_SECRET'`. Keep these values out of
   user text/instructions. Declaring `network.sly_data` alone does not inject them.
4. Inspect the post-filter `remote_call.requestPayload.sly_data`: expect exactly
   `{ "public_sentinel": "<redacted>" }`, with `private_sentinel` absent. Record
   the actual field set, not a model's claim or a request preview. Inspect
   `user_message.text` separately: ordinary delegated text is not private context
   and must not accidentally contain either sentinel.
5. Remove the front agent `context_probe`'s `allow` block **only in the disposable
   fixture**, reload a fresh engine and repeat the same injection and consent.
   Expect `sly_data: {}`. Compare against the explicit public-field allow control.
   An empty trace with no actual peer call proves neither filtering nor denial.
6. In both runs also inspect B definition-fetch URLs, headers and bodies as in
   B02. Neither sentinel nor the key belongs in these static GET requests. The
   redacted trace proves observed forwarded field names, not exact received values,
   general destination scoping, or upstream propagation. Do not claim those extra
   properties without separate boundary observations.

### B09 — Synthetic composition cycle

Use disposable root-hosted networks on separate origins: A front → direct B URL,
B front → direct A URL with the **same network identity as the active ancestor**.
Allow each origin on the immediate caller and retain normal consent. In the
copied A `review_desk.network.json`, replace the coordinator's `spec_scout` tool
reference with `http://localhost:8001/spec_scout`. In the copied B manifest set
`allowed_peers` to `["http://127.0.0.1:8000"]`. In B's `spec_scout.network.json`
set its front agent's `tools` to `["http://127.0.0.1:8000/review_desk"]` and replace
its informational-only instructions for this fixture with: “Try the published
review_desk tool to answer this public question; if the runtime excludes or refuses
it, report that limitation visibly and do not invent an answer.” Keep A's normal
allowed B origin. Ask A to delegate the public question to Spec Scout. Observe
the actual run, not just the fixture instructions.
Record A/B identities, active chain, completed A→B contact and the return edge's
`composition_skip` / cycle refusal and its reason. The forbidden A re-entry must
not start a second ancestor invocation/model call or contact A for that edge.
A skipped tool may be excluded before the model can select it: record that trace
and the resulting visible limitation, not a fabricated error span. A failure from
origin policy, a wrong network name, or a budget consumed earlier is not cycle
evidence. Include a non-cyclic A→B control. The static **Peer cycle** sample
only tests declarations and cannot replace this execution.

### B10 — Exceed an actual execution budget

Use a fresh, valid disposable A graph with a front agent calling a local helper
repeatedly in one turn (no peer calls, so peer limits cannot mask the agent limit).
For a concrete fixture, replace only the copied `review_desk.network.json` with:

```json
{
  "max_steps": 32,
  "tools": [
    {
      "name": "budget_front",
      "function": { "description": "Exercise a bounded batch of harmless local calls." },
      "instructions": "For the public count requested by the visitor, call budget_helper exactly that many times in one batch if supported. Each request is only say OK. Report runtime skips and errors visibly; do not retry skipped calls or invent results.",
      "tools": ["budget_helper"]
    },
    {
      "name": "budget_helper",
      "function": { "description": "Return a short harmless acknowledgement." },
      "instructions": "Reply only OK. Do not request other tools or private data.",
      "tools": []
    }
  ]
}
```

Set the copied manifest's `networks[0].front_man` to `budget_front`, keeping its
network name `review_desk` and its definition path unchanged. Keep the router and
key/model selection in the built-in panel. First ask “Call budget_helper twice
and report the results” as the under-budget control. Then, in a fresh session,
ask “Call budget_helper 24 times in one batch and report the results, including
any runtime refusal.” The front invocation plus 24 helpers crosses the unchanged
24-agent-invocation per-turn cap. This uses real model calls, so verify competition
credits first; stop on insufficient credits without personal spending.

Observe the actual attempt beyond that cap, `composition_limit` with
agentCalls/reason, a visible skipped/error result, and **no agent/model start for
the rejected invocation**. Count actual attempted calls and trace reasons: if the
model issues fewer calls or a different boundary intervenes first, this cap's
case remains UNVERIFIED. Do not lower a runtime cap, fake tool calls, or count
instructions as attempts. The fixture's finite model-step allowance only makes
the scenario reachable; it is not itself proof of enforcement.

Record separately any additional limits exercised: the current runtime initializes
four remote calls, one call per peer per turn, 24 agent invocations and a 90-second
composition deadline; the registry's default depth is five. These are source
observations, not enforcement results. A separate remote-budget fixture needs
otherwise valid, allowed, non-cyclic distinct peer identities; repeated calls to
one peer test its one-call cap, not the total remote cap. To claim elapsed-time
protection, observe a genuinely running/pending operation crossing the deadline
and whether it stops visibly; a later denied invocation alone does not establish
an in-flight timeout. Network `max_steps` / `max_execution_seconds` declarations
and CLI warnings are not evidence of enforcement. If a limit silently returns an
empty success or execution continues past the tested boundary, record FAIL.

## 3. Execution ledger — user-supplied local browser run 1

### Provenance and limits

Received via user input 49 on 2026-11-16; execution timestamps are **2026-11-15
UTC**, not the receipt date. Operator: a Claude Code session controlled the Claude
desktop app's built-in browser on the user's behalf. The user alone entered the
key in A's built-in panel; the operator did not type, read or record it. Active-key
checks were in-page comparisons returning booleans, not key exports.

Environment: Windows 11 x64; Chrome `156.0.8078.75`, Claude `5.11492.5` Electron;
Python `3.14.6` static logging servers with `Access-Control-Allow-Origin: *` and
`Cache-Control: no-store`. Disposable artifacts were under
`.theora/aw4-demo/run1/<a|b><port>/`, A on `127.0.0.1`, B on `localhost`.
Router: `https://api.otari.ai/api/v1`; default model `alibaba/qwen3.8-flash`;
second model `alibaba/qwen3-30b-a3b-instruct-2507` selected from the authenticated
panel list. Costs used competition credits only, no personal billing. No credit
balance page was inspected and no credit error occurred. Two upstream 429
`upstream_rate_limited` responses occurred at 18:52–18:53Z in B05; these are not
loader rejection evidence or proof of a remaining credit balance.

Reported served source: main `25840d04cd5a77b98f8430b9ae25635163507e18`.
The implementer independently ran
`git diff 3e5040b05f664bcf1b7f56d5584f01e364fc0fa4 25840d0 -- site-a site-b`:
exit 0, empty output. Implementation HEAD at review of the evidence was
`3e5040b05f664bcf1b7f56d5584f01e364fc0fa4`. Thus the source artifacts match the
Task base; each case still uses the disposable fixture changes below. This is
not a new run on any later corrected runtime. No runtime was modified for run 1.

Evidence read by the implementer:
`I:/project/agentic-web/.theora/aw4-demo/run1/evidence/INDEX.md` (lines 1–31),
`B01.md` (1–37), `B02.md` (1–32), `B03.md` (1–19), `B04.md` (1–20),
`B05.md` (1–18), `B06.md` (1–17), `B07.md` (1–22), `B08.md` (1–18),
`B09.md` (1–20), `B10.md` (1–15), all in that directory. Essential sanitized
observations are transcribed below so review does not depend on an external path.
No screenshots, raw HAR, raw browser trace or provider request headers/bodies were
reviewed. The server log `run1/requests.jsonl` is referenced by these supplied
records; its aggregate counts below are **operator-reported**, not independently
recounted here. It logs header names and `otk_` presence only, never values. The
records do not contain complete per-request response headers/public JSON bodies
or an explicit redirect inventory; those observation fields remain UNVERIFIED.
Successful browser reads establish local CORS usability, not public CORS headers.

| ID | Required observation | Verdict (run 1 only) | Actual result / blocker |
| --- | --- | --- | --- |
| B01 | Correction, two-agent delegation, succeeded site action, panel model switch | PASS | Static 25 pass / 0 fail; reviewer action succeeded; both live models requested = reported; instruction deviations retained below |
| B02 | Approval before contact; exact peer loaded/executed locally | PASS | 0 B requests before Allow; 3 GET afterward (links 404); spec_scout executed on caller router |
| B03 | Decline prevents contact | PASS | Pending consent observed; decline note; 0 B requests/remote calls/peer model calls through completion |
| B04 | Denied origin fails closed | PASS | Direct tool attempted; consent approved; allowed_peers refusal before any B request; allowed control reached B |
| B05 | Invalid JSON/graph/reference and duplicate-name loader refusal before inference | FAIL | First three refused; duplicate worker accepted, second overwrote first, model call started |
| B06 | Wrong explicit peer name refused without fallback before peer inference | PASS | Only B manifest fetched; exact-name refusal; 0 remote_call / peer model calls |
| B07 | Key isolation and caller router retained against conflicting B metadata | PARTIAL / FAIL overall non-disclosure | Peer isolation + caller router PASS on both models; key sent to A static server via cookie (FAIL); provider headers/bodies unobserved |
| B08 | Actual sentinel injection; explicit allow and deny-default payload comparison | PASS (field filtering) | Both invocation values supplied; actual remote_call sly_data = public_sentinel only vs {}; peer ran in both |
| B09 | Cycle interrupted with visible result and no forbidden re-entry | PASS | composition_skip, tool excluded; 2 agents, 1 remote_call, no ancestor re-entry |
| B10 | Over-limit attempt blocked visibly with no prohibited invocation | PASS (24-agent cap only) | 24 helper attempts; front + 23 helpers started; next helper visibly skipped; other limits UNVERIFIED |
| P01 | Public HTTPS and CORS response measurements | Run 1 UNVERIFIED; public HTTP follow-up PASS (§4) | Run 1 was loopback only; 2026-11-16 public GETs now measure HTTPS/ACAO/404 on artifacts matching 298ce2b. Actual public-browser CORS is tracked separately below. |
| P02 | Demonstrated public revision and independent judging access | Public-browser flow / B request isolation PASS (run 2, scoped); judge access UNVERIFIED | Input 59's failed answer and absent wire evidence remain historical. Input 61 (§4), Edge/CDP: pre-run A links/manifest/network byte-match main 24395e4 (same peer artifacts/runtime as 298ce2b); 0 B requests before Allow; manifest/definition 200, links 404, ACAO *, no redirects; remote_call spec_scout and caller Otari model; completed cited answer. All 3 B GETs: Cookie/Authorization absent, no body or otk_ in URL/header values/body. Allow event missing; quote accuracy not checked; unrelated origin unresolved; independent judging access still open. |

### Sanitized case observations (actual, not expectations)

All times below are UTC on 2026-11-15. All cases use the router above and the
default model unless the second model is explicitly named. Trace IDs and seq
numbers are page/run-local; do not join `s4` across different cases.

**B01, 18:38–18:44 — `B01.md`.** A `http://127.0.0.1:8000/` (a8000), B
`http://localhost:8001/` (b8001). A copy changes only allowed_peers and
review_desk.spec_scout binding to that B origin/network. Fresh page; user entered
key in the panel. Missing front_man sample failed `manifest.front_man`,
`network.identity.front_man`, `network.front_man.selected`. Adding `review_entry`
in the editor yielded 25 PASS / 0 FAIL / 2 WARNING / 2 UNVERIFIED. The B01 prompt
above plus complete corrected JSON produced this actual path:

```text
seq 3 18:39:43 run s3 start
seq 4 agent s4<s3 review_coordinator
seq 7 tool s7<s4 website_validate_network -> succeeded valid=true
seq 12 tool s12<s4 conformance_reviewer
seq 13 agent s13<s12 conformance_reviewer
seq 16 tool s16<s13 website_validate_network
seq 18 tool_result action=http://127.0.0.1:8000/review_desk#validate_network
       status=succeeded valid=true
seq 657 agent s13 end ok; 660 tool s12 end ok
seq 973 18:41:27 agent s4 end ok; 976 run s3 end ok
```

Five model calls to api.otari.ai; no B requests. Reviewer and coordinator preserved
25/2/2 counts and distinguished static validity from live certification. Deviations:
coordinator used the action before delegating despite its routing instruction;
reviewer supplied activePeerChain=[] despite instructions to omit unknown context.
These do not erase the observed delegation/action but are not instruction-perfect
behavior. At 18:43–18:44 the operator switched via ⚙ AI model settings → Advanced
settings → Model → Save and start to `alibaba/qwen3-30b-a3b-instruct-2507` and asked
for a one-sentence description without tools: seq 5 model_call start, 56 end ok,
60 run end ok. Requested/reported model matched on both models (`verifiedReal=true`
for the switch). Catalog GET /models 200; inference POST /chat/completions 200.
Restored default afterward. Active key in trace, page URL and visible text: false.
A-server cookie disclosure was observed, not hidden by these negative checks.

**B02, 18:45:03–18:46:42 — `B02.md`.** Same a8000/b8001; fresh engine after
Save and start; only BYOK profile/tab state retained, no remembered consent. B02
prompt above. Consent card named localhost:8001 and request/purpose, pending
18:45:08–18:45:24; B server count was 0 at 18:45:18. Allow (not Always allow) at
approximately 18:45:24 preceded contact:

```text
seq 7 18:45:08 tool s7<s4 spec_scout
seq 8 link target=http://localhost:8001/spec_scout
seq 9 18:45:24 remote_fetch s9<s7 start
seq 10 remote_fetch end ok network=spec_scout
       manifest=http://localhost:8001/agent-manifest.json
       hocon=http://localhost:8001/./spec_scout.network.json
seq 11 remote_call s11<s7 start network=spec_scout sly_data={}
seq 12 agent s12<s11 spec_scout origin=localhost:8001
seq 13 model_call s13<s12 alibaba/qwen3.8-flash routerHost=api.otari.ai
seq 149 18:46:13 model_call end ok; 153 remote_call end ok
seq 387 18:46:42 run end ok
```

B received exactly GET /agent-manifest.json 200, /spec_scout.network.json 200,
/links.json 404, body length 0; no Cookie/Authorization header, no `otk_` in path,
header values or body. Header names included Accept, Accept-Encoding,
Accept-Language, Connection, Host, Origin, Referer, Sec-Fetch-*, User-Agent,
sec-ch-ua*; links also Cache-Control/Pragma. No dedicated allowed consent note:
UI plus request ordering establish approval. Peer returned §3.2 citation; summary
questioned its prose coherence and retained the quoted excerpt. This is execution
and source citation evidence, not proof that the generated explanation is correct.

**B03, 18:47:46–18:48:13 — `B03.md`.** Same baseline; cleared cached link and
all localStorage except BYOK, reloaded fresh engine. Same prompt; consent pending
18:47:51–18:48:01, then Decline. Seq 9 consent decision=declined (parent s7);
seq 10 tool ends `ok`, but seq 11 tool_result explicitly says user declined;
seq 162 run ends. Visible answer says peer contact did not occur. Through turn
completion: 0 B requests, remote_fetch, remote_call or peer-origin model calls.
Two coordinator inference requests occurred on api.otari.ai. Allowed control B02.

**B04, 18:48:55–18:50:15 — `B04.md`.** a8004 at 127.0.0.1:8004 changes
coordinator tools to [conformance_reviewer, direct localhost:8001/spec_scout URL],
removes link_slots, empties review_desk links, sets allowed_peers=[] and closed
policy. New origin, no grants/link dialog. Same network/links control a8014 differs
only in allowed_peers=[http://localhost:8001]. Asked the direct peer tool for §3.2.
Denied case seq 7 tool attempt, consent Allow, seq 8 error at 18:49:10:
`Policy: localhost:8001 is not in review_desk's allowed_peers; refusing to contact it.`
Seq 46 run ends with visible exact refusal; 0 B requests/remote spans/peer models.
Control first attempted unknown http_get (refused), then spec_scout seq 12,
remote_fetch seq 13 and remote_call seq 15 at 18:50:15, peer agent/model started
on api.otari.ai. Consent-before-policy ordering did not cause forbidden contact.

**B05, 18:51–18:53 — `B05.md`.** Separate fresh origins a8051–a8055; only
review_desk.network.json changed. Normal page boot used real loader; a detached
mount's exported boot() also exposed the exact error (no fetch/model/consent stubs).

| Fixture | Actual loader observation | Inference / verdict |
| --- | --- | --- |
| a8051: truncated `{"tools": [ { "name": "review_coordinator", ` | Generic visible load refusal; HOCON parse error line 1:45 unexpected end inside object | 0 chat/completions; PASS |
| a8052: tools=[] | Visible refusal; tools array must not be empty; no front-man found | 0 chat/completions; PASS |
| a8053: valid graph except missing_helper reference, no link_slots | Visible refusal; review_coordinator references missing tool missing_helper | 0 chat/completions; PASS |
| a8054: valid front review_coordinator → worker, two valid workers with FIRST/SECOND instructions | Page boots; compile seq 0→2 ok; specMap has only coordinator and worker=SECOND | seq 5 model_call at 18:52:16; FAIL |
| a8055: same graph with second worker removed | Boots and compiles normally; coordinator + worker map | Valid loader control |

The duplicate graph reached inference twice, both attempts ending in upstream 429.
No worker answer was observed; inference starting already violates pre-model
refusal, and the loaded map establishes overwrite. Cause confirmed in source:
`AgentNetwork` fills specMap using Map.set without uniqueness enforcement, and the
cross-compiled validator supplies no duplicate-name refusal. The independent
Review Desk `agent.name` static rule does not protect the runtime loader. This
violates spec §2.1 unique names / §5 fail-closed. Both vendored copies need the
same minimal correction. The source correction is described below; run 1 remains
FAIL and does not establish a browser pass for that correction.

**B06, 18:54:15–18:54:36 — `B06.md`.** a8006 binds the allowed B origin to
explicit http://localhost:8001/does_not_exist; B still publishes only spec_scout.
Fresh origin, valid A graph, normal consent Allow. Seq 7 tool selected; seq 9
remote_fetch at 18:54:31; seq 10 refuses:
`No published network named 'does_not_exist' at localhost:8001; refusing to run a different network.`
Visible answer quotes it, no invented explanation. Only B manifest GET 200,
no Cookie/Authorization/`otk_`; no fallback network GET, no remote_call or peer
model. Run ends seq 38. B02 is the correct-name control.

**B07, 18:55:11–18:57:48 — `B07.md`.** A a8017 on 127.0.0.1:8017 allows
and binds localhost:8007/spec_scout. B b8007 changes llm_router base_url and
byok_router to http://localhost:8099/v1, mock=false, with a harmless logging sink
on 8099. A engine.userRouter remains api.otari.ai, BYOK active. B02 prompt, Allow.
Default-model peer seq 11 remote_call → seq 12 spec_scout → seq 13 model_call
at 18:55:23, routerHost api.otari.ai; seq 100 ends with matching respModel.
After panel model switch and fresh engine/cleared non-BYOK state, model ends seq
6/406/806 (caller/peer/caller) all request and report the second model, api.otari.ai,
status ok. B received 3 static GET per run (links 404), body length 0, no
Cookie/Authorization/`otk_`; advertised router sink received **0** requests.
Active key in trace and resource URLs: false. Provider headers/bodies were not
captured, so credential-to-router delivery is inferred from authenticated success
and keySource, not directly observed. The source record's PASS applies only to
peer isolation/router preservation: its statement that only router requests carry
the key cannot be generalized because A received it in a cookie (35/36 A requests
in this case). Overall non-router key non-disclosure is FAIL, not PASS.

**B08, 18:58:51–19:00:30 — `B08.md`.** a8008 serves the sample envelope's
manifest/network/links as the three artifacts, bound to b8001; runtime and samples
unchanged. a8018 differs only by removal of context_probe.allow. Actual invocation
uses the B08 engine.runTurn snippet with **both** private and public sentinel
values at the slyData option boundary, neither in text/instructions. Normal Allow.
Explicit allow: context_observer ran seq 7–18; peer tool s22; remote_call s26,
parent s22, seq 26, network=spec_scout, requestPayload.sly_data exactly
`{"public_sentinel":"<redacted>"}`. Fresh deny-default engine: corresponding s26
payload `{}`. Both spec_scout model calls ran successfully on api.otari.ai.
Delegated text contained neither sentinel; whole trace contained neither raw
sentinel nor key. Both B fetch sets: manifest/network/links GET, body 0,
no Cookie/Authorization/`otk_`; paths had no sentinel. Full sentinel absence from
all header values was not separately recorded. PASS is limited to observed
post-filter field sets, not exact delivered values, upstream or general scoping.

**B09, 19:01:10–19:01:44 — `B09.md`.** a8009 direct tool
http://localhost:8019/spec_scout (no link slot/binding), allowed B origin;
b8019 allows http://127.0.0.1:8009 and exposes that exact ancestor review_desk URL
as a tool with the B09 instructions. Consent Allow; seq 9 remote_fetch completes,
seq 10 remote_call s10; seq 11 spec_scout agent s11; seq 12 composition_skip
(parent s11) target=http://127.0.0.1:8009/review_desk, reason
`already visited in this request`. Seq 13 peer model has toolNames=[]; seq 145
run ends. Visible answer describes excluded/unavailable tool without inventing a
result. Active chain review_desk@127.0.0.1:8009 → spec_scout@localhost:8019.
Agent starts=2, remote_call=1; no forbidden model/re-entry; B received its 3 GET,
A no return-edge request during the turn. Non-cyclic controls B02/B07.

**B10, 19:02:22–19:03:40 — `B10.md`.** a8010 uses the exact budget fixture
above, manifest front_man=budget_front, all runtime caps unchanged. Fresh two-helper
control: 2 helper agents/models succeeded. Fresh over-limit run actually attempted
24 helper calls (all parent s4), started 24 agents total = front + 23 helpers:

```text
24th helper tool s213
seq 214 19:03:16 composition_limit parent=s213 agent=budget_helper
  agentCalls=24 reason="the per-query limit of 24 agent invocations was reached"
no agent start or model_call under s213
tool_result: "Skipped budget_helper: the per-query limit of 24 agent invocations
  was reached. Continue with available results and do not retry it."
```

Run ended ok; visible answer reported 23 successes and one runtime refusal. Its
attribution to an earlier call was inaccurate; trace is the counting authority.
27 model calls total (front rounds + helpers), none for rejected invocation. A
helper with tools=[] also called website_validate_network (s149 under agent s110,
succeeded receipt valid=false); manifest site actions are offered globally to local
agents. Skipped tool ends ok but note/result expose refusal. Only 24-agent cap
PASS; total remote, per-peer, depth, concurrency and elapsed-time limits remain
UNVERIFIED. A 104-second B01 run alone does not prove or disprove the composition
deadline contract; no dedicated pending-operation timeout observation exists.

### Findings and next actions (do not hide failures behind successful spans)

1. **Duplicate identity / B05 — corrected; run 2 browser recheck PASS.** Cause
   and run 1 failure above; approved source correction and exact/trim/replacement
   top-loader plus peer-loader observations below. Run 1 FAIL is retained.
2. **Loopback key cookie / B07 — source corrected and run 2 PASS for observed
   static-request isolation; old-key revocation subsequently user-confirmed.** Run 1 INDEX reports 688 server
   requests: 666 A, 22 B (b8001=13, b8007=6, b8019=3), advertised sink=0. Of A
   requests 639 contained `otk_`; none of B's 22 had it, Cookie or Authorization.
   byok.js reads/writes whole saved profiles including key as a host cookie on
   loopback. A's static server is not the chosen router. Separate hostnames prevent
   peer cookie sharing but do not fix the cause. User owns key revocation and
   private cookie/profile cleanup. Approved source changes remove this persistence
   path in both runtime copies, without old-data compatibility code. Spec §4
   Reference storage permits loopback cookie persistence as MAY: this is not
   labeled a definite spec violation. Removal is the chosen response to observed
   non-router exposure in this Goal's key non-disclosure validation.
   Run 2 rechecked A as well as B, sink, trace and models after correction (below).
   Cookie non-regeneration passed; that does not revoke an already exposed key.
   Input 54 subsequently supplies the user's private account-action confirmation
   (receipt after 00:13Z on 2026-11-16). Input 55 estimates revocation at about
   00:01Z that day from user memory, not an exact account timestamp. No further
   live-key run is needed/requested to establish that confirmation.
3. **Refusal represented by ok tool end — observed, not a silent success.** B03
   consent/tool_result and B10 composition_limit/tool_result plus visible refusal
   establish denial. Do not use tool status alone. No trace taxonomy change in this
   task; rejection behavior remains observable.
4. **Manifest actions exposed to every local agent — observed.** B10 helper's
   tools=[] did not withhold website_validate_network. This matches the vendor's
   manifest-level action exposure; do not claim per-agent action isolation. B01's
   coordinator direct action also shows instruction routing is not a hard boundary.
   No broader action-authorization change is inferred or implemented here.
5. **Direct-URL consent before policy — observed.** B04 Allow precedes closed-policy
   refusal; zero contact proves policy still fails closed. Document ordering rather
   than interpreting consent approval as a policy grant.

Missing fields are not retroactively filled from expectations: complete definition
fetch URL/redirect/header/body response inspection and provider request inspection
need follow-up capture where unavailable. Public P01/P02 require actual deployed
URLs, HTTPS/CORS and independent judging access. No public-ready claim, video
completion or corrected-runtime browser pass is supported by run 1. Do not repeat
live-key runs until corrected artifacts and safe user key/cookie handling are in
place.

### Approved source correction and required user recheck

Reviewer input 50 approved only the two root-cause corrections, including the UI
import/hint and local distribution notices; this is not independent review PASS.
Both `site-a/runtime/` and `site-b/runtime/` now have identical corrections:

- `kernel.js`: `AgentNetwork` applies existing `filterConfig` first, then checks
  `specMap.has(agent.name)` and throws `Duplicate agent name 'worker'.` before
  Map.set can overwrite a normalized name. Replacements and whitespace trimming
  therefore cannot bypass rejection. `Engine._compile` constructs this type for
  top and peer networks before building their model client; existing compile /
  remote_fetch failure handling carries the refusal. No new loader or runtime.
- `byok.js`: removes cookie read/write, loopback predicate, cookie-only constants
  and newer-store selection. Only origin-local profiles and tab session settings
  remain; profile selection/deletion and tab priority are retained. No old-cookie
  reader, migration, automatic deletion or compatibility export remains.
- `ui.js`: removes canUseByokCookie import and cookie-sharing hint branch, using
  the existing non-cookie text: “Saved setups are kept in this browser for this
  site.” No panel redesign. Both runtime READMEs record these local changes.
- `tests/smoke.test.mjs`: A/B regression coverage for normalized duplicate refusal
  and cookie-free BYOK behavior. Node regression results are separate from browser
  acceptance and cannot turn run 1 FAIL into a browser PASS.

#### Source-check evidence for the corrected snapshot (not browser evidence)

The implementer ran these checks on the uncommitted candidate atop base
`3e5040b05f664bcf1b7f56d5584f01e364fc0fa4`, Windows x64 / Node.js v24.16.0:

- `node --test --test-name-pattern="^smoke: Site [AB] (network rejects duplicate names after config filtering|BYOK uses only current tab settings and saved profiles)$" tests/smoke.test.mjs`
  → exit 0, `tests 28`, `pass 28`, `fail 0`, `cancelled 0`, `skipped 0`,
  `todo 0`, `duration_ms 75.7315`. Both sites exercised exact/trim/replacement
  collisions, valid and missing-reference controls; BYOK save/select/delete/tab
  priority and no cookie access across loopback and normal hosts.
- To establish test sensitivity, temporarily removed only the duplicate guard
  from both kernel.js copies, then ran
  `node --test --test-name-pattern="^smoke: Site [AB] network rejects duplicate names after config filtering$" tests/smoke.test.mjs`
  → exit 1, `tests 12`, `pass 2`, `fail 10`, `skipped 0`; all eight duplicate
  subcases failed `Missing expected exception (Error)`, both distinct controls
  passed (two parent failures included in fail 10). Restored both guards before
  the successful candidate run above. No temporary mutation remains.
- `node --input-type=module -e "for (const site of ['site-a','site-b']) { for (const f of ['kernel.js','byok.js','ui.js']) { await import('./'+site+'/runtime/'+f); console.log('import ok '+site+'/runtime/'+f); } }"`
  → exit 0, six `import ok` lines. This checks module linking, including removal
  of the UI import; it does not boot a browser or run a model. No build script
  exists in package.json; this is a JavaScript repository, not a Go build.
- Node reported the pre-existing `MODULE_TYPELESS_PACKAGE_JSON` warning on the
  narrowed checks/imports. It was not suppressed by changing package configuration.
- `git diff --check` → exit 0, empty output for tracked changes. Task checks and
  the full project gate remain engine-owned; these checks do not certify browser
  behavior or public deployment.

Runtime SHA-256 captured after these checks (identical in both sites):

| File under each site's runtime/ | SHA-256 |
| --- | --- |
| kernel.js | `a89e949dd6c01d31e8de063aa15ce8fb625e1faede3ee8f27b94be2ddef7ac67` |
| byok.js | `7884823b767745c93c963572997dd9ab3ca572b1d5fcd4e3d7a164c3d2ae8c73` |
| ui.js | `14e4cb7cc6171648f410bd7f93fa211b60c760ba5d1b0f536a5960805c4470da` |

Test file SHA-256:
`bc26f1b2ee9498aaabe1577ae9c358f074c7e377e17949214fc441b815e07054`.
Use these hashes to identify the source-check snapshot when testing before a
candidate commit exists. Record new hashes/revision if any runtime changes later.

**Recheck order (user-owned browser state and key; competition credits only):**

1. Follow the safety hold **before fetching the patched code**. Stop old pages and
   servers so the old script cannot recreate the cookie. Delete the named cookie
   on every used loopback host without reading values, privately revoke the old
   key, and clear disposable test BYOK state. Record only completion booleans,
   hostnames and times; no values. Do not clear unrelated account/profile state.
2. Use a new `.theora/aw4-demo/run2/` directory, not run 1 copies. Record source
   revision plus SHA-256 of each served runtime kernel.js/byok.js/ui.js for A and
   B, artifact correspondence, actual commands, ports, browser/OS and UTC times.
   After copying, apply only each fixture's documented JSON changes; do not patch
   the runtime in the browser, intercept fetch, or mock the provider/consent.
   Confirm safe artifacts before entering a new competition key in A's panel.
3. **B05-R2 (no paid inference required for refusal):** repeat invalid JSON,
   empty tools and missing reference plus a valid control. On both sites test a
   valid front referencing worker with two identical worker declarations; also
   worker vs ` worker `, and worker vs `{alias}` with
   `commondefs.replacement_strings: {"alias":"worker"}` (and full-value
   replacement_values if used). Preserve the manifest's actual front name and all
   other valid fields. On each fresh normal page load require a visible loader
   refusal and duplicate-name error **before any model request**. Keep sanitized
   fetched definition, compile failure and request count; 429 is not a refusal.
   Then serve the same duplicate graph as B's exact spec_scout definition, with a
   valid A, approved consent and allowed origin: require remote_fetch failure,
   zero peer remote_call/agent/model starts (A's caller model may run). Correct
   name/unique-worker control must load; the normal B07 call below must execute.
4. **Panel/B01-R2:** with a fresh valid A, user enters key privately; save, reload,
   select/delete a disposable saved setup, save again and verify settings still
   work. Use the built-in Model field to switch from the default to the run 1
   second model if still listed (otherwise record another available ID). Observe
   requested and reported model, successful live reply, correct saved setup and
   per-tab priority. A new test port is now a different origin and must be set up
   independently; cross-port cookie propagation is intentionally gone. Confirm
   the named cookie remains absent after every save, model switch and reload,
   not just immediately after manual deletion.
5. **B07-R2:** repeat conflicting B router + normal consent/exact peer on both
   models. Observe A's own static server requests **as well as** B and the
   advertised sink throughout save/reload and the completed turn. Privately
   compare the active key in URLs, header values, bodies, prompts, action args,
   trace and errors; share only sanitized shapes/booleans, never key or Cookie /
   Authorization values. Require no key on A/B static requests and zero requests
   to advertised router; peer model still uses selected api.otari.ai router/model.
   Record full definition-fetch URLs, redirects (or explicitly none), header
   names, GET body lengths, status, actual CORS response header and public JSON
   response inspection. Record provider header/body inspection separately from
   successful authenticated inference; mark unavailable observations UNVERIFIED.
   Do not log raw request values to prove absence. Report any leak as FAIL and
   stop rather than masking it by later cleanup.
6. Return sanitized case records using the template below, including controls,
   exact served revision/hashes and missing observations. The implementer records
   results and decides affected-case rechecks from that evidence. Run 1 failures
   stay in the ledger. Only run 2 subcases supported by the received evidence below
   may be marked PASS; public HTTPS/CORS, judging access and unexercised limits
   remain separately unverified.

### Run 2 interim evidence — received 2026-11-16 (user input 51; historical)

The implementer read
`I:/project/agentic-web/.theora/aw4-demo/run2/evidence/R2-00-safety-hold.md`
(lines 1–15) and `R2-B05.md` (1–24). Operator/browser/OS match run 1. Execution
was again **2026-11-15 UTC**, not the receipt date. This is supplied observation,
not an implementer-driven browser session. No screenshot/trace export was reviewed.

| Subcase | Actual observation / evidence | Verdict / remaining work |
| --- | --- | --- |
| R2-00 cleanup | Old pages/server stopped 19:15; script-free blank cleanup page, no logging. 127.0.0.1 named cookie present→absent at 19:16:37 without reading its value; absent on later checked ports. localhost:8001 had no named cookie. Test BYOK/link local/session state cleared; unrelated origins untouched. | PARTIAL: old Otari key **not revoked**, new key not issued; user account action pending. localhost:8007 top navigation refused, :8019 not directly checked (neither was opened top-level in run 1); cookie is host-scoped. No claim of full safety completion. |
| B05-R2 top A | 19:17–19:19Z (reported keyless-block interval, `R2-B05.md:2`, not separate per-variant times); :9054 exact worker duplicates, :9055 worker vs space-padded name, :9056 {alias} replacement_strings→worker all visibly refused; exported loader error Duplicate agent name 'worker'.; 0 provider requests. | PASS for these three variants. |
| B05-R2 top A other failures/control | :9051 invalid JSON HOCON parse error 1:45; :9052 tools=[] / no front-man; :9053 missing_helper reference all refused, 0 provider requests. :9057 unique worker compiled and chat became available. | PASS for loader refusal/control; no live inference on the control. |
| B05-R2 top B | :9064 exact, :9065 trim, :9066 {alias} duplicates all visibly refused, same duplicate error, 0 provider requests; :9067 unique worker compiled. | PASS for three duplicate variants/control. No malformed/empty/missing-reference variants were recorded for top B. |
| B05-R2 peer | a9000-peerdup→b9002 fixture prepared, no caller model yet | UNVERIFIED, needs safe new key on A 127.0.0.1:9000 and normal consent. |
| Panel/B01-R2; B07-R2 | No keyed execution yet | UNVERIFIED: save/select/delete/reload/model switch, cookie non-regeneration with a key, A/B non-disclosure and caller router/model on both models still needed. |

**Timing provenance:** `R2-B05.md:2` reports **2026-11-15T19:17–19:19Z**
for the keyless B05 block as a whole, including the A/B duplicate variants and
controls; it does not supply separate per-variant diagnostic/completion times.
The top A row now uses that reported interval rather than the unsupported range
previously transcribed into this checklist. To cross-check the timing, the
implementer read `I:/project/agentic-web/.theora/aw4-demo/run2/requests.jsonl`
lines **1–40** during the documentation correction: `a9054` GET `/` (line 1)
and `/runtime/kernel.js` (line 7) are timestamped **2026-11-15T19:17:58Z**;
its `/review_desk.network.json` GET (line 34) is at **19:17:59Z**, another
GET of that definition (line 36) at **19:18:12Z**, and `a9055` GET `/`
(line 40) at **19:18:12Z**. These request timestamps fall within the reported
block interval; they are not precise timestamps of the thrown duplicate error.
No conflicting time was found in those inspected source fields. Individual
refusal/completion times not supplied there remain unspecified. Other case
records retain their own explicitly reported intervals; no new browser run,
paid call or independent aggregate request recount was performed for this fix.

Fixture source was the uncommitted demo-kit candidate atop `3e5040b`, not run 1's
old runtime. Reported served kernel/byok/ui SHA-256 values match the full table
above in every A/B run 2 copy; reported test hash matches too. Fixtures change
only network JSON, retaining each manifest's front name (`review_coordinator` on
A, `spec_scout` on B). Each has a fresh `127.0.0.1` origin under
`.theora/aw4-demo/run2/`; no key was present (valid controls show API key required).
The duplicate fixtures retain a valid front→worker reference and valid worker
instructions/tools so another missing-reference/front error cannot mask identity
refusal. Replacement_values was **not** exercised in the browser (Node coverage
only); do not count it as a browser PASS.

Server command was recorded as `python -I serve.py requests.jsonl <label>=<port>=<dir> …`
for the scratch CORS/no-store logging server, not as the exact expanded argv.
R2-B05 reports 405 server requests, no `otk_`, Cookie or Authorization. These are
operator-reported counts, not an independent recount. **Keyless** absence cannot
prove live-key non-disclosure or cookie non-regeneration after a keyed save.

The normal page shows only generic “Review Desk chat could not be loaded …” /
“Spec Scout could not be loaded …”. The specific duplicate-name error is from the
same exported boot() invoked on a detached mount in DevTools, not a page message.
No model/fetch/consent stubs were used. Distinguish visible generic refusal from
the diagnostic error; do not claim a new specific-error UI. Observed compile
refusal and loadable controls establish these loader subcases even without a key;
they do not establish the pending real peer/tool path. Original B05 FAIL remains
in the run 1 ledger, with run 2 top-loader success recorded separately here.

At this interim checkpoint the remaining keyed subcases were UNVERIFIED. The
subsequent records below establish their actual outcome; the historical pending
rows above are not the current verdict. The user supplied a new key privately for
that continuation, but at input 52 had **not** confirmed revocation of the old
one. Do not infer revocation from the new key or INDEX's cleanup label. The
prescribed safety hold was therefore not confirmed complete before the keyed
continuation. Input 54 later supplies user confirmation, not a retroactive
observation of when revocation occurred.

### Run 2 final local rechecks — received 2026-11-16 (user input 52)

The implementer read these sanitized Markdown records under
`I:/project/agentic-web/.theora/aw4-demo/run2/evidence/`:
`INDEX.md` (1–17), `R2-00-safety-hold.md` (1–15), `R2-B05.md` (1–35),
`R2-B01-panel.md` (1–15), `R2-B07.md` (1–24). These are user-supplied reports,
not screenshots or a live implementer observation. No raw HAR/provider request
capture or independent request-log recount was performed. The records report
**749** server requests across run 2, `otk_` presence **0**, Cookie header **0**,
advertised-router sink requests **0**. Counts describe only the instrumented
servers, not every browser/provider request.

Execution spans 2026-11-15 (keyless loads/cleanup) and **2026-11-16 UTC** (keyed
continuation). Operator, Chrome `156.0.8078.75`, Windows 11 x64 and scratch
CORS/no-store Python server match the interim record. The user entered a **new**
competition key only into A's panel on `http://127.0.0.1:9000/` at 00:01Z;
the operator did not type/read/record it. Competition-credit-only authorization
is unchanged; no personal spending or further key-bearing run is authorized here.
At input 52, the user's reply explicitly said old-key revocation remained
**unconfirmed**. `R2-00`'s NOT DONE and INDEX's cleanup “done” must not be read
as revocation. The run proceeded before this prescribed safety prerequisite was
confirmed; the later user confirmation below does not establish whether revocation
preceded the keyed continuation.

**Source correspondence:** served source is the uncommitted demo-kit worktree
candidate on base `3e5040b05f664bcf1b7f56d5584f01e364fc0fa4`, not a claimed
post-merge revision. Reported runtime hashes in every A/B fixture equal the full
kernel/byok/ui table above. On receipt of input 52, the implementer recomputed
SHA-256 from the current A/B runtime files and smoke test with Node crypto
(exit 0): all six runtime digests and the test digest equal that table. No runtime
or test code was changed after those observations; subsequent changes are ledger
updates. This connects the tested artifacts to the candidate but does not imply
that unrelated run 1 cases were rerun on the corrected runtime.

A fresh narrowed source regression on that same hash-identical candidate after
input 52 used
`node --test --test-name-pattern="^smoke: Site [AB] (network rejects duplicate names after config filtering|BYOK uses only current tab settings and saved profiles)$" tests/smoke.test.mjs`
→ exit 0, `tests 28`, `pass 28`, `fail 0`, `cancelled 0`, `skipped 0`,
`todo 0`, `duration_ms 85.0356`. The existing MODULE_TYPELESS_PACKAGE_JSON warning
remains. This checks only changed tests, not browser behavior; full gate and Task
checks remain engine-owned. No acceptance condition is replaced by this result.

#### B05-R2 — duplicate peer refused before peer execution: PASS

`R2-B05.md` 26–35, **00:05:08–00:05:28Z**. A at
`http://127.0.0.1:9000/` serves `a9000-peerdup`, valid except its reachable
binding/allowed origin `http://localhost:9002`; exact peer URL
`http://localhost:9002/spec_scout`. B `b9002` retains manifest name/front
`spec_scout`, serving the isolated duplicate graph `[spec_scout → worker,
worker, worker]`. Fresh page and cleared non-BYOK state. Prompt asks for §3.2
exact network matching and exact runtime errors; normal consent **Allow**.

```text
seq 5–6 A caller model_call ok alibaba/qwen3.8-flash
seq 7 00:05:13 tool s7 spec_scout start
seq 8 link target=http://localhost:9002/spec_scout
seq 10 00:05:24 remote_fetch s9<s7 end status=error
  error="Duplicate agent name 'worker'." peerOrigin=localhost:9002
seq 11 tool s7 end status=error (same error)
seq 12 tool_result: Error from tool 'spec_scout': Duplicate agent name 'worker'.
seq 47 run end ok
```

GET `http://localhost:9002/agent-manifest.json` 200 and
`http://localhost:9002/spec_scout.network.json` 200 establish that the exact bad
definition reached compilation. **0 peer remote_call, agent and model starts**;
A caller inference before/after the refusal is allowed. Visible answer quotes the
tool error; key in trace false, cookie absent. The unchanged unique-name B07 peer
below loaded and executed on both models as the live control. Combined with the
interim A/B exact/trim/`{alias}` duplicate refusals, this resolves the observed
runtime duplicate defect. Browser replacement_values remains UNVERIFIED (Node
coverage only); top B malformed/empty/missing-reference cases were not separately
recorded. The normal top-page diagnostic remains generic; do not claim that the
specific error text is newly rendered there.

#### Panel/B01-R2 — persistence, tab priority and two live models: PASS

`R2-B01-panel.md`, **00:01–00:04Z**. A `a9000-panel` on
`http://127.0.0.1:9000/` allows/binds `http://localhost:9001/spec_scout`;
router stays `https://api.otari.ai/api/v1`. This is a panel-focused recheck,
not a rerun of B01's full delegation/action story.

- Private user key entry → **Save and start** → reload: active key, default
  `alibaba/qwen3.8-flash`, origin-local profile “Otari” plus tab session settings.
- **Custom / unsaved**, setup name “Disposable R2”, second model
  `alibaba/qwen3-30b-a3b-instruct-2507` → **Save setup**: two profiles, disposable
  selected. Selecting each profile updates the form model; **Delete setup**
  removes only Disposable R2, selects remaining Otari. Save/reload works again.
- Default model's live one-sentence no-tools reply requested = reported
  `alibaba/qwen3.8-flash`, model_call ok, routerHost api.otari.ai.
- Tab 2 with initially empty session settings loads the saved flash profile, then
  switches/saves to the second model using the built-in panel. Reloaded tab 1
  **keeps its applied flash settings** despite the shared saved profile changing.
  Tab 2 live reply requests/reports the second model, ok, verifiedReal=true.
- Named cookie absent after every save/select/delete/switch/reload; panel uses the
  non-cookie storage hint. Active key in trace false. A's static server received
  183 requests from 00:01:39–00:04:05Z, `otk_`, Cookie and Authorization all 0.
  This tests non-regeneration after keyed saves, not merely manual deletion.

#### B07-R2 — A/B static-request isolation and caller router: PASS, scoped

`R2-B07.md`, **00:05:50–00:08:06Z**. A `a9000-b07` on
`http://127.0.0.1:9000/` allows/binds `http://localhost:9007/spec_scout`.
B `b9007` has unchanged unique-name network but advertises both base_url and
byok_router `http://localhost:9099/v1`, mock=false; the operator controls that
logging sink. Browser inspection of B's public manifest confirms this conflicting
router declaration and no credential. A userRouter is still hosted Otari.

Default run **00:06:08–00:07:13Z**, normal Allow: remote_fetch seq 9→10 ok,
remote_call s11 seq 11→295 ok; spec_scout agent seq 12; run end seq 500.
Caller / peer / caller model_call ends each report flash→flash, api.otari.ai, ok.
After panel switch + Save and start, second run **00:07:40–00:08:06Z** repeats
normal Allow, remote_fetch and remote_call succeed; all three calls request and
report `alibaba/qwen3-30b-a3b-instruct-2507` on api.otari.ai. **0** requests to
advertised localhost:9099 across the entire run 2 session.

Definition-fetch observations (operator report):

- Each run GET `http://localhost:9007/agent-manifest.json` 200,
  `http://localhost:9007/spec_scout.network.json` 200, `/links.json` 404. Trace
  fetchedUrls has the equivalent `/./spec_scout.network.json`. No redirects
  reported (direct static responses); GET body length 0. One additional manifest
  GET at 00:07:16Z is operator inspection, not runtime: **7 B requests total**.
- Header names: Accept, Accept-Encoding, Accept-Language, optional Cache-Control /
  Pragma, Connection, Host, Origin, Referer, Sec-Fetch-Dest/Mode/Site, User-Agent,
  sec-ch-ua*. **No Cookie or Authorization**; `otk_` in path/header values/body
  false on all seven. No credential values are retained.
- Command-line response inspection with A's Origin reports Content-type
  application/json and Access-Control-Allow-Origin `*` on both JSON 200s, and
  ACAO `*` on links 404. Successful browser cross-origin reads independently show
  local CORS usability; the command-line header observation is **not** a browser
  header capture or a public Cloudflare measurement. Manifest router fields were
  inspected; no full per-response network JSON body is transcribed in this record.
- A static server during B07 including save/reload: **73** requests, `otk_`,
  Cookie, Authorization all **0**. Named cookie absent after each save, switch and
  reload. In-page comparisons on both runs: active key in trace JSON, resource
  URLs, page URL and visible text all false.
- Resource timing reports catalog GET /models 200 and caller/peer/summary POST
  /chat/completions 200 on api.otari.ai; catalog is not inference. **Provider
  request headers/bodies were not captured**. Credential delivery to the selected
  router is inferred from authenticated success/keySource, not a direct header
  observation. Comprehensive prompt/action-argument/error inspection is not newly
  established by these negative trace/page checks. Keep unavailable fields
  UNVERIFIED rather than generalizing this scoped PASS into a universal claim.

### Current acceptance summary and remaining owners

**Historical AW4 snapshot:** these verdicts and open items describe the runs
recorded in §3–§4, before judge-ready fixes. For the current revision and required
release checks use [§6](#6-judge-ready-fixes-release-check). In particular, the
failure/tool-status and consent-policy behavior below has since been changed in
source; the old observations are retained, not asserted as current behavior.

- B01–B04, B06, B08–B09 retain the run 1 observations and limitations, not a new
  run 2 PASS on every case. B05's actual top/peer duplicate defects and B07's
  observed A-static cookie disclosure are corrected and rechecked above. Run 1
  FAIL records remain. Panel/model live replies were rerun on corrected files.
- B10 PASS covers **only the observed 24-agent-call cap**. Other limits, including
  in-flight deadline behavior, remain UNVERIFIED; no runtime runner/budget redesign
  or waiver is implied. Refusal status, global action exposure and consent/policy
  ordering remain as recorded in findings 3–5.
- **User safety action confirmed, input 54:** received on 2026-11-16 after
  **00:13Z**, the user states that the exposed run 1 Otari key was revoked in the
  account. **Supplement, input 55:** at **2026-11-16T00:16:40Z** the user said
  the key had been revoked “about 15 minutes ago,” giving an approximate
  revocation time of **2026-11-16T00:01Z**, based on user memory. The exact time
  is unknown, not account-verified. No key, dashboard screenshot, credential or
  raw storage was sent/reviewed, and no additional paid execution occurred.
  This is user confirmation, not implementer/dashboard verification. Do not use
  the receipt timestamp as the revocation timestamp; this rough estimate near
  the new-key entry time does not establish their precise ordering. Cookie
  cleanup and rechecks are independent evidence, not the basis for this
  account-action status.
- Direct provider request-header/body observations, complete per-response public
  definition-body inspection and any missing sentinel-header checks remain
  UNVERIFIED. Future capture is user-operated with private inspection/boolean-only
  reporting and competition credits only; do not silently replace them with Node
  results or claim them done.
- P01's public HTTPS/ACAO/404 follow-up is measured in §4 against revision
  298ce2b, with HTTP remeasurements recorded separately. P02 input 59 retains its
  failed answer and missing wire evidence. The separate input 61 run 2 now records
  pre-run artifact correspondence, public consent UI/Allow before contact, exact
  peer loading/execution, caller Otari inference, a completed cited answer and
  B-request wire isolation for all three captured GETs (scoped PASS). Allow-event
  observability and an unrelated request origin remain unresolved; quotation
  accuracy and broader provider/body/limit checks are not established. The entrant
  owns independent judging access, video and final submission, all still incomplete.
  Video remains a plan, not delivered footage. These bounded observations do not
  establish **submission readiness**.

### Record template for each subsequent case/control

Retain failed attempts and controls; append new revision/environment and evidence
rather than replacing run 1 with later successes:

```text
Case / control ID:
UTC time / operator / browser version / OS:
Source commit / served revision / disposable fixture diff or hash:
A base / B base / exact requested network / selected router and model (no key):
Preconditions actually established (fresh cache/consent, graph valid, trigger reached):
Actual user actions and prompt / fixture setup / invocation options:
Expected boundary behavior:
Observed UI and result (include visible refusal, not just trace status):
Sanitized trace excerpt (seq, wall, id, parent, kind, phase, relevant fields):
Browser requests (before/after decision, URL, redirects, method, sanitized headers,
  request body presence, status, response CORS headers, public response content):
Counts and absent prohibited calls, observed through completion:
Evidence attachment identifier or inline excerpt / capture time:
Verdict PASS | FAIL | UNVERIFIED / limitation and next action / owner:
```

## 4. Public deployment measurements and judging handoff

### P01 — credential-free public HTTP measurements: PASS

- Operator: implementer; environment: Windows x64 (`win32`), Node.js `v24.16.0`.
  Actual measurement interval: **2026-11-16T01:41:11.454Z–01:41:12.661Z**.
- Inspected checkout HEAD before measurement:
  `298ce2bee1001e7186e7f5325975c063729881d5` (`git rev-parse HEAD`, exit 0).
  `git status --short` was empty, exit 0. No fixture or production files changed.
  Later changes in this task affect only README/devpost/this ledger, not site assets.
- Site A: `https://almightie0214.github.io/agentic-web/` (GitHub Pages, publication
  root `site-a/`, GitHub Actions source). Site B: `https://spec-scout.pages.dev/`
  (Cloudflare Pages, root `site-b/`, no build command). Hosting settings were
  supplied by the Goal; the implementer did not change account/deployment settings
  or independently inspect deployment-job/build IDs. Artifact hashes below, not an
  inferred deployment timestamp or build ID, identify the measured content.
- **Prerequisite first:** GET A `links.json` and `agent-manifest.json`, compare
  complete response bytes to the checkout, and stop on a mismatch/non-200. Both
  matched. The link is `https://spec-scout.pages.dev/spec_scout`; the allowed origin
  is `["https://spec-scout.pages.dev"]` with closed policy. Only then measure the
  remaining A/B responses. No deployment wait was necessary in this measurement.
- All requests: GET, `credentials: 'omit'`, `redirect: 'manual'` with explicit
  `Origin: https://almightie0214.github.io`, no key, Cookie or Authorization,
  no request body. Node has no browser cookie session in this probe. Only public
  response bytes are hashed; only Content-Type, ACAO and Location headers are read
  into the evidence (no cookie/authentication response values). No inference or
  authenticated API request was made. Command-line Origin/ACAO is **not browser
  CORS enforcement** or evidence of browser key isolation.

Actual command: `node {tmp}/public-measure.mjs` → **exit 0**. `{tmp}` was the
implementation run's temporary directory, not a published path. The exact script
is retained below for reproduction; the temporary executable was removed afterward.
The following tables transcribe its output; each timestamp is when that response
body finished reading, not a deployment time.

A base = `https://almightie0214.github.io/agentic-web/`;
B base = `https://spec-scout.pages.dev/`. Resolve each path against its named base
(empty path = base itself). **Every requested URL was also the final URL**, with
one response hop, no 3xx and `Location: null`. ACAO was `*` on **all ten** responses.

| Base / path | UTC on 2026-11-16 | Status | Content-Type | Body bytes | Byte-equal to checkout |
| --- | --- | --- | --- | --- | --- |
| A / `links.json` | 01:41:11.719Z | 200 | application/json; charset=utf-8 | 129 | yes |
| A / `agent-manifest.json` | 01:41:11.917Z | 200 | application/json; charset=utf-8 | 676 | yes |
| A / (empty) | 01:41:12.098Z | 200 | text/html; charset=utf-8 | 6409 | yes, index.html |
| A / `review_desk.network.json` | 01:41:12.288Z | 200 | application/json; charset=utf-8 | 5882 | yes |
| B / (empty) | 01:41:12.369Z | 200 | text/html; charset=utf-8 | 2947 | yes, index.html |
| B / `agent-manifest.json` | 01:41:12.403Z | 200 | application/json | 567 | yes |
| B / `spec_scout.network.json` | 01:41:12.443Z | 200 | application/json | 10862 | yes |
| B / `links.json` | 01:41:12.596Z | 404 | text/html; charset=utf-8 | 286 | not a source JSON file |
| B / `review_desk.network.json` | 01:41:12.624Z | 404 | text/html; charset=utf-8 | 286 | not a source JSON file |
| B / `public-check-missing-298ce2b` | 01:41:12.661Z | 404 | text/html; charset=utf-8 | 286 | synthetic absent path |

SHA-256 (complete received bodies; each 200 hash also equals its local source hash):

| Response | SHA-256 |
| --- | --- |
| A links.json | `d9f554715787e5c7609030bbfdc8cc983a66737a52dd4ab6ebc800300a9666b2` |
| A agent-manifest.json | `24b112630e241f0e77ac6f3865242729e53a815eb0786c5bda6c28642b51eaad` |
| A index.html | `a9a2645c5f071e850cdc68bfe2a06fca1a27b920c1250feb9ed3fe49715512d1` |
| A review_desk.network.json | `258a9e2d2dea8d32ca08186283b7959cb81c6905782ed15aa8f217a36e009955` |
| B index.html | `56b99ec12da57506de55acac2ef3fd66ed9cc17e9bfc064eb9e8300bae0b8c9d` |
| B agent-manifest.json | `f2d71b66aa93aaba098fc651bc396bec4f33e09691da2617d1e2e4c62012df54` |
| B spec_scout.network.json | `06b974991ec895bcf14fe42b724092d030fdcce65899b0140d498b9ffc59d91f` |
| Each of the three B 404 responses | `da5d8407d9e184f4e7cc5e231feb6651c54bc404c7328de095a2e45ece08f5d4` |

The B missing paths return an actual 404 with a shared 286-byte HTML response,
not B's 2947-byte home page with 200. This directly rechecks the former Cloudflare
SPA fallback defect after `site-b/404.html` was added in 298ce2b. No claim is made
about every possible absent path or future availability.

<details>
<summary>Exact measurement script (Node.js, from repository root)</summary>

```js
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const A='https://almightie0214.github.io/agentic-web/';
const B='https://spec-scout.pages.dev/';
const hash=b=>createHash('sha256').update(b).digest('hex');
console.log(JSON.stringify({start:new Date().toISOString(),node:process.version,platform:process.platform,arch:process.arch,method:'GET',credentials:'omit',origin:new URL(A).origin}));
async function measure(base,path,local){
 const requested=new URL(path,base).href; let url=requested; const hops=[];
 for(let i=0;i<6;i++){
  let r; try {r=await fetch(url,{method:'GET',credentials:'omit',redirect:'manual',headers:{Origin:new URL(A).origin},signal:AbortSignal.timeout(30000)});}catch{throw new Error('Public GET failed (transport error; no external error text retained)');}
  const body=Buffer.from(await r.arrayBuffer());
  const h={url,status:r.status,contentType:r.headers.get('content-type'),acao:r.headers.get('access-control-allow-origin'),location:r.headers.get('location')}; hops.push(h);
  if(r.status>=300 && r.status<400 && h.location){url=new URL(h.location,url).href;continue;}
  let match=null; if(local){const b=await readFile(local);match=body.equals(b);console.log(JSON.stringify({local,sha256:hash(b)}));}
  console.log(JSON.stringify({utc:new Date().toISOString(),requested,hops,bytes:body.length,sha256:hash(body),local,byteEqual:match}));
  return {status:r.status,match};
 }
 throw new Error('Redirect limit exceeded');
}
for(const path of ['links.json','agent-manifest.json']){
 const r=await measure(A,path,'site-a/'+path);
 if(r.status!==200||!r.match)throw new Error('Deployed A prerequisite mismatch; stop measurements');
}
for(const [base,root,paths] of [[A,'site-a',['','review_desk.network.json']],[B,'site-b',['','agent-manifest.json','spec_scout.network.json','links.json','review_desk.network.json','public-check-missing-298ce2b']]]){
 for(const path of paths)await measure(base,path,path===''?root+'/index.html':(['links.json','review_desk.network.json','public-check-missing-298ce2b'].includes(path)&&base===B?null:root+'/'+path));
}
console.log(JSON.stringify({end:new Date().toISOString()}));
```

</details>

### P01 follow-up — fresh HTTP remeasurement after input 59

The implementer ran `node {tmp}/public-remeasure.mjs` → **exit 0** on
**2026-11-16T02:31:27.844Z–02:31:28.965Z**, Windows x64 / Node.js v24.16.0.
Before execution, `git rev-parse HEAD` returned
`298ce2bee1001e7186e7f5325975c063729881d5` and
`git diff --exit-code HEAD -- site-a site-b` exited 0 with empty output.
Only the three allowed documentation files were dirty (`git status --short`).
Thus the measured source assets are unchanged from that commit. This is a new
HTTP probe, not a repeat browser run or evidence of the earlier page's loaded bytes.

The script is the exact P01 script above except that `r.arrayBuffer()` is also
caught and replaced by the fixed error `Public body read failed (no external error
text retained)`. Same credential-free GET/Origin/manual redirect options, same
ordered URLs and A prerequisite comparison. It first rechecked A links/manifest
byte equality before contacting the remaining URLs. The temporary script was
removed after execution. Every response again had **ACAO `*`, one response hop,
no redirect and `Location: null`**; requested URLs equal final URLs. Each response's
Content-Type, byte count and SHA-256 exactly matches its P01 table entry above;
all seven 200 bodies again byte-match their local source files. Actual output:

| Base / path | UTC on 2026-11-16 (body read complete) | Status | Content-Type | Bytes | Byte-equal to source |
| --- | --- | --- | --- | --- | --- |
| A / links.json | 02:31:28.098Z | 200 | application/json; charset=utf-8 | 129 | yes |
| A / agent-manifest.json | 02:31:28.294Z | 200 | application/json; charset=utf-8 | 676 | yes |
| A / (empty) | 02:31:28.566Z | 200 | text/html; charset=utf-8 | 6409 | yes |
| A / review_desk.network.json | 02:31:28.743Z | 200 | application/json; charset=utf-8 | 5882 | yes |
| B / (empty) | 02:31:28.825Z | 200 | text/html; charset=utf-8 | 2947 | yes |
| B / agent-manifest.json | 02:31:28.846Z | 200 | application/json | 567 | yes |
| B / spec_scout.network.json | 02:31:28.878Z | 200 | application/json | 10862 | yes |
| B / links.json | 02:31:28.894Z | 404 | text/html; charset=utf-8 | 286 | n/a |
| B / review_desk.network.json | 02:31:28.929Z | 404 | text/html; charset=utf-8 | 286 | n/a |
| B / public-check-missing-298ce2b | 02:31:28.965Z | 404 | text/html; charset=utf-8 | 286 | n/a |

### P01 follow-up — implementer HTTP remeasurement after input 61

`node {tmp}/public-verify.mjs` → **exit 0**,
**2026-11-16T03:06:50.606Z–03:06:51.131Z**, Windows x64 / Node.js v24.16.0.
Before measurement `git rev-parse HEAD` returned
`298ce2bee1001e7186e7f5325975c063729881d5`; `git diff --exit-code HEAD -- site-a site-b`
exited 0 with empty output. Only the three allowed documentation files were dirty.
The probe uses the P01 script with the response-body fixed-error catch described
in the 02:31Z follow-up. It first checked A links/manifest bytes against source;
both matched before remaining requests. The temporary executable was removed.
No credential, browser session, provider API request or inference was used.

Every response again has **ACAO `*`, no redirect, one hop and `Location: null`**;
requested URL = final URL. Content-Type, bytes and complete body SHA-256 match
P01's tables exactly; all seven 200 bodies byte-equal checkout source. This fresh
HTTP evidence is separate from the operator's browser run and its pre-run check.

| Base / path (same bases as P01) | UTC on 2026-11-16 (body read complete) | Status | Content-Type | Bytes | Byte-equal to source |
| --- | --- | --- | --- | --- | --- |
| A / links.json | 03:06:50.667Z | 200 | application/json; charset=utf-8 | 129 | yes |
| A / agent-manifest.json | 03:06:50.676Z | 200 | application/json; charset=utf-8 | 676 | yes |
| A / (empty) | 03:06:50.684Z | 200 | text/html; charset=utf-8 | 6409 | yes |
| A / review_desk.network.json | 03:06:50.691Z | 200 | application/json; charset=utf-8 | 5882 | yes |
| B / (empty) | 03:06:50.753Z | 200 | text/html; charset=utf-8 | 2947 | yes |
| B / agent-manifest.json | 03:06:50.805Z | 200 | application/json | 567 | yes |
| B / spec_scout.network.json | 03:06:50.858Z | 200 | application/json | 10862 | yes |
| B / links.json | 03:06:50.918Z | 404 | text/html; charset=utf-8 | 286 | n/a |
| B / review_desk.network.json | 03:06:50.975Z | 404 | text/html; charset=utf-8 | 286 | n/a |
| B / public-check-missing-298ce2b | 03:06:51.131Z | 404 | text/html; charset=utf-8 | 286 | n/a |

### P02 — public-browser consent, exact peer execution and key isolation

**Current: run 2 public-browser flow and captured B-request isolation PASS, scoped**
(input 61, below). Independent judge access remains UNVERIFIED. The failed first
attempt is retained separately, not overwritten by the successful second attempt.

#### Public run 1 — input 59: answer FAIL; wire key isolation UNVERIFIED

Source: human answer **input 59**, received in this task, reporting
one public run on **2026-11-16 UTC**. The implementer read that sanitized report,
not a live browser session, screenshot, raw trace or request-header capture.
The user alone entered the key in A's built-in panel; the delegated Claude session
reports not reading/recording key, cookie or authentication values. Competition-
credit-only authorization remains in force; the report does not independently
establish a credit balance or billing record.

**Environment and provenance:** Claude desktop built-in browser, Chromium 156,
UA `Claude/5.11492.5 Chrome/156.0.8078.75`, reported **Windows 10.0 x64** (not the
Windows 11 environment reported for local runs). No DevTools. Evidence surfaces:
(a) `performance.getEntriesByType('resource')`, (b) page Developer execution log
and execution-graph text, (c) operator source reading of `site-a/runtime/`.
A/B URLs are the public URLs above, no disposable binding reported. Selected
router `https://api.otari.ai/api/v1`, model `alibaba/qwen3.8-flash`, badge
`real LLM (alibaba/qwen3.8-flash)`. The operator attributes the page's links/manifest
to **298ce2b**, but **did not recompare their hashes during this browser run**.
P01's earlier byte comparisons and the later remeasurement independently establish
public artifact correspondence at those HTTP times, not proof of every asset
loaded into this page or a fresh browser-run hash check.

Sanitized chronology (all UTC, 2026-11-16; span IDs belong only to this run):

| Time / stage | Supplied observation |
| --- | --- |
| 01:53:12.283 | Page load (`performance.timeOrigin`). |
| 01:53:50.368 | GET `https://api.otari.ai/api/v1/models` 200 (catalog, not inference). |
| 01:53:50.902–01:53:55.972 | POST to Otari `chat/completions` 200, `review_coordinator`. |
| First consent card; exact click time not supplied | “Contact spec_scout on your behalf? spec-scout.pages.dev · est. ~294 tokens”; request asks for MVP Profile 0.2 §3.2 exact network matching and source section/edition (reported text truncated). While pending, Resource Timing contained **0 B resource entries**. |
| After Allow: 01:54:18.372 | GET `https://spec-scout.pages.dev/agent-manifest.json` 200. |
| 01:54:18.449 | GET `https://spec-scout.pages.dev/spec_scout.network.json` 200. No other B resource entries reported through completion. **B links.json request not observed**, despite the operator's `_compile`/`_loadPublishedLinks` source reading; reason unknown. Do not infer a browser 404 from P01. |
| 01:54:18.635–01:54:36.094 | Otari `chat/completions` POST 200 for `spec_scout`; log says `AGENT spec_scout @ spec-scout.pages.dev`, `LLM alibaba/qwen3.8-flash via api.otari.ai · key: local BYOK (not shown)`, `REMOTE CALL Spec Scout @ spec-scout.pages.dev · via fetch-and-run-locally`. |
| Peer result; time not separately supplied | Instead of a §3.2 explanation, RESULT contained literal `<function=WebFetch>` / `<parameter=url>` markup with three external URLs. No successful WebFetch execution is established. |
| Retry consent; time not supplied | Coordinator asked to retry without tool-call syntax; second card estimated ~436 tokens. Operator chose **Decline** as an unplanned additional call; no subsequent B resource entries. |
| 01:55:03.969–01:55:18.589 | Last Otari `chat/completions` POST 200; final answer: “Peer contact could not be completed — so there is no Spec Scout answer to report.” §3.2 explanation, citations and requirements/observations distinction unavailable; no invented §3.2 explanation reported. |

Supplied execution-graph excerpt (not a raw trace export):

```text
s3 run -> s4 agent review_coordinator -> s5 model_call api.otari.ai ok
s4 -> s7 tool spec_scout ok -> s9 remote_fetch ok
                           -> s11 remote_call ok
                              -> s12 agent spec_scout ok
                                 -> s13 model_call api.otari.ai ok
s4 -> s120 model_call ok
s4 -> s122 tool spec_scout -> consent spec-scout.pages.dev declined
s4 -> s127 model_call ok
final run ok
2 agent spans, 4 model-call spans, 1 peer-fetch, 1 peer-call,
1 explicit consent-decision events
```

**Verdicts and limitations:**

- Consent card before contact, Allow followed by manifest/definition reads,
  `remote_call spec_scout` and peer model use of caller Otari were observed on the
  supplied surfaces. Successful cross-origin peer loading supports browser CORS
  usability for those two reads, **not** a browser response-header capture or a
  complete network inventory. The 0/2 B counts are Resource Timing counts, not a
  wire capture. Fresh consent/cache state was not independently verified.
- **Answer FAIL:** the peer returned tool-call markup despite its tools-free
  informational role. A runtime `ok` span did not mean a usable answer. The final
  coordinator refusal accurately withheld an answer but did not fulfill the task.
  This is an observed model/output defect candidate, not a diagnosed runtime cause.
- **Allow event absent:** the operator saw `0 explicit consent-decision events`
  after Allow, and only Decline counted in the final `1`; the execution log had a
  CONSENT line only for Decline. Record this as an observability limitation/candidate,
  not proof that Allow was skipped: UI/request ordering shows approval. Local B02
  already noted absence of a dedicated allowed-consent note. Root cause and whether
  a new regression exists are not established; no runtime correction made here.
- **Wire key isolation UNVERIFIED:** no request headers/bodies were captured.
  The operator's source observation is consistent with the implementer reading
  `site-a/runtime/remote.js`: `fetchManifest` and `fetchText` call `fetch(url)`
  without custom headers/options (browser defaults use same-origin credentials).
  This code expectation is **not observation** of key/Cookie/Authorization absence
  on B requests, nor of redirect behavior. Do not promote it to PASS.
- B links.json request/404, browser Content-Type/ACAO/redirect inspection, full
  response-body inspection and browser-run artifact hash correspondence remain
  **UNVERIFIED**. P01's HTTP data do not replace these browser fields. Independent
  judge access, video and final submission remain incomplete.
- Additional user-operated capture with private Network inspection was requested
  after input 59. If that environment is unavailable, a user decision is required;
  the implementer has not waived required evidence or expanded scope to runtime fixes.

#### Follow-up procedure issued after input 59 (historical; run 2 result below)

Run on the public A/B URLs without disposable binding overrides or runtime stubs.
Use a browser with private request-header/body inspection; the previous Resource
Timing-only environment cannot complete wire key-isolation evidence.

1. Record browser/version/OS, UTC times, source/artifact correspondence, selected
   caller router/model, and fresh peer consent state. Disable cache and preserve
   the Network log. Use only Otari competition credits; stop if insufficient.
2. The user enters the key privately in A's **AI model settings** panel, not in
   a reply or evidence. Ask the B02 §3.2 question. Record destination/purpose in
   the normal consent UI, zero B requests before approval, and choose **Allow**
   (not Always allow); record its time and the first B request afterward.
3. Observe B manifest → exact `spec_scout.network.json` → `links.json` 404;
   record actual browser URLs/redirects/status/Content-Type/ACAO, successful
   cross-origin reads, `remote_fetch`, `remote_call.network=spec_scout`, descendant
   spec_scout agent/model span, caller router/model and completed answer/limitation.
4. Privately inspect **all B requests** for the active key in URL, header values
   and body; record only absence/presence booleans and header names. Require no
   Cookie or Authorization header. Never share key/storage/raw HAR/auth values.
   Report any disclosure as FAIL and stop for user-owned key revocation.
5. Supply sanitized ordering (seq/parent/ID/times) and Network observations for
   this actual public run. Separate directly observed provider routing from
   inference based only on metadata or a successful response. Do not claim
   independent judge access, a video or final submission from this operator run.

#### Public run 2 — input 61: public flow and captured B-request isolation PASS, scoped

**Provenance:** human answer **input 61** supplies the user/delegated operator's
2026-11-16 public run. The implementer read the sanitized CDP record
`I:/project/agentic-web/.theora/aw36-public/run2-cdp.json`, lines **1–186**:
browser/consent (1–18), execution graph/answer excerpt (19–20), all three B
requests (21–154), Otari counts (155–173), other origins and action log (174–186).
Essential observations are transcribed here so independent review does not depend
on access to that local path. No live browser session, screenshot, raw HAR,
credential, storage export or provider request body was reviewed by the implementer.
The user alone entered the key in the new window's **AI model settings** panel;
the operator reports not reading the key input or storage. Only Otari competition
credits were used; no account balance/billing evidence was reviewed.

**Environment:** Microsoft Edge `157.0.4341.60` (Chromium 157), windowed, Windows
11 x64 (operator-reported OS; UA uses Windows NT 10.0). Fresh temporary profile,
deleted after execution. CDP `Network.enable` plus `setCacheDisabled(true)`;
`Network.requestWillBeSent` for page-sent headers, `requestWillBeSentExtraInfo`
for actual wire header names (including possible Cookie), and `responseReceived`
for responses. This is a wire-capable capture, unlike run 1 Resource Timing.
Public A/B URLs above, no disposable binding override reported. Panel-selected
router `https://api.otari.ai/api/v1`, model `alibaba/qwen3.8-flash`.

**Pre-run revision check:** input 61 reports credential-free GETs just before
**03:00Z** (individual times not supplied): public A `links.json`,
`agent-manifest.json` and `review_desk.network.json` byte-equal main
`24395e4238994a5f76f5cd630d1aa17de4412896`. Reported SHA-256 prefixes
`d9f554715787e5c7…`, `24b112630e241f0e…`, `258a9e2d2dea8d32…` match the full P01
hashes above. This prerequisite comparison is operator-reported, not in the CDP
JSON and not a hash of every asset loaded by the browser. On receipt the
implementer ran:

```text
git diff --exit-code 298ce2bee1001e7186e7f5325975c063729881d5 24395e4238994a5f76f5cd630d1aa17de4412896 -- site-a/links.json site-a/agent-manifest.json site-a/review_desk.network.json site-a/runtime site-b
exit 0; empty output
```

Thus the three A peer artifacts, caller runtime and B publication files are
unchanged between that reported main revision and this task's original base
`298ce2bee1001e7186e7f5325975c063729881d5`. A broader
`git diff --exit-code` over all `site-a site-b` exited **1**, showing only
`site-a/converter.js` BOM-decoding changes: the whole publication trees are **not**
claimed identical. This task does not change or revalidate converter behavior.

Sanitized chronology (UTC 2026-11-16; IDs belong only to this run):

| Time / stage | Observed result / evidence source |
| --- | --- |
| 03:01:09.760 | Navigated to public A; waiting for private user panel setup (CDP record action log). |
| 03:02:08.179 | Badge `LLM configured — awaiting verification` after user saved key. |
| 03:02:08.184 | Sent: “Ask the linked Spec Scout to explain MVP Profile 0.2 §3.2 exact network matching; cite its source and distinguish requirements from observed evidence.” |
| 03:02:14.215 consent field / .216 action log | One consent card: “Contact spec_scout on your behalf? spec-scout.pages.dev · est. ~310 tokens”; request asks for §3.2 exact network matching and cited source/edition (recorded card text truncated). **0 B requests** both when shown and just before Allow. These are two record timestamps, not an inferred click time. |
| 03:02:15.732 | **Allow** clicked, not Always allow; no second consent card reported. |
| 03:02:15.733 | First B GET: `https://spec-scout.pages.dev/agent-manifest.json`, 200, `application/json`, ACAO `*`. |
| 03:02:15.834 | GET `https://spec-scout.pages.dev/spec_scout.network.json`, 200, `application/json`, ACAO `*`. |
| 03:02:15.985 | GET `https://spec-scout.pages.dev/links.json`, **404**, `text/html; charset=utf-8`, ACAO `*`. This missing-file request is directly captured in run 2, not inferred from HTTP probes. |
| 03:03:37.312 | Run finished with a completed answer citing §3.2; no retry/second consent. |

**All three B requests:** type Fetch, protocol h2, GET, `hops: []` (no redirects),
`failed: null`, `hasBody: false`, `authorization: false`, `cookie: false`,
`otk_anywhere: false`. No other B requests reported. The operator's key check
records absence of the Otari `otk_` marker in URL, header values and body; no secret
value is retained. Wire header names on each were exactly:

```text
:authority :method :path :scheme accept accept-encoding accept-language
cache-control origin pragma priority referer sec-ch-ua sec-ch-ua-mobile
sec-ch-ua-platform sec-fetch-dest sec-fetch-mode sec-fetch-site user-agent
```

Page-sent header names were `referer`, `sec-ch-ua`, `sec-ch-ua-mobile`,
`sec-ch-ua-platform`, `user-agent`. Cache-Control/Pragma reflect CDP cache disabling.
The Cookie/Authorization check uses wire headers, not only page-sent headers.
This establishes non-transmission on the **three captured B requests**, not on
all origins, all possible credentials, future runs or uninspected provider bodies.

Supplied execution graph, independently present in the sanitized CDP record:

```text
s3 run ok -> s4 agent review_coordinator ok -> s5 model_call api.otari.ai ok
s4 -> s7 tool spec_scout ok -> s9 remote_fetch spec_scout ok
                           -> s11 remote_call spec_scout ok
                              -> s12 agent spec_scout ok
                                 -> s13 model_call api.otari.ai ok
s4 -> s228 model_call api.otari.ai ok
2 agent spans, 3 model-call spans, 1 peer-fetch, 1 peer-call,
0 explicit consent-decision events
```

All three graph model calls report non-mock `alibaba/qwen3.8-flash`. The network
record contains **10 Otari requests**: two GET `/api/v1/models` 200, three POST
`/api/v1/chat/completions` 200, and five OPTIONS preflights 200; model host list
contains only `api.otari.ai`. This correlates caller/peer/caller spans with the
caller router rather than a B-side inference endpoint. Provider header/body values
were not inspected here; `authorizationOnAll: false` in the aggregate includes
preflights and is not proof of missing/present authentication on any individual POST.

**Answer PASS (completion/citation structure, not certified accuracy):** the
answer names Cognizant AI Lab, *Minimum Viable Specification for a Worldwide
Agentic Web*, MVP Profile 0.2, 6 November 2026,
`docs/worldwide_agentic_web_mvp_spec.md`, linking commit
`63a956cf4653f610b1c238c70946f4d7647d17a8`. It cites §3.2 labels
`exact-network-resolution` and `peer-url`, quotes “If no exact match exists, it
MUST fail rather than select another published network.” as a requirement, and
separately marks runtime implementation, live deployment and conformance evidence
as not provided. The CDP answer excerpt is truncated; input 61 supplies the
completion verdict. Neither the operator nor implementer checked quotation
accuracy against the specification during this execution. This is not a runtime
conformance verdict.

**Retained limitations / follow-up candidates:**

- Allow still produces **0 explicit consent-decision events**. UI and first-request
  ordering demonstrate approval in this run; the graph alone does not. Run 1
  counted only Decline. Root cause is not established and no runtime fix is made.
- Run 1's literal `<function=WebFetch>` output was **not reproduced** in run 2.
  Do not claim a source correction or diagnosed cause; model variability is only
  a hypothesis. Run 1 remains FAIL for its answer.
- Input 61 reports an unrelated page-target request to `https://lc.getunicorn.org`
  and no matching string in site-a/site-b. The CDP record lists that origin and
  `null`, but contains no request details for them. Request initiator/cause and
  its credential properties are **UNVERIFIED**; this observation neither proves
  B leakage nor supports universal key non-disclosure. Further diagnosis requires
  the user/operator and separate scope if code/environment changes are needed.
- Complete definition-response-body inspection, provider request headers/bodies,
  other local runtime subcases and unexercised limits are not newly completed.
  Independent judge access, video and final submission remain outside this Goal
  and incomplete. No third paid run is requested to replace these stated limits.

### Remaining handoff

- [x] Public A/B artifact responses measured and tied to source as above; production
  binding and allowed origin deployed together. No deployment configuration changed.
- [x] First user-operated public-browser report received and transcribed (input 59):
  consent/peer/caller-router observations, answer failure and missing fields retained.
- [x] P02 run 2 user-operated Edge/CDP capture received and transcribed (input 61):
  pre-run artifact correspondence, consent before B contact, exact peer execution,
  caller router, completed answer and all-three-B-GET wire key/Cookie/Authorization
  absence observed. Run 1 failure retained; quotation accuracy not verified.
- [ ] Diagnose Allow-event observability, run 1's non-reproduced tool-call markup
  and the unrelated request origin if pursued. Root causes remain unconfirmed;
  runtime or environment changes require separate scope/approval, not this document task.
- [ ] Any further required B01–B08/public runtime observations not covered by P02
  remain with the browser verifier and entrant; local cases are not silently rerun.
- [ ] A separate judging visitor can reach A and inspect public artifacts without
  publisher account access. Live inference requires the visitor's supported
  provider/key and any applicable costs; never distribute a shared key. Owner: entrant.
- [ ] Video and final submission remain incomplete, outside this Goal. Owner: entrant.
- [ ] Mark submission-ready only after required runtime evidence and independent
  judging access are accepted. HTTP measurements alone do not establish readiness.

## AW5 converter dogfooding

This section is the **historical pre-fix AW5 record**. References to “current”
source/hashes below mean the snapshot examined for that original task, not main
`ff3c493a569b22bd7037f3265ca215cc03d85fdb`. The later Goal supersedes input 60's
no-fix/no-paid-recheck disposition with converter output rules and a required new
live-router Theora observation; see [§6](#6-judge-ready-fixes-release-check).
Neither the old quality FAIL nor its old source correspondence is erased.

### Current verdict and provenance

**Load/delegation PASS; model-output presentation FAIL; no prompt/runtime fix
requested after diagnosis.**
Inputs 57 and 58, received on 2026-11-16, report a user-authorized Claude desktop
built-in-browser run, not merely permission or a planned checklist. The user alone
entered the key in the page's existing AI model settings field; the operator did
not type, read or record its value. This AW5 approval supersedes the earlier
user-executes-only preparation handoff for these runs, not the competition-credit
restriction or private key-entry requirement. No personal billing is authorized.

The implementer read the supplied sanitized text record
`I:/project/agentic-web/.theora/aw5-demo/EVIDENCE.md`, initial lines 1–17 and later
appended diagnostics at 18–41 (user input 60). SHA-256 of the complete 41-line
record is `189b7004d0f079574ff244d47090da47b876d609e301e3597c1246ece110aea6`.
The essential observations are transcribed below so review does not depend on that
local path. The implementer has no browser-control tool and did not observe the
live session, screenshots, provider response bodies or full traces. These are
operator-reported browser results, not implementer-run inference. AW4 B01/run 1
and run 2 used different networks and are not substitutes for these AW5 runs.

Reported source revision: `298ce2bee1001e7186e7f5325975c063729881d5` (main).
Original implementation preparation base: `27c293226bb67d7efae2429610060a79c352f324` (CLI dependency
`1ec1422467b79765d468b5d0491e604858cd68bf`, web dependency at that HEAD).
The implementer ran:

```sh
git diff 27c293226bb67d7efae2429610060a79c352f324 298ce2bee1001e7186e7f5325975c063729881d5 -- site-a/converter site-a/runtime site-a/converter.js site-a/site.js tools/theora2hocon
```

Exit 0, empty output: those conversion/runtime/page paths are identical between
the reported source and this Task base. A broader diff of `site-a` and
`tools/theora2hocon` exited 0 and showed only the original Review Desk peer binding
and allowed origin changing from `https://spec-scout.invalid` to
`https://spec-scout.pages.dev`. The generated manifest replaces those declarations
with `allowed_peers: []` and closed policy, and its links stub has no binding.
This is source correspondence checked during preparation, not a new browser run.
The current checkout also uses the `pages.dev` peer binding and paired allowed
origin. Public HTTP and the separate public-browser flow are now measured in §4;
this AW5 loopback record does not establish them.
The served JSON hashes below were independently recomputed and match the report.
The later supplied runtime hashes also match the six corresponding served/current
source files (see diagnostics below); browser-fetched response-byte correspondence
remains UNVERIFIED. An additional in-memory reconstruction using the
current `parseRoles`, `emitNetwork` and `emitManifest`, default options and the
public Theora sample produced byte-identical JSON for all three files (Node
`assert.deepEqual` against the served files; exit 0). This ties the served data to
the current converter without modifying any fixture, runtime or operating state;
it is not a browser-fetched response comparison.

### Node integration evidence (static only)

Added `CVT-VERIFY-001` e2e cases read the three actual CLI-generated files for
both Theora and Markdown fixtures, with coordinator and non-first specialist as
front. They call AW2 `validateNetwork` and stage byte-identical generated data in
both publication roots of a disposable checker-compatible tree under
`.theora/tmp/converter-e2e/`. The unchanged AW4 checker, AW2 rules and runtime
module dependencies, public sample and Site B `_headers` are copied there; no
operational publication file is replaced. The real AW4 CLI subprocess audits that
tree, not the checkout's original Review Desk/Spec Scout networks. Each workspace
is removed after use. No browser loader, `Engine`, DOM/storage simulation or model
is executed in Node.

The tests compare the AW4 shared-rule report with direct AW2 output, assert CLI
exit 0/PASS for generated bundles, and retain `runtime.safety` and
`runtime.composition` as UNVERIFIED. Disposable negative controls corrupt a front
reference, local tool edge, links network key, or remove the generated definition;
they require the relevant rule failure and CLI exit 1/FAIL. The shared-rule
mutations must also fail direct AW2 validation.

Fresh static check on the uncommitted candidate atop the base above (Windows
x64, Node.js `v24.16.0`):

```sh
node --test --test-name-pattern=^CVT-VERIFY-001: tests/converter/e2e.test.mjs
```

Exit 0, actual output (individual case durations omitted):

```text
✔ CVT-VERIFY-001: theora front coordinator generated files pass AW2 and the AW4 CLI
✔ CVT-VERIFY-001: theora front specialist generated files pass AW2 and the AW4 CLI
✔ CVT-VERIFY-001: markdown front coordinator generated files pass AW2 and the AW4 CLI
✔ CVT-VERIFY-001: markdown front specialist generated files pass AW2 and the AW4 CLI
▶ CVT-VERIFY-001: corrupted generated bundles fail shared rules and CLI publication checks
  ✔ missing front agent
  ✔ dangling local call
  ✔ stale links network key
  ✔ missing generated definition
✔ CVT-VERIFY-001: corrupted generated bundles fail shared rules and CLI publication checks
ℹ tests 9
ℹ suites 0
ℹ pass 9
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1193.6767
```

After the documentation lane joined, the same narrowed command exited 0 again:
`tests 9`, `pass 9`, `fail 0`, `skipped 0`, `duration_ms 1246.641`, with unchanged
test/input code. `node --check tests/converter/e2e.test.mjs` exited 0 with empty
output. Node also emitted the existing `MODULE_TYPELESS_PACKAGE_JSON` warning for
`site-a/runtime/kernel.js`; no package configuration was changed to suppress it.
There is no build step or Go package in this dependency-free JavaScript repository.

After this run, Node crypto SHA-256 identified the tested e2e file as
`b03eca56baf6ed92a16d4ce86c523f7d572a801a01c35dcb2808ddd903916a4d`.
The CLI and pure converter modules remain unchanged from the base; their hashes:

| Input code | SHA-256 |
| --- | --- |
| tools/theora2hocon/theora2hocon.mjs | `1192ba89a5d57f65157dacff71c2f4c15e059dc89b2106916084522384740306` |
| site-a/converter/parse-roles.mjs | `73e66ea829f5c93a00aab59a1379961dc93e805222790cafafb2c7133ac3ea35` |
| site-a/converter/emit-network.mjs | `b56d669b62e19917382554e4dd44c4963fa5737f35fd1a23c59c107a5280b819` |
| site-a/converter/emit-manifest.mjs | `50c854d66357257e625b8d049ac53d3fd1872864e2fbe6bf2d9500d5b6c250c4` |

The full `node --test tests/converter/e2e.test.mjs` and
`node tools/check-conformance.mjs` Task checks are engine-owned; this narrowed
execution does not claim those commands ran. None of these static assertions
complete the browser requirement or prove public HTTPS/CORS/judge access.

### Reproduction procedure (planned example, not the observed run)

Use a fresh disposable directory and the current corrected vendored runtime;
follow §1's cookie/key safety hold before contacting a previously used test host.
Record source commit, dirty diff and actual commands. The example uses the public
Claude agents sample (museum-visit coordinator and specialist), not private role
instructions or the historical AW4 action fixture. All commands below are planned
steps, not observed results. Run from the repository root, using already-installed
Python/Node only; if unavailable, stop and ask rather than install software.

1. Prepare a new copy (copytree refuses an existing destination). If this run path
   exists, archive it and choose a new run directory consistently; do not overwrite
   an earlier record or mutate the checkout's real publication roots:

   ```sh
   python -c "import shutil; from pathlib import Path; d=Path('.theora/aw5-demo/run1'); d.mkdir(parents=True,exist_ok=True); shutil.copytree('site-a',d/'site-a')"
   node tools/theora2hocon/theora2hocon.mjs site-a/converter/samples/claude-agents .theora/aw5-demo/run1/site-a --layout markdown --front coordinator
   python -m http.server 8015 --bind 127.0.0.1 --directory .theora/aw5-demo/run1/site-a
   ```

   The converter replaces only the copy's manifest/network/links. The old
   `review_desk.network.json` may remain in the copy, but is not referenced by the
   generated manifest. Do not modify `runtime/`, source instructions, source tool
   lists or generated JSON to manufacture a successful delegation.
2. Record SHA-256 of the three served generated JSON files and runtime files, and
   verify served response bodies match them. In particular the manifest must
   select `converted_team`, `front_man: coordinator` and
   `./converted_team.network.json`, with an empty peer allowlist and link stub.
   Use a real browser with cache disabled and Network logging preserved. Open
   `http://127.0.0.1:8015/`. Observe normal runtime compilation and chat mounting
   from these fetched artifacts; record URLs/status and compile/run trace, not
   just a Review Desk pasted-data report. Record browser exact version, OS, UTC,
   router/model and operator. A leftover original network loading is a failed setup.
3. Before inference, optionally open `/converter.html`, load **Claude agents team**,
   inspect AW2 findings and all three downloads, and compare their bytes with the
   CLI result for the same sample/options. **Open artifacts in Review Desk** only
   reviews data and consumes the same-origin handoff; it does not execute the
   imported network. This UI path alone cannot satisfy the runtime check. The
   normal page runtime in this disposable copy uses the generated served manifest.
4. Privately check authorized credits, then configure the built-in **AI model
   settings** panel with hosted Otari and the sample's default model
   `alibaba/qwen3.8-flash`; user enters a key only there, never in a task reply or
   artifact. After **Save and start**/reload, ask:

   > Ask specialist to suggest a calm 45-minute museum route for two adults who
   > need seated rest breaks. The only supplied facts are three small galleries
   > and a quiet foyer with seating; opening hours and other facilities are unknown.
   > Summarize the specialist's advice and distinguish facts from assumptions.

5. In Developer view and the execution graph require a real coordinator agent,
   a `specialist` tool call and descendant specialist agent/model span, a returned
   recommendation, and coordinator completion in that same run. Retain sanitized
   IDs/parents/seq/times and actual model-call status. Inspect the inquiry argument
   and actual reply; the common inquiry schema is not a source harness. Record
   the final visible response and whether it used the specialist's advice without
   pretending to check live facilities, book tickets, run shell/git/gates or use
   source `Read, Bash` tools. A model claiming delegation without descendant
   spans, compile-only success, authentication failure or a static report is not PASS.
6. Generated local role calls require no peer. Record actual request destinations;
   do not weaken peer policy, grant remembered consent or bypass runtime controls.
   Privately inspect for key disclosure, then return only reviewed booleans and
   redacted excerpts under §1's evidence rules. No raw HAR, storage or key-panel
   screenshot. Stop on a leak or unauthorized cost. Preserve failed attempts.

### AW5 browser result record — two observed local runs

The procedure above is a museum/Claude sample example, **not** the actual run.
`EVIDENCE.md:3–7` instead reports the following execution:

- Date: 2026-11-16. Later diagnostics supply event-wall-clock UTC ranges:
  `s3` **01:45:05Z–01:46:50Z**, `s300` **01:50:06Z–01:52:03Z**.
  OS: Windows 11. Browser: Claude desktop built-in browser; exact version not
  captured. Runner: **manual**, top front man `coordinator` (`EVIDENCE.md:20–21`).
- Copies: `.theora/aw5-demo/site-a` for conversion, `.theora/aw5-demo/served`
  for the converted team; loopback `http.server` on `127.0.0.1:9100` / `9101`.
  Exact server command lines and per-request status/headers were not supplied.
- Input: **Theora role team**, `site-a/converter/samples/theora/layout.json`,
  reconstructed as a project directory and converted by `tools/theora2hocon`.
  The browser conversion was checked with AW2: static rules PASS, runtime items
  UNVERIFIED. Exact CLI flags and cross-adapter byte comparison were not recorded.
- The implementer read the served manifest (lines 1–23), network (1–56) and
  links (1–6). They select `converted_team`, `coordinator`,
  `./converted_team.network.json`, coordinator → specialist and no specialist
  outgoing calls. Workshop coordinator/specialist text is preserved, not the
  museum sample text. Model: `alibaba/qwen3.8-flash`; router: `api.otari.ai`,
  non-mock; empty peer allowlist, closed policy and empty link binding map.
- The user approved the browser execution and privately entered the key through
  the existing panel. The records contain no key value. No credit balance or
  comprehensive key-isolation observation is supplied; do not infer either.

Served artifact hashes (`EVIDENCE.md:6`), independently recomputed from the served
files using Node crypto SHA-256 with matching output:

| Artifact | SHA-256 |
| --- | --- |
| agent-manifest.json | `dd2a8f558dc9f9bc211e78e319774f0d1346d89c241edda5e274be499512cad9` |
| converted_team.network.json | `86c5a9c9e1d93775c44878aa74d1e10a3da84be046470353ef3ce3e60010fdf0` |
| links.json | `1615f9e8c559c80bf8c767aea061ffe57024cac0f33686fa5cafdb75b172604d` |

| Observation | Run s3 (`EVIDENCE.md:8–11`) | Run s300 (`EVIDENCE.md:13–17`) |
| --- | --- | --- |
| Converted-team runtime load | PASS, operator reports the served team loaded and ran | Same page/team, run completed |
| Delegation | PASS: coordinator model call ok → specialist tool call ok → specialist model call ok → final coordinator model call ok | PASS again, same reported path |
| Runtime graph counts | 2 agent spans, 3 model-call spans; 0 peer-fetch, 0 peer-call, 0 explicit consent-decision events | 2 agent spans, 3 model-call spans; peer/consent counts not separately provided |
| Visible answer presentation | FAIL: draft/meta text such as "Wait… we need cleanup…", garbled lines and unrelated outline content | FAIL again: "Need final clean…", "Wait…", repeated drafts and garbled lines before a readable final outline |

Run 2 used the same page, message and existing key entry, not a fresh engine or
independent model comparison. The later diagnostics below supply message, span IDs
and content/result comparisons; full parent/seq details and provider response
bodies were not supplied. The two runs establish reported loading/delegation,
**not** acceptable model-output quality. CORS, consent flow, limit enforcement,
private-context isolation, cycle interruption, public HTTPS and judge access remain
UNVERIFIED; zero peer events do not exercise these protections.

### Answer-quality diagnostics — model output, not converter/runtime corruption

The initial record left attribution open and the user requested cause-level
correction. Request 38 therefore asked for boundary comparisons rather than changing
prompts or stripping draft phrases. Input 60 supplied the still-open tab's
`window.__nsweb.trace` and `engine.history` diagnostics (`EVIDENCE.md:19–41`),
without reading keys, request headers or storage and without new inference.
The diagnostic read time is only reported as `2026-11-16T02:1xZ`, not an exact
minute; the run times above come from event wall clocks instead.

Actual message in both runs (`EVIDENCE.md:24`):

> Help me plan a beginner repair workshop with a safety-focused session outline.

The model wrote the `inquiry` arguments. Reported prefixes (`EVIDENCE.md:25`,
ellipses are in the source, not full recovered arguments):

- Run 1: "Create a beginner-friendly repair workshop outline focused on safety first. ..."
- Run 2: "I need a safety-focused session outline for a beginner-friendly community repair workshop. ..."

The supplied model-call table (`EVIDENCE.md:27–35`); all calls finished ok,
`alibaba/qwen3.8-flash` via `api.otari.ai`:

| Span | Role | Finish reason | contentChars | Completion / reasoning tokens |
| --- | --- | --- | --- | --- |
| s5 | coordinator first | tool_calls | 0 | 252 / 157 |
| s9 | specialist | stop | 1753 | 872 / 489 |
| s134 | coordinator final | stop | 2477 | 3071 / 2542 |
| s302 | coordinator first | tool_calls | 0 | 200 / 107 |
| s306 | specialist | stop | 2968 | 1645 / 1002 |
| s507 | coordinator final | stop | 6580 | 2920 / 1362 |

The operator found "Need final clean…", "Wait…" and "Let's final." **inside the
streamed content** of `s134`/`s507`. Their content lengths equal the coordinator
`agent_result` and displayed-history lengths (2477 and 6580). The operator reports
coordinator result and final display as equal. Specialist `agent_result` spans
`s7`/`s304` (1753/2968 characters) contain no draft markers, but already end with
degenerate mixed-language tokens: "…sampleパ young clear." and
"…nóiqueludo ammonia azidr  Unicode alone spellchecker…". The tool's
`resultPreview` is only a 240-character prefix of the specialist JSON
`{"cruse":1,"text":…}`, not its full result (`EVIDENCE.md:37–40`).

These comparisons locate the observed defect in **model output**: specialist
text degeneration and coordinator drafting in content, passed through rather than
introduced by the converter/runtime. Source inspection agrees with the boundary
report: the served workshop instructions are preserved; neither has those draft
phrases. The manual `llm.js` path reads `delta.content`, not `reasoning_content`;
`runner.js` returns the final no-tool model content. This does **not** establish
why the model generated poor text or prove runtime correctness in general. The
provider reported reasoning-token usage, but provider response bodies and
`reasoning_content` were not captured (the tab's network log was empty).
Another model and the same prompt outside this runtime were not tested.

Served runtime hashes from `EVIDENCE.md:22`. The implementer recomputed SHA-256
for each served file and the corresponding current `site-a/runtime/` file: all
six equal the reported value (exit 0); no runtime was modified.

| Runtime file | Served and current SHA-256 |
| --- | --- |
| engine.js | `48f30e80ba724f807eb745f8e2dd5a630f9aa518184307981fe5cf5863bcd5ac` |
| llm.js | `c5d4023570f44b62fc913ff772c7c2c2ee47241ada450ffbef27da7f94dcbc5e` |
| kernel.js | `a89e949dd6c01d31e8de063aa15ce8fb625e1faede3ee8f27b94be2ddef7ac67` |
| runner.js | `57d9d91e1c05ae4078ed7b361ff4c2481e0e1a78ad02d2007464b7f9b0e08f78` |
| byok.js | `7884823b767745c93c963572997dd9ab3ca572b1d5fcd4e3d7a164c3d2ae8c73` |
| ui.js | `14e4cb7cc6171648f410bd7f93fa211b60c760ba5d1b0f536a5960805c4470da` |

**User disposition (input 60, 2026-11-16):** the earlier quality-fix instruction
was withdrawn after the model-output diagnosis. The user directed retaining sample
prompts and runtime, recording load/delegation PASS and the quality observation,
and finishing this Task without another paid run. No prompt/runtime patch or
quality repair is claimed. The required converted-bundle load/delegation has been
observed; model-output quality remains FAIL, and public acceptance and the other
unexercised protections remain separate open items.

## 5. Focused video plan (not recorded)

Use one English-language story, not a tour of settings or every attack fixture:

1. **Problem:** a portable agent network with a missing manifest front agent.
2. **Inspect and correct:** show the deterministic rule/path/hint, correct the
   public JSON and revalidate without hiding warnings or unverified rows.
3. **Delegate and act:** show coordinator → reviewer → `website_validate_network`
   and its real receipt. Choose/switch the model only with the built-in panel;
   pause recording before key entry and never show key storage or headers.
4. **Consent and peer:** ask the linked Spec Scout about the relevant clause;
   show the destination/purpose, Allow decision, exact named B network and answer.
5. **Evidence:** show sanitized trace/Network ordering and the corresponding ledger
   verdicts, distinguishing static inspection, observed browser behavior, and any
   still-unverified public acceptance items. Link the full safety-case records
   rather than claiming the video proves cases it did not exercise.

Do not invent success footage or call the project ready from local recheck PASS.
Run 1 failures remain visible; run 2's supported corrections and the subsequent
user confirmation of old-key revocation do not resolve unobserved fields/limits
or public acceptance. No separate evidence JSON download or Node vendor-loader
run is needed.

## 6. Judge-ready fixes release check

### Revision, scope and acceptance boundary

- Initial R01/R02/R06 measurement snapshot (before main's documentation-only
  ownership change): `ff3c493a569b22bd7037f3265ca215cc03d85fdb`.
  At that measurement, `git rev-parse HEAD` and `git rev-parse main` each returned
  that value, exit 0.
  `git status --short` was empty before measurements. After the browser check,
  `git diff --exit-code main -- site-a site-b tools/browser-check.mjs tools/theora2hocon`
  returned exit 0 with empty output. Only documentation is being changed here.
- Integrated dependencies: converter output rules `495d04a6d5f488be9887900d36a2a80ef3ba1638`,
  page CSP `b29ed15d5d57981df2be3e9b9f98b5707f297ace`, runtime fail-closed/deadlines/
  consent/boot diagnostics `ff3c493a569b22bd7037f3265ca215cc03d85fdb`.
- The current source has one runner; retired LangChain, MCP, toolbox/REST, coded
  tools and cross-origin action discovery/bridge are not supported. Local
  `website_validate_network`, action review and receipts remain. Agent/dispatch
  failures throw; `executeToolCalls` is the error-to-tool-result boundary, while
  visitor decline stays a normal refusal. Absolute call scopes inherit the earliest
  parent/composition/self deadline. Consent is policy-first and recorded for each
  decision. These are source contracts, not claims that old browser runs retested them.
- The converter now appends front/specialist output rules and describes the selected
  Theora or Markdown layout in metadata. Output rules instruct the model; they do
  not guarantee clean output. The three script-bearing pages declare restrictive
  CSP; browser enforcement results are separated below from source inspection.

### R01 — public bytes and repository visibility

Operator: implementer, Windows x64, Node.js `v24.16.0`, **2026-11-16 UTC**.
No key, Cookie, Authorization, inference request or browser session was used.
Every fetch used `credentials: 'omit'`, manual redirects, a 30-second timeout and
`Cache-Control: no-cache`. The initial tree comparison also sent
`Origin: https://almightie0214.github.io`. These are HTTP observations, not browser
CORS or credential-isolation evidence.

The initial command `node {tmp}/release-public.mjs` exited **1**, from
**05:51:18.612Z–05:51:30.516Z**. It enumerated changed site paths with
`git diff --name-status 24395e4238994a5f76f5cd630d1aa17de4412896 HEAD -- site-a site-b`
and added A links/manifest/network and B manifest/network. It read every complete
response body, compared extant files using `Buffer.equals`, and printed source and
response SHA-256. Deleted files were required to return 404. Of **67 paths**,
**50 returned 200 with equal bytes**, **16 retired modules returned 404**, and
**B `/index.html` returned 308, Location `/`**, which failed that strict first probe.
No different HTML body or deployment lag was found; the first probe did not follow
redirects and is not reported as exit 0.

A separate canonical-root probe (`node --input-type=module -e`, using `readFile`,
`fetch` and Node crypto) then exited **0**. Its complete selected output is:

```json
{"utc":"2026-11-16T05:51:40.921Z","url":"https://almightie0214.github.io/agentic-web/","file":"site-a/index.html","status":200,"location":null,"acao":"*","bytes":6705,"sha256":"9f8882c660049b841ad86ec50e549d69aa057e66b6282fa8486081490e689f9b","byteEqual":true}
{"utc":"2026-11-16T05:51:41.372Z","url":"https://spec-scout.pages.dev/","file":"site-b/index.html","status":200,"location":null,"acao":"*","bytes":3243,"sha256":"6b3b08856b7dabc34368be588139e048599dcfe6dcb4752a8c64ff36d2a978a2","byteEqual":true}
{"utc":"2026-11-16T05:51:41.649Z","repository":"https://github.com/almightie0214/agentic-web","status":200,"visibility":"public","private":false,"license":"Apache-2.0"}
```

The third row is a credential-free `GET https://api.github.com/repos/almightie0214/agentic-web`
with `Accept: application/vnd.github+json`. It verifies **PUBLIC, Apache-2.0**,
not community sharing activity, adoption or independent judge inference access.
Sharing activity remains unrecorded.

**Public correspondence verdict: PASS for the changed extant files at their
canonical URLs**, plus 404 for all 16 removed modules; retain the `/index.html`
canonical redirect as observed, not a byte comparison at that redirect URL.
Every initial response had ACAO `*`; no other redirect/Location was observed.
A base is `https://almightie0214.github.io/agentic-web/`, B base is
`https://spec-scout.pages.dev/`. The following complete-body hashes identify the
changed assets (all extant entries byte-equal main):

| Path | SHA-256 / HTTP result |
| --- | --- |
| A index.html (also canonical `/`) | `9f8882c660049b841ad86ec50e549d69aa057e66b6282fa8486081490e689f9b` |
| B canonical `/` (index.html source) | `6b3b08856b7dabc34368be588139e048599dcfe6dcb4752a8c64ff36d2a978a2` |
| A converter.html | `2031f88828560103675c9f368bf72cfaab4b02f345b6c345c7f8e992d1de15c5` |
| A converter.js | `b0f8f0efe97725a54d1fddf619d25ae64d4992369283de972d608ba8b07bde17` |
| A converter/describe-layout.mjs | `f0b6641b89051fe017206edd340dff373c96270352c88c666cd16ba2d73e2282` |
| A converter/emit-manifest.mjs | `74be04023e9ec218f3ce2ae36817112d3954cb7705538c064765280e1ee9552f` |
| A converter/emit-network.mjs | `89d9bb74c8370334cb17303faa09e4b9cea0f3c68f26112a779717e285c50a62` |
| A converter/parse-roles.mjs | `f650f4cd0b6e2e65973bd4e65d59c96da5e35a1a0f96fe490f82730dd8e2f98b` |
| A site.js | `ffad51e13144d52cf856b288c4936ec8ccde7e2d879f19db42e0797a83cca0e9` |
| B site.js | `0be534d11199275dab0c9bd3f3a36b64e2d66820d589bba8bf21313e622cc302` |
| A links.json | `d9f554715787e5c7609030bbfdc8cc983a66737a52dd4ab6ebc800300a9666b2` |
| A agent-manifest.json | `24b112630e241f0e77ac6f3865242729e53a815eb0786c5bda6c28642b51eaad` |
| A review_desk.network.json | `258a9e2d2dea8d32ca08186283b7959cb81c6905782ed15aa8f217a36e009955` |
| B agent-manifest.json | `f2d71b66aa93aaba098fc651bc396bec4f33e09691da2617d1e2e4c62012df54` |
| B spec_scout.network.json | `06b974991ec895bcf14fe42b724092d030fdcce65899b0140d498b9ffc59d91f` |

For every runtime path below, **both A and B** were fetched and byte-compared;
matching the two copies locally alone was not used as deployment evidence:

| Path under each runtime/ | SHA-256 (both public responses = both source files) |
| --- | --- |
| README.md | `5eb25801dc524b125f6847d2cd7ffeddfd06ef1cafa821f0b4b4191571b104b7` |
| action-transport.js | `4bf447619b74168611532638432694dfc2091cc3aea4c95283db4dc4bf5d0589` |
| actions.js | `e201f895d8b7b41c8118d4415d406b4344dfe2c811844400ddc2bf4bfba32939` |
| byok.js | `ee3af6ed411cd1fb637fd6e0061acee29875533726476b5e46135a5f30348524` |
| cruse.js | `c65564845d11bca4e235e2ea120250ee3467a7b4d99b6ab1ff5cdcde9a8643f3` |
| engine.js | `26861c9c9477d737c6410bef03cdba319af8eed7585f1f881c0333d3e57d1091` |
| index.js | `cf60377c49326cf78e635e47818728c29fa16035f1cc13db35bc55448fb53350` |
| kernel.js | `085c6eebc5089f45c35bbee0ec762bab96612df2e67a0dc7318a1da1e3350649` |
| llm.js | `f39dc779bba3a2b6b828463b72d9d9ff25253a05f7df3eaed3fc22e10b3f7655` |
| model.js | `f6be155d3f98c8dba8cb16938ca297b6cec40daffc3a8282e1d15e7071f36a57` |
| remote.js | `dda1491ea0572654dc6f9f63a55b5fe130b0b851a093dbb4c2aa786c68f2626d` |
| runner.js | `34fa05c39103d7a71b13c83fa007187188bece4b2a616f315a91b1051d16a833` |
| scope.js | `42544b2be74d15e4176584e545b73671d7f43e17cb981bea1b0af8d60a9d425b` |
| trace.js | `005d7afe0e24ac1eb2bc19da2aa5c319480eaea644d196c76eaf8c49cd19b983` |
| turn-control.js | `71097d9ef1b4918e0bbd5df338e488563a68932056f13b6d06da5e9b187f4e9e` |
| turn-status.js | `f29d1698540ecd201e81746ce5e22f59bfca0cca1355cd2d8ef72a5002f0699a` |
| ui.js | `d715c5a0c62bde75c87e41a0c9800bc37cc17f9757dcb4e083fc7a7578944428` |
| web-crypto.js | `d3dedc6a1c2de44cdc03feffa8dc06ae1e2e26426146023f87f5cfed7d35717b` |

Removed modules returned **404 on both hosts**: `action-bridge.js`,
`discovered-actions.js`, `form-actions.js`, `generated/agent-runner.bundle.js`,
`langchain-runner.mjs`, `mcp.js`, `sandbox-worker.js`, `sandbox.js`, all relative to
`runtime/`. A returned a 9379-byte GitHub 404 body; B returned its 286-byte 404 body.
This is a point-in-time check, not a continuing availability guarantee.

### R02 — main-tree headless Edge browser check: PASS (mock router only)

Actual command: `node tools/browser-check.mjs` → **exit 0** on the unchanged main
site/tool tree above, Windows x64 / Node.js `v24.16.0`, Edge
`157.0.4341.60`, CDP protocol `1.3`, fresh temporary profile. The report calls the
revision `working-tree`; the before/after Git evidence above binds it to main.
Tool SHA-256: `0deb6edfd1c067d0879d382cfa558b04af5c311ce3f31f897e507ef4df049b16`.
The report has no overall start/end timestamp; its three probe Log timestamps
correspond to **2026-11-16T05:51:51.302Z**, **05:51:51.982Z**, and **05:51:52.187Z**
(milliseconds rounded down), not the full run interval.

Served A `http://127.0.0.1:57267/` and B `http://127.0.0.1:57260/` with the
candidate's real runtime/UI. Only served manifest router/allowed origins and A
links were localized; no source file was edited. A loopback OpenAI-compatible
**mock router**, not Otari or the credential-holding development router, produced
deterministic replies; no real key, paid inference or external network was used.
The script removed its temporary profile/download workspace after execution.

Essential report output (the per-file digests agree with R01 where shared):

```text
status: PASS
browser.product: Edg/157.0.4341.60
Site A flows: boot/render; key-free sample validation; self URL audit;
  BYOK apply/reload; local website action receipt;
  Allow before peer manifest/definition fetch; peer reply and final chat render
Site A converter flows:
  claude: conversion/static validation, 3 completed byte-identical downloads
  theora: conversion/static validation, 3 completed byte-identical downloads
Site B flows: boot/render
modelRequests: 6
peerFetches: /agent-manifest.json, /spec_scout.network.json, /links.json
blockedExternal: []
protocolErrors: []
unexpectedViolations: 0
```

Each of A, converter and B recorded **2 expected enforced CSP violations** only:
`script-src-elem` / blocked `inline`, and `script-src` / blocked `eval`, sourced
from that origin's `/__csp-probe.js`. Inline execution did not run; eval threw
`EvalError`. CDP Audits recorded `kInlineViolation` and `kEvalViolation`, Log
recorded the inline block, and each page had `exceptions: []`. Six expected probe
violations total are **not** normal-flow violations. A's validation action returned
a succeeded receipt; peer fetch followed Allow, and a real peer Session consumed
the mock-router reply. This does not verify public HTTPS, Firefox, live model
quality, the new consent/trust counts or the broken-manifest diagnostic screen.
`node tools/check-conformance.mjs` is an engine-owned Task check, not claimed run
by this implementer here; the full gate is also engine-owned.

### R06 — broken-network boot diagnostics in a real browser: PASS

Actual command: `node {tmp}/boot-browser-check.mjs` → **exit 0**, Node.js
`v24.16.0`, Windows x64, fresh headless Edge `157.0.4341.60` / CDP `1.3`.
Recorded flow interval: **2026-11-16T05:55:21.247Z–05:55:21.940Z** (after browser
startup). A served at `http://127.0.0.1:64898/`, B at
`http://127.0.0.1:64897/`. Main source assets were not edited.

This one-off browser script reused the main `tools/browser-check.mjs` static
servers/CDP setup, with `root = process.cwd()`, and replaced the normal flow with
four boot-failure cases. In served network responses only, it kept the original
front agent, replaced its tools with `[name]`, and set the tools array to:

```js
const worker = { name, instructions: 'Return a short answer.', tools: [] };
config.tools = [front, worker, structuredClone(worker)];
```

For the first pair of pages `name = 'worker'`; for the second pair
`name = 'url_secret_probe'` and navigation used `/?key=url_secret_probe`.
This is a **dummy URL-secret marker**, not a credential. Both pages used their
unchanged manifest and actual loader; duplicate definitions reached compilation.
No runtime, boot function, error function, fetch API or model was stubbed.
The script waited for `#site-status.dataset.state === 'error'`, inspected rendered
`textContent`, `role`, `#agent-app.hidden`, location and CSP events, and asserted:

```text
A duplicate: Review Desk chat could not be loaded. Serve this site over HTTP or HTTPS,
  check that its runtime, agent-manifest.json, and network definition are available
  and valid, and reload. Key-free checks and URL audits remain available above.
  Loader error: Duplicate agent name 'worker'.
B duplicate: Spec Scout could not be loaded. Serve this site over HTTP or HTTPS,
  check that its runtime, agent-manifest.json, and network definition are available
  and valid, and reload. Loader error: Duplicate agent name 'worker'.
A/B dummy URL-secret cases: same site-specific fixed guidance;
  Loader error: Duplicate agent name '[redacted]'.
All four: role=alert; agent-app.hidden=true; CSP violations=[]
Dummy URL-secret cases: marker absent from status text and current location
modelRequests=0; peerFetches=[]; blockedExternal=[]; protocolErrors=[]; status=PASS
```

The report's `candidateFiles['tools/browser-check.mjs']` is actually the **temporary
script** digest `8dbf29b46ffacd98e4f4f058bcedf1dfe5db12b04ab1b95e68f73bcc7222f045`,
not the original tool hash in R02. Its network-file digests likewise identify the
served invalid fixtures, not main network bytes. Site HTML/JS and runtime digests
match R01/R02. Temporary scripts/profile/download workspace were removed after use.
This verifies duplicate-loader diagnostics and URL-secret redaction on both pages
in Edge, not every malformed-manifest variant or a Firefox diagnostic check.

### R03–R05 — initial pending protocol (superseded by execution updates below)

This was the initial request for operator-supplied evidence. Input 62 withdrew
that ownership requirement: the implementer now executes the remaining rows.
Input 63 further blocks final acceptance on `deadline-config` landing/deployment.
The mandatory R03–R05 rows cannot be completed from historical
observations, source inspection, mock replies, R01, R02 or R06. The local R06
result is listed separately to avoid confusing it with the pending public runs:

| Case | Required observation | Current verdict / owner |
| --- | --- | --- |
| R03 Edge public A/B | Fresh temporary profile + CDP; A boot, key-free sample check and conversion; A/B normal-flow CSP violation counts; Spec Scout question → consent → Allow → consent event and trust count ≥1 → B definition fetch → normal peer reply; all B requests free of sentinel/Cookie/Authorization; lc.getunicorn.org reproduction and CDP initiator | FAIL / blocked — pre-deadline-config flow timed out; partial observations below; implementer reruns after deployment |
| R04 Firefox public A/B | Current Firefox, fresh profile + WebDriver BiDi; same public flows, CSP counts, consent/trust counts, B request inspection; lc.getunicorn.org reproduction and available BiDi attribution | UNVERIFIED live flow — implementer observed key-free subset below; final run waits for deadline-config deployment |
| R05 Theora loopback | CLI-convert Theora sample and execute once with real development router at 127.0.0.1:8601 (A), :8602 (B); record final answer, whether draft/meta sentences remain, selected model, trace and generated/served hashes | UNVERIFIED — implementer runs after deadline-config landing |
| R06 broken manifest/network | Real local browser: duplicate-network loader failure plus dummy URL-secret variant on both pages | PASS — implementer-run Edge check above; no live inference |

For R03–R05 the implementer reuses the existing `.theora/tools/aw-dev-router.mjs`
listener, or starts it if port 8640 is free. Do not open or copy the user's private
key file into evidence.
The browser settings receive **only** `http://127.0.0.1:8640/api/v1` and dummy
`otk_sentinel_dev`. The real keys stay outside the browser. The router handles
Otari limit/authentication failover; this is development verification, not a product
backend. Do not publish keys, cookies, raw HAR, storage or Authorization values.
Use competition credits only; stop on unavailable access rather than changing
accounts or enabling billing. Record exact browser/OS versions, UTC times,
revision and file hashes, steps, final text, trace IDs/parents/seq, request order
and sanitized presence/absence booleans. Unknown request attribution may stay
UNVERIFIED, but the capture/reproduction attempt itself must be recorded.

**Open acceptance:** current-source fixes do not erase the historical WebFetch,
zero-consent-event or draft/meta-output failures. Their public/live-model
revalidation remains pending above; no measured resolution is asserted yet.
Independent judge inference access remains an entrant-owned open item; video,
screenshots and final Devpost submission are outside this Goal. Required empty
rows block release-check PASS; they are not deferred to post-landing observation.

### Historical execution update — inputs 62/63, pre-deadline-config (not release PASS)

Input 62 replaces the old operator-evidence requirement: the implementer performs
Edge/CDP and Firefox/BiDi checks itself, using installed browsers and disposable
profiles. Main `d42c15757383c39add72aed3cb829ffd82e43b91` records the same user decision.
Input 63 then reports a live normal-flow timeout and directs final acceptance to
wait for the new `deadline-config` Task to land and deploy. These observations are
**failure/environment records**, not acceptance evidence for that future revision.
No runtime/policy/timeout values were changed in this documentation Task.

#### Supplied Edge live record — timeout, consent event present

Source: user input 63 and sanitized operator-session files, read by the implementer:

| Local source (not a public download) | SHA-256 |
| --- | --- |
| `.theora/judge-ready/edge-public.json` | `548e05d9c892b6bca4546ecf2966410586ce389d1c0c4e0e1056e6a1350b9c23` |
| `.theora/judge-ready/edge-public-r2.json` | `bd9dcd0e21573bd19c7f00e7f20d76d70412281717c3fb1b3ec65b4c4708557d` |

Deployment/source: `ff3c493`; Windows; Edge `157.0.4341.60`, CDP `1.3`, fresh profile,
cache disabled. The first record's log spans **06:19:46.723Z–06:25:17.599Z** on
2026-11-16 (not an overall process interval). Loopback Local Network Access checks
blocked the panel's model-list request; no consent card or inference ran. The log
says “Allow clicked” despite `consentShown:false`, so that line is **not** evidence
of an actual decision. A/B boot and valid sample were observed separately.

The second record uses **`--disable-extensions --disable-features=LocalNetworkAccessChecks`**.
Disabling that check is a disposable-profile **development loopback-router measure**,
not ordinary judge configuration, a site fix or a CSP relaxation. Its log records:

```text
2026-11-16T06:26:14.275Z A boot true, keyless sample true, csp []
2026-11-16T06:26:15.836Z question sent
2026-11-16T06:26:22.459Z Allow clicked; B requests before Allow: 0
2026-11-16T06:27:46.895Z turn ended true; run s3: error
Visible answer: ⚠️ Agent execution deadline exceeded (2026-11-16T06:27:46.379Z).
consentEvents: [{decision: "allow", source: "prompt_allow", peerOrigin: "spec-scout.pages.dev"}]
trust: 1 explicit consent-decision events (Allow once: 1; other sources: 0)
A before/after chat, converter, B CSP arrays: []
router chat POSTs: 3, HTTP 200, sentinel only in browser Authorization
```

The three A→B fetch rows are manifest **200** (`06:26:22.458Z`), definition **200**
(`06:26:22.527Z`), and links **404** (`06:26:22.578Z`, also `net::ERR_ABORTED`). All
record ACAO `*`, no redirects, no body, no Cookie/Authorization/sentinel. The first
request's timestamp precedes the script's post-click log by 1 ms; do not infer that
it preceded the actual click. The explicit before-Allow count is zero. The later
direct B visit and its static requests are separate from these peer fetches.

Input 63 reports the peer model took about 71 seconds (`06:26:24Z–06:27:35Z`), then
the coordinator's final model call was aborted at the composition deadline. Those
model timings are **user-reported**, not fields in these two JSON files. The fixed
90-second query deadline is enforced, but this live flow did not deliver its normal
answer. **R03 normal-answer requirement: FAIL; final acceptance blocked on
`deadline-config` and a new deployment/run.** HTTP 200 on a streamed model request
is not proof of a completed agent or a successful answer.

#### Implementer-run local main checks

All commands below ran on Windows x64 / Node `v24.16.0`, with main site/tool bytes
unchanged from `ff3c493` (the only new main commit `d42c157` changes documents).
`git diff main -- site-a site-b tools` returned empty output, exit 0 before checks.

- `node I:/project/agentic-web/tools/browser-check.mjs` → **exit 0**, Edge
  `157.0.4341.60` / CDP `1.3`. Actual main tool, A `127.0.0.1:62230`, B `:62229`;
  mock router only. Tool SHA-256 remains
  `0deb6edfd1c067d0879d382cfa558b04af5c311ce3f31f897e507ef4df049b16`.
  Raw output: `status:PASS`, `modelRequests:6`, `peerFetches:[/agent-manifest.json,
  /spec_scout.network.json,/links.json]`, `blockedExternal:[]`, `protocolErrors:[]`,
  `unexpectedViolations:0`. All three pages blocked inline and eval probes (two
  expected enforced violations each), no page exceptions. Both converter formats
  produced three completed byte-identical downloads. Probe Log times are
  **06:27:19.764Z, 06:27:20.512Z, 06:27:20.698Z** on 2026-11-16 (not full run times).
- `node {tmp}/boot-main.mjs` → **exit 0**, Edge same version. This one-off derivative
  of the main browser tool served actual main HTML/JS/runtime, replacing network
  responses only with duplicate workers (same fixture construction as R06).
  Flow interval **2026-11-16T06:34:22.212Z–06:34:22.910Z**; A `:58174`, B `:58173`.
  Both pages rendered fixed guidance plus `Loader error: Duplicate agent name
  'worker'.`; dummy `?key=url_secret_probe` variants rendered `'[redacted]'` and
  removed the marker from location. All four hid chat, had zero CSP violations;
  `modelRequests:0`, `peerFetches:[]`, `blockedExternal:[]`, `protocolErrors:[]`.
  No source files were mutated. Fresh profiles/workspaces were removed.

These checks do not replace live public or Theora acceptance. The static
conformance Task check and whole project gate remain engine-owned, not newly
claimed executions here.

#### Implementer-run public browser subset, no inference

Temporary script `live-check.mjs` launched each installed browser headless with a
new temporary profile and drove page controls through CDP or BiDi. It waited for
`document.readyState === 'complete'`, actual mounted chat and visible static status.
`KEYFREE=1` skipped settings/key entry/chat entirely. Both corrected invocations
used a Node launcher with `env:{...process.env,KEYFREE:'1'}` and
`spawnSync(process.execPath,[process.env.TEMP+'/live-check.mjs',browser],{stdio:'inherit',env})`.
Both exited **0**; profiles were deleted. Scripts did not replace public responses.

| Browser / interval (UTC, 2026-11-16) | Observed subset |
| --- | --- |
| Firefox **160.0**, build `20261104181552`, BiDi, `06:33:51.644Z–06:33:54.881Z` | Public A boot/render, valid sample passed; converter Claude **first click** passed, then Theora passed, each exposing all three download links; public B boot/render; CSP event arrays A/converter/B all empty |
| Edge **157.0.4341.60**, CDP `1.3`, `06:35:04.761Z–06:35:06.954Z` | Same subset; Claude first click passed, Theora passed, three links each; A/converter/B CSP arrays all empty; extension loading disabled |

The actual status on both converters was `Static checks passed; warnings may
remain. Inspect all artifacts. Runtime behavior is unverified.` The supplied
Claude first-click timeout **did not reproduce** after complete load; no cause is
established and no product fix is claimed. These public subset runs inspected
links, not downloaded file contents. Main-tree R02's download byte check is separate.

These historical subset reports were written under the earlier run's temporary
directory, which has since been removed. The hashes below are historical provenance,
not a claim that those original JSON files are still available. The mandatory
post-deployment observations use the recovered durable evidence described at the
end of §6, not these key-free subsets. Original report names:
`report-firefox-1794810835212.json` SHA-256
`28132263f79a355f713496b7ec1f08a523ccefb69b9b4483e3243ef8de7cfaf9` and
`report-edge-1794810907007.json` SHA-256
`494c99c630197b6a8afcc0d474b7f00c4ecbfd13af3c443e2b47c52af6879111`.
Required observations are transcribed here so access to temporary assets is not
needed to interpret the result. No live peer/sentinel isolation conclusion follows
from key-free B boot requests.

Earlier implementer attempts are not suppressed: `node {tmp}/live-check.mjs edge`
exited **1** twice (`06:28:40.667Z–06:30:21.672Z`,
`06:30:45.943Z–06:32:26.875Z`): A boot/sample succeeded, then loopback access was
blocked and consent timed out. The second attempt's disposable CDP
`local-network-access` permission did not remove the block; no security flag was
used in those attempts. An initial Firefox key-free attempt exited **1**
(`06:33:32.825Z–06:33:34.685Z`) due to the check script's top-level `await` expression,
not the page. Moving evaluation into an async function produced the successful
BiDi subset above. These three failures do not establish product regressions.

#### `lc.getunicorn.org` attribution and environment boundary

Both implementer subset runs reproduced one `?type=base-script&request-id=…` GET
and `/l` POST per public page (A, converter, B), with zero CSP event counts. Edge
CDP attributes the GET to the document parser (A/converter zero-based line 8,
B line 54); the POST stack starts in `V` in that injected base script. Firefox BiDi
reports `initiator.type:other`, without an initiating stack in this capture.

Input 63 identifies the local source: **Unicorn Pro** (`C:\Program Files\Unicorn
Soft\Unicorn Pro`, `UnicornProService`, local ad-blocking/HTTPS filtering) inserts
scripts into browser responses even with Edge extensions disabled. The user also
reports zero such references in curl-fetched deployed HTML with a browser UA.
The implementer's CDP/BiDi captures establish reproduction/available initiators;
the installed-service identification and curl comparison are **user-supplied**,
not newly performed system inspection. Record this as **local environment
injection, not site source**. A zero CSP count here is not proof that a local HTTPS
filter cannot alter executable HTML/policy before the browser applies it. No
service, user profile, system setting, CSP or public site configuration was changed.

**Still open at that update:** after `deadline-config` lands/deploys, repeat byte
correspondence, landed-tree browser-check, full public Edge/Firefox peer flow and
the CLI-generated live Theora run on 8601/8602. The following update supplies these
observations; it does not promote the earlier timeout or partial runs to PASS.

### Post-deadline-config execution update — 2026-11-16, integration 225890d

#### Revision and deployment (R01 recheck)

Input 70 identified the integration ref as **`origin/main`**, with deadline-config
landed at `225890d241a9f4ef15956c9c3a69c5ece004d771`. Local `main` remains `d42c157`
because of a divergent, unpushed operator documentation commit; it is not the
integration ref. Earlier waiting on that ref did not establish a deployment delay.
No branch was reset, merged or pushed. Direct `git fetch origin` was denied by the
harness (not executed); `git log origin/main -5 --oneline` and `git show --stat
origin/main` both exited 0 and identified the landed commit already available.
A credential-free GitHub API GET of `/repos/almightie0214/agentic-web/commits/main`
returned **200**, SHA `225890d241a9f4ef15956c9c3a69c5ece004d771`, independently matching
that ref. No endless waiting command was restarted after input 70.

All new checks used Windows x64, Node **v24.16.0**. The implementer materialized
86 tracked `site-a/`, `site-b/`, `tools/` and `package.json` files using `git show
<revision>:<path>` into this isolated verification tree, without changing the old
runtime in the release-check worktree:

`I:/project/agentic-web/.theora/tmp/run-514-implementer/landed`

That original temporary workspace was later removed. Round 2 rebuilt the same
Git revision in the durable `source-225890d/` evidence tree below; this is a new
source reconstruction, not preservation of the original workspace or a new run.

`node {tmp}/prepare-release.mjs` exited **0**. HTTP measurement interval:
**09:38:21.214Z–09:38:30.255Z**. It enumerated changed site paths from `24395e4` to
`225890d`, added the A/B manifests, A links and both networks, used credential-free
GETs, `Cache-Control: no-cache`, manual redirects and a 30-second request timeout,
read complete response bodies and compared bytes to the isolated revision.
**67 paths: 51 extant files returned 200 with identical bytes; 16 removed modules
returned 404.** A/B index sources were compared at canonical `/` URLs (B's earlier
`/index.html` redirect remains recorded under R01). All 67 responses had ACAO `*`;
none of these canonical requests redirected. HTTP measurements alone are not
browser CORS or key-isolation evidence.

Changed deadline assets' SHA-256 (both public responses and isolated source):

| Path | SHA-256 |
| --- | --- |
| A and B runtime/engine.js | `35344ac1f959ead4f9e0e4bb3cd2a47076a7fb26230ac04535ebc9166291da60` |
| A and B runtime/kernel.js | `9bfa04602ac0bd3d190e8da277ac959ca5c8f5f4005fb50a674ada2eb88e7795` |
| A and B runtime/scope.js | `897457495ab9ccab7227da28f9eb807f83d3b55ff2c1792057d90806d9ea187b` |
| A and B runtime/README.md | `a1339a9991c9f29af653f12006ffa8fd47c2158736939331fafcbaa5140eb949` |
| A review_desk.network.json | `0cc29d25f3765cc7727d72c09183fb2159ae8656de4c16f98be161dac719431c` |
| B spec_scout.network.json | `d3fd82eeeee8f70db9e069aae425b2ca3f1781af2764dea0de7324387a3dd68c` |
| A converter/emit-network.mjs | `fa8c8209ac806082b5a9b79c6538f8fd55541f9aac0c8a5db946ff77071cb1d1` |

Other measured extant hashes equal the R01 table. Both copies of every removed
module listed in R01 still returned 404. After all browser runs, an independent
Node/`git show` byte comparison of all **86 snapshot files** exited **0** at
**09:51:07.125Z**; `origin/main` was still the same full SHA. No snapshot source was
mutated. Generated Theora artifacts and boot-invalid responses were separate test
inputs, not edits to that tree.

The new source contract is top-network query time = declared `max_execution_seconds`,
with a runtime ceiling of 300 seconds and a 90-second default only when absent.
Review Desk declares **240**, Spec Scout **180**, converted teams **240**. Peers
cannot extend the caller's query deadline. Runtime compilation rejects invalid
network/agent time declarations and invalid `max_steps`. This update measures
normal live completion; the deterministic deadline/invalid-input tests belong to
the preceding Task and engine checks, not new live claims here.

#### Landed-tree browser and boot checks (R02/R06 rechecks)

- `node {tmp}/landed/tools/browser-check.mjs` → **exit 0**. This is the actual,
  unmodified `225890d` tool (SHA-256
  `0deb6edfd1c067d0879d382cfa558b04af5c311ce3f31f897e507ef4df049b16`), not the old
  worktree runtime or a replacement runner. Edge **157.0.4341.60**, CDP **1.3**,
  fresh headless profile. A `127.0.0.1:63830`, B `:63829`, local mock router.
  Output: `status:PASS`, `modelRequests:6`, peer fetches manifest/definition/links,
  `blockedExternal:[]`, `protocolErrors:[]`, `unexpectedViolations:0`. Boot/render,
  valid sample, self URL audit, settings/reload, local website-action receipt,
  Allow-before-fetch, peer reply/final render, both converter formats and three
  byte-identical completed downloads per format passed. All three pages recorded
  only their expected inline/eval enforced violations (two each). Inline did not
  run; eval threw `EvalError`. Probe Log timestamps: **09:38:38.850Z,
  09:38:39.549Z, 09:38:39.778Z** (rounded down), not a complete run interval.
- `node {tmp}/prepare-boot.mjs` → **exit 0**, then
  `node {tmp}/boot-landed.mjs` → **exit 0**, Edge same version. The one-off tool
  derivative served `225890d` assets and replaced only network responses with the
  duplicate-worker fixtures described in R06. Flow interval **09:50:28.365Z–
  09:50:29.075Z**, A `:49538`, B `:49537`. Both pages showed their fixed guidance
  plus `Loader error: Duplicate agent name 'worker'.`; dummy URL-secret variants
  showed `Duplicate agent name '[redacted]'.` and removed the dummy marker from
  location. All four had `role=alert`, hidden chat and zero CSP events.
  `modelRequests:0`, `peerFetches:[]`, `blockedExternal:[]`, `protocolErrors:[]`.
  Derivative-script SHA-256:
  `d2cee51f70d8696eafa92f865364b5bf0ab115210e96cc604e9e1cfbaa1e0e7a` (not the original
  browser tool's hash). The original site/runtime bytes were not patched.

These checks removed their disposable profiles/workspaces. They use no real key
or live model. Task check `node tools/check-conformance.mjs` and the full gate are
engine-owned, not newly claimed executions by this implementer.

#### Public Edge and Firefox live observations (R03/R04)

Commands used the temporary Node script `live.mjs` through built-in CDP/BiDi,
installed browsers and a fresh profile for each attempt; no package installation,
public response substitution, runtime/prompt modification or operational profile
change was used. It waited for `document.readyState === 'complete'` and rendered
chat before clicking. Settings were changed only using the actual ⚙ controls:
router **`http://127.0.0.1:8640/api/v1`**, key **`otk_sentinel_dev`**, model
**`alibaba/qwen3.8-flash`**. The already-running development router was reused;
its private key file was never read or printed by the implementer. Browser-side
router requests carried only the sentinel, not an actual provider credential.

**Development loopback access conditions, not product/CSP changes:** Edge used
`--disable-extensions --disable-features=LocalNetworkAccessChecks` in its disposable
process, as in input 63. After correction of the script wrapper, Firefox reached
boot/sample but did not finish the loopback models GET/OPTIONS or settings apply;
its **45-second settings wait timed out**, with zero B requests/inference. That
symptom alone does not prove the precise cause. The successful Firefox run used a
disposable-profile preference `network.lna.skip-domains = "127.0.0.1"` (D58), leaving
site CSP unchanged. This exception applies to the **host**, not only port 8640;
only the named dev router was used for inference. Completion under the changed
condition is the observed comparison, not a definitive LNA diagnosis.
The source definition for that preference was checked in Mozilla's
`modules/libpref/init/StaticPrefList.yaml` via credential-free HTTPS (200).
Neither result claims default-profile judge access or recommends disabling checks
for ordinary use. All attempt profiles were removed.

| Attempt / UTC interval | Exit / result |
| --- | --- |
| `node {tmp}/live.mjs edge`, **09:40:19.041Z–09:43:05.648Z** | **0**, Edge 157.0.4341.60 / CDP 1.3; required public flow completed under dev-router LNA condition |
| First Firefox script invocation, **09:43:24.608Z–09:43:26.426Z** | **1**, BiDi rejected the script's top-level `await` (`ReferenceError: await is not defined`); no inference/B request; wrapper corrected to await inside an async function |
| Firefox default-LNA invocation, **09:43:45.773Z–09:44:32.865Z** | **1**, boot/sample passed, `timeout settings`; no inference/B request; no successful default-profile claim |
| Corrected Firefox invocation, **09:45:52.221Z–09:47:31.365Z** | **0**, Firefox **160.0**, build **20261104181552**, WebDriver BiDi; required public flow completed with temporary loopback-domain exception |

The successful Firefox command was a Node launcher: rename the failed JSON to
`live-firefox-default-failure.json`, then `spawnSync(process.execPath,
[tmp + '/live.mjs', 'firefox'], {stdio:'inherit'})`. The prior failure had likewise
been preserved as `live-firefox-script-failure.json`. No paid retry was performed
to replace either browser's imperfect peer answer with a better one.

Both successful runs observed:

- Public A boot/render, `max_execution_seconds:240` from the actual loaded network,
  valid sample static PASS (runtime behavior still unverified in the static report).
- Exact question: **“Ask Spec Scout what MVP Profile 0.2 §3.2 requires for peer discovery.”**
- **Zero B requests before Allow.** Edge question **09:40:23.581Z**, consent visible
  **09:40:27.258Z**, post-click log **09:40:27.268Z**; Firefox question
  **09:45:55.420Z**, consent visible **09:45:59.278Z**, click log **09:45:59.281Z**.
- Exactly one `consent` note per run: `decision:allow`, `source:prompt_allow`,
  `parent:s7`, `seq:9`, target `https://spec-scout.pages.dev/spec_scout`.
  Event wall times: Edge **09:40:27.260Z**, Firefox **09:45:59.281Z**.
  Trust on each completed run `s3`: **2 agent spans, 3 model-call spans,
  1 peer-fetch span, 1 peer-call span, 1 explicit consent-decision event;
  Allow once:1; all other decision-source counts:0**.
- A→B GET manifest **200**, definition **200**, links **404**, each ACAO `*`.
  Edge request starts **09:40:27.267Z / .333Z / .353Z**; Firefox
  **09:45:59.282Z / .521Z / .560Z**. Edge's first request is 1 ms before the
  post-click log, not before the actual click/consent event.
- Every captured B request had **no Authorization, Cookie, sentinel or request
  body**: **32 per browser** = these 3 peer fetches plus 29 subsequent direct-B
  navigation/static boot requests. Edge used `requestWillBeSentExtraInfo` wire
  headers for all 32; Firefox used BiDi `network.beforeRequestSent` headers/body
  metadata. This is bounded to captured requests, not universal non-disclosure.
  Router chat POSTs were **three per browser**, all HTTP **200**; successful
  streamed inference is additionally established by completed trace/answers below.
- Converter **Claude first click** and then Theora both produced static-PASS status
  and three download links after complete load. The earlier during-load first-click
  report is not diagnosed or declared fixed. Public runs inspected links, not
  downloaded bytes; the separate mock-router check did compare download contents.
- Direct public B boot/render completed. Observed normal-flow CSP event arrays
  on **A after settings reload/chat, converter, B were [] in each browser**.
  Edge enabled Security/Log/Audits and captured no security Log messages; Firefox
  captured no CSP log messages. No public probes were injected; inline/eval probe
  enforcement is the separate landed-tree check above. Pre-reload A's event array
  was replaced on settings reload; the protocol log capture spans that reload.

**Actual peer → caller tool → final answer comparison (not just run status):**

| Browser | Actual peer result and successful caller result | Completion |
| --- | --- | --- |
| Edge | peer `agent_result` parent `s12`, seq **107**, **1574 chars**, starts “Short answer: **the excerpt embedded here does not actually contain the normative World Wide Agentic Web ‘Peer Discovery’ text for §3.2**” (quote punctuation normalized in this table). Caller `tool_result spec_scout`, parent `s4`, seq **111**, `status:ok`, type **103**, preview starts `{"cruse":1,"text":"Short answer: **the excerpt embedded here does not actually contain` | `remote_call s12` parent `s7`, seq **109**, ok at **09:42:56.735Z**; final `agent_result` seq **195**, **1184 chars**, `run s3` seq **197**, ok at **09:43:03.782Z**, duration **159834 ms** |
| Firefox | peer `agent_result` parent `s12`, seq **199**, **2732 chars**, starts “Direct specification guidance—quoted faithfully from the embedded excerpts—lays out the §3.2 peer-discovery flow as a URL-based, manifest-selected, declarative fetch.” Caller `tool_result spec_scout`, parent `s4`, seq **203**, `status:ok`, type **103**, matching `{"cruse":1,"text":"Direct specification guidance…` prefix | `remote_call s12` parent `s7`, seq **201**, ok at **09:47:10.301Z**; final `agent_result` seq **411**, **3058 chars**, `run s3` seq **413**, ok at **09:47:29.994Z**, duration **94192 ms** |

The actual full peer texts were inspected. Neither is empty, function-call-only
markup or a runtime-error/timeout string. Both contain substantial prose; no failed
peer result was converted into a success answer. The caller result is the successful
CRUSE text wrapper, and its trace preview agrees with the actual peer prefix.
**The full caller tool payload was not captured**: this is not a byte-equality claim
for that full payload. Each final `agent_result.text` equals the saved assistant
history content. Model calls were non-mock on `127.0.0.1:8640` with the selected
model. Peer model spans `s14` finished `stop`, durations **149336 ms** (Edge) and
**70693 ms** (Firefox); caller final spans `s112`/`s204` finished `stop`.

**Execution flow: completed under the Goal's accepted-answer contract and specified
dev-router conditions. Answer quality: partial model-token corruption remains;
not quality PASS.** “Normal peer answer” here means an actual accepted peer return
rather than the retired failure-as-success cases, not a clean or factually verified
specification explanation (the scope distinction was confirmed in input 72).

Observed quality defects, not verified specification facts:

- Edge's peer claims its embedded source lacks normative §3.2 text, then degenerates
  into fragments such as `runtime HogwartsAPMap(); @peer.require(...)` and mixed
  tokens. Caller final begins “I asked Spec Scout about Worldwide Agentic Web MVP
  Profile 0.2 §3.2 and its peer-discovery requirements.” It preserves the peer's
  limitation claim, explicitly says **“The response was partially garbled”**, lists
  source metadata, and ends “This is an informational peer answer, not a conformance
  report or validation result.” The source-absence assertion is **model output**,
  not this ledger's finding about the supplied specification.
- Firefox's peer provides three labeled excerpts (`peer-url`,
  `exact-network-resolution`, `definition-fetch`), then degenerates into e.g.
  `Slotsels on a now. Austauschгл也跟季.` Caller final begins “I asked Spec Scout
  for the MVP Profile 0.2 §3.2 peer-discovery requirement.” It summarizes those three
  excerpts and explicitly says **“Spec Scout's response became garbled/corrupted
  after the [definition-fetch] excerpt”**, ending “This is Spec Scout's specification
  excerpt summary, not a `validate_network` conformance report.” Exact quotations
  and factual completeness were not verified.

These defects are already present in captured peer `agent_result` text; no provider
response-body capture or outside-runtime comparison was made, so their deeper
cause is not established. No quality repair or universal model compliance is claimed.

#### Local-environment request attribution recheck

Both public runs reproduced **8** `lc.getunicorn.org` requests each (GET base script
and POST `/l` on initial A, settings-reloaded A, converter and B), with no captured
CSP event/log messages. Edge attributes GETs to document parser locations (zero-based
line **8** on A/converter, **54** on B); the POST stack starts at function **V** in
that base script. Firefox's available BiDi initiators are **`type:other`**, with no
stack in this capture. This independently reproduces the requests; input 63's
Unicorn Pro/service and curl diagnosis remains user-supplied environment evidence,
not a newly performed service inspection. The R01 recheck's canonical public HTML
bytes matched the site source. Treat this as local HTTPS-filter injection, not
site code or a reason to relax CSP. The later loopback Theora run observed no such
requests. No local service or operational browser setting was changed.

#### CLI-generated Theora bundle live run (R05)

`node {tmp}/theora-run.mjs` → **exit 0**. The orchestration reconstructed only the
three sample records from the landed
`site-a/converter/samples/theora/layout.json` under `{tmp}/theora-input`, then ran:

```text
node {tmp}/landed/tools/theora2hocon/theora2hocon.mjs {tmp}/theora-input {tmp}/theora-output --layout theora
```

CLI exit **0**, output: `Wrote converted_team.network.json, agent-manifest.json,
and links.json. Review all artifacts before publication; deployment and browser
behavior are not verified.` The orchestrator served these three output files
unchanged over the landed A HTML/JS/runtime at **127.0.0.1:8601**, and the landed B
at **127.0.0.1:8602**. It changed no runtime, network instruction or generated
manifest route; the actual panel selected the development router/sentinel/model.
Generated and served hashes matched:

| File | Bytes | SHA-256 |
| --- | --- | --- |
| agent-manifest.json | 501 | `fa781ba1441505160a6ad6f4b064ce0c4e06709d9f5b367c789f5bf120715209` |
| converted_team.network.json | 2166 | `2c454ed6d11ea7ceac0e32155290bf79b57ecb129dd2eb3cdcd34f8632c186cf` |
| links.json | 65 | `1615f9e8c559c80bf8c767aea061ffe57024cac0f33686fa5cafdb75b172604d` |

Orchestration interval **09:48:25.481Z–09:49:57.287Z**; browser observation interval
**09:48:25.575Z–09:49:52.270Z**. A boot **09:48:26.147Z** loaded limit **240**;
question sent **09:48:27.640Z**:

> Help me plan a beginner repair workshop with a safety-focused session outline.

One fresh headless Edge/CDP profile, same version/model as above, **one live turn**:
coordinator model `s5` → specialist tool/agent `s8` → specialist model `s9` → final
coordinator model `s189`; all end states ok, model finish reasons tool_calls/stop/stop.
Specialist `agent_result` seq **185**, **2750 chars**, caller `tool_result` seq **188**,
status ok/type 103, matching “To Coordinator:” CRUSE prefix. Final `agent_result`
seq **775**, **7909 chars**, equals saved assistant history; `run s3` seq **777**
ended ok at **09:49:52.113Z**, **84138 ms**. Two agent spans, three model spans;
**zero remote/consent events** (empty generated peer map). The subsequent direct B
boot is not a peer invocation. A/B CSP arrays and security Logs were empty.
Servers were closed and the profile removed; the existing router was left running.

**Final answer inspected in full:** begins “Below is a practical, beginner-friendly
workshop agenda you can adapt to your venue, group size, and available materials.”
It presents a “Safety-Focused 2-Hour Agenda”, seven sessions, staffing/materials,
alternative durations, and tailoring questions; ends “How many volunteers or tools
will be available?” No visible draft/planning/process monologue or address to another
role was observed in this **final** answer. This is a one-run final-surface
observation, not a guarantee of prompt compliance, safety advice or arbitrary inputs.
The seven labeled durations actually total **115 minutes**, so the “2-Hour” heading
is an approximate model agenda, not a checked schedule claim by this ledger.

**Internal specialist quality is not PASS:** its text starts “To Coordinator:” and
ends **“Okay that seems coherent and safe. Need verify no verbose. It includes claim
phrasuke. The format mention timeframe arbitrary, unsure. Talks safe no dangerous
repair instructions. Fine.”** Other awkward fragments include “Artisanure?” and
“a did multi briefing”. Thus the output rule did not eliminate internal meta text
or token degeneration. Those fragments did not appear as draft/meta monologue in
the visitor's final answer. The old AW5 two quality failures remain unchanged; no
further paid run, prompt adjustment or output stripping was used to hide results.

#### Evidence locations, cleanup and remaining boundaries

**Round 2 evidence-retention correction.** The original
`I:/project/agentic-web/.theora/tmp/run-514-implementer/` directory was removed when
its execution ended. The earlier claim that it preserved the JSON/source snapshot
for independent review was wrong: run-temporary lifetime was confused with review
handoff lifetime. The observations were executed, but the first review could not
read their underlying records. A hash or this ledger's summary alone is not a
replacement for those records.

With input 80 / D59 authorization, the implementer recovered only existing
**run-514 tool stdout**, without a new browser or paid inference run, at
**2026-11-16T10:07:22.102Z**. Durable, project-local evidence root (not a run tmp,
credential store, public download or product file):

**`I:/project/agentic-web/.theora/judge-ready/release-check-225890d/`**

Start independent inspection with **`manifest.json`**, SHA-256
`7b01e593d9c1888032295696134ee23b3934a26e2de212e5dfe0684d880fb441`.
It lists original run/output refs, source paths, target revision, recovery method,
recovery time, observation ranges, every recovered file's size/hash and known losses.
`transcripts/` contains byte-identical copies of the selected stored stdout files;
`recovered-*.json` contains explicitly labeled field extraction, not a recreated
original capture. A failed/unparseable/truncated JSON object was not filled in from
this document. The original **complete live JSON and complete trace arrays were
not recovered**. The following old hashes are therefore separated from current
readable artifacts:

| Original capture | Original SHA-256 (recorded during run 514) | Recovery status |
| --- | --- | --- |
| deployment.json | `ffed0eb8750b6b862b4ee4da57d77bfc351e7cdb21e40b0e9e34ea86b861c96d` | Restored at the durable root, exact old hash; the stdout JSON minus console's final newline |
| live-edge.json | `335e9774b34cbdcf41a25cd9b9aa03748bac98ac314835c4501127a576ee38d7` | Complete original lost; available fields in recovered-edge.json and transcripts |
| live-firefox-script-failure.json | `12fb3781ef18637250947532b1cf878355855317fc221db51f49a1a869ca6302` | Complete original lost; original failure stdout retained separately |
| live-firefox-default-failure.json | `b4ea12899a7a593a4f605b35a137728e78c7f592e7582f4ccefaf029fb1f8919` | Complete original lost; original failure stdout retained separately |
| live-firefox.json | `0135d587d90bdf80752a4b960b4d8e8e83732dc5e84239e5bc108019460d3cd1` | Complete original lost; available fields in recovered-firefox.json and transcripts |
| live-edge-theora.json | `4ffa7c7993c73e46b6ef213131d9bd92e9a27853166be9c04922200c7e1eea01` | Complete original lost; available fields in recovered-theora.json and transcripts |
| theora-serve.json | `671c47786acb9992f44d700d5e61e233f03b9eddcb984c6cb0642345251f6f56` | Restored at the durable root, exact old hash; stdout lines 1064–1534 of theora-flow.txt |

**Currently readable extracted records** (all relative to the durable root, new
serialization/hash; no substitution of old live-capture hashes):

| File | Current SHA-256 | Restored observation scope |
| --- | --- | --- |
| recovered-edge.json | `c65b34d4d18af1d794056751fe78c481ebba70a53058f359e774eb001694dc6d` | Original 09:40:19.041Z–09:43:05.648Z; full peer/final text, actual caller tool-result status/preview, end spans, consent-visible ordering, trust, 32 B request records, router requests, CSP/log arrays and injection initiators |
| recovered-firefox.json | `e1bd32b8ba52a3c2cfcb2012285ae6148de1313cc261dd50f35d82152ce24630` | Original 09:45:52.221Z–09:47:31.365Z; same observation fields, BiDi version/build metadata |
| recovered-theora.json | `557bd100c39f40bb51c7fa8062e222d470827a3026af10ad7dfe167be4bcf080` | Original 09:48:25.575Z–09:49:52.270Z; full specialist/final text, tool status/preview, end spans, loopback flow/CSP/request fields |
| verification.json | `1f42c67c65252125dd7abb59d509724017fac204842a61462d04a3e7e5c10210` | Recovery audit at 10:08:13.182Z: 108 artifacts hashed, 11 stdout copies byte-equal their source, 86 source files equal Git revision, original final-text hashes match, peer/tool prefixes and measured request/CSP fields agree; no new browser/paid run |

The complete peer/specialist and final strings can be read without the larger JSON
at `answers/{edge,firefox,theora}-peer.txt` and `answers/{edge,firefox,theora}-final.txt`.
The final text-only hashes below still match exactly; byte sizes differ from JS
character counts because they are UTF-8. Full caller tool payload remains unobserved:
only the actual status/type/preview was captured and recovered, as stated above.

**Source stdout index** — these are original execution outputs, not rewritten
summaries. Source directory was
`I:/project/agentic-web/.theora/outputs/judge-ready-fixes--release-check--a1/`;
append `.txt` to each output ref there. Each durable copy's SHA-256 and original
absolute path is in `manifest.json`. The source run is 514 and measured revision
is `225890d241a9f4ef15956c9c3a69c5ece004d771` throughout.

| Durable copy / readable lines | Original output ref | What to compare |
| --- | --- | --- |
| transcripts/deployment.txt:1–751 | `call_0f57e29f7b834e208dcc01ee119618ee` | 67 public response records, byte hashes/equality, GitHub SHA and original measurement times |
| transcripts/edge-flow.txt:1–1465 | `call_2f5153c9bc3e49208d119fe4e42dd6cb` | Original timed UI steps/final answer, trust, B headers-presence booleans, CSP arrays and initiators |
| transcripts/firefox-flow.txt:1–786 | `call_b049e0ab9c034b9a8594cf353e52cdae` | Same Firefox flow fields, including actual final answer |
| transcripts/theora-flow.txt:1–1534 | `call_cbd9d1d01d0140dd84891ce7476e1357` | CLI output, full final answer, loopback flow, served-artifact hashes and times |
| transcripts/answer-traces.txt:1–272 / 273–554 / 555–799 | `call_93cb33c87ed0424ab057fe7043bf6e86` | Edge / Firefox / Theora complete peer and final agent_result strings, actual caller tool_result status/preview and end spans; Theora full final text is the text field at line 590 |
| transcripts/capture-index.txt:1–8 | `call_55783c59e7404b59891963a97ddd32a8` | Original capture/text hashes, consent-event arrays, span timing and original snapshot/profile audit timestamp; not full trace |
| transcripts/firefox-script-failure.txt:1–41 | `call_ee9a22699788468a8f6bb1677715315f` | Original top-level await error, captured request/log fields and profileRemoved flag |
| transcripts/firefox-default-failure.txt:1–70 | `call_0f8dd224e9964fcbb2d66ee7f589fe21` | Original timeout settings error, models/OPTIONS records, no peer requests, cleanup flag |
| transcripts/browser-check.txt:1–332 | `call_f6c94b1cf5644cc083a5b7f69381b173` | The original 225890d landed-tree mock check, not a new/public-model run |
| transcripts/boot-check.txt:1–167 | `call_c30b1a3f0cab4089b57a7831ef2e6a16` | Original four rendered loader/redaction cases and source digests |
| transcripts/original-artifact-audit.txt:1 | `call_2485313eba1a456aaeee75c4acfa10af` | Original run-514 consistency-check output (no exact timestamp in this stdout) |

The old source workspace and generated artifact files were removed; they are not
claimed retained. `source-225890d/` is an **86-file reconstruction from the immutable
Git commit**, made during recovery, with per-file hashes in the manifest and a fresh
byte comparison to `git show`. Generated output/served correspondence is independently
readable in the exact-restored `theora-serve.json`; generated file bytes themselves
were not recovered. Missing complete trace/launchFlags/temporaryPrefs capture fields
are not inferred from the ledger. Existing decisions and original command records
support the documented conditions but do not become recovered browser fields.

UTF-8 SHA-256 of final assistant text only: Edge
`2e728cde64745427f667bd327bfb52416baab3cc0dba10868d8b21bc3dfd72f8`, Firefox
`c6f2972305f7ac44b5de026ff6e4375ebbebeb35f12de6c8ece562fac40f8f25`, Theora
`734503004f26032cc745b443171700cd8dec8b9f7985ef28fbf8344e23bc18a1`.
The original run reported no remaining profile directories at **09:51:07.125Z**;
that timestamp/result is readable in `transcripts/capture-index.txt:8`. Temporary
execution scripts were removed after use. Durable recovered stdout/field extracts
and the rebuilt source tree above are retained for review; the old run tmp is not.
This Round 2 recovery made no new browser/model call and no account, billing,
credential-file or operational-browser configuration change.

**Required observation rows now have results:** public byte correspondence,
landed-tree browser-check, local loader-error/redaction, public Edge/Firefox actual
peer-return/consent/trust/wire/CSP and the one live Theora final-answer check.
Independent review and engine Task checks/gate remain separate; this ledger is
not their PASS verdict. Remaining limits include residual peer/internal-specialist
model quality, exact quotation fidelity, full provider response bodies and caller
tool payload, unexercised context/action/error subcases, arbitrary converted inputs,
default judge inference access, screenshots/video and final submission. The last
three are entrant-owned and outside this Goal; judge access is still an open item.
Neither the new observations nor source changes erase the historical failures.

## 7. Judge-facing public check

### Revision, conditions and current verdict

This section is a fresh implementer-run observation, not a reinterpretation of §6.
The measured source is **`9e9be81b982f3f93d222fbf77b8947538cb45ad6`**
(`sampling-temperature`, including its settings-test isolation correction).
The working tree was clean before measurement. No runtime, network, converter,
provider key file or operational router configuration was changed for these runs.

**Eight fully captured runs completed, and the implementer read all 14 complete
agent answers: no garbled sentences were observed in those answers.** This is a
bounded readability observation, not proof of general answer accuracy, quotation
fidelity, safety or provider reliability. **Public measurement: PASS for the eight
runs below.** User input **83**, recorded as **D61**, explicitly approves these
fresh-dialogue runs as the valid measurement set for `measured-limits`. The earlier
collector crash and MIME preparation failure are retained as **incomplete attempts
caused by measurement-tool defects, excluded from the measurement set**, with
reasons below. They are not relabeled as successful product runs. The user required
no additional live measurement or diagnosis. No deadline declarations are changed
in this Task.

- Public A: `https://almightie0214.github.io/agentic-web/`.
- Public B: `https://spec-scout.pages.dev/`.
- Node **v24.16.0**, Windows; Edge **157.0.4341.60** (CDP), Firefox **160.0**
  (native WebDriver BiDi, `session.new` / `script.evaluate`). Browsers were already
  installed; no software installation or ordinary-profile changes were made.
- Every captured query started in a fresh disposable browser profile and page;
  `before.history` is empty. The settings panel selected
  `http://127.0.0.1:8640/api/v1`, fake key `otk_sentinel_dev`, and explicit model
  `alibaba/qwen3.8-flash`. The already-running development router forwarded to
  Otari using the user's private key file. Real keys were not read by the collector,
  placed in the browser, or stored in these evidence files.
- Edge used `--disable-features=LocalNetworkAccessChecks`; Firefox's disposable
  `user.js` set `network.lna.skip-domains=127.0.0.1`. These development-router
  conditions are not default judge configuration. The Firefox exception is
  host-wide. All created browser profiles were removed afterward.
- The CLI sample came from `site-a/converter/samples/theora/layout.json`, expanded
  into exact virtual input paths and converted by
  `tools/theora2hocon/theora2hocon.mjs`. Its three artifacts were served unchanged
  on `http://127.0.0.1:8601/` with a copy of B's page, boot module and runtime.
  No peer origin was added: the two sample runs exercised internal specialist
  delegation, not cross-origin composition.

### Public deployment comparison

At **2026-11-16T12:55:17.354Z**, `node {tmp}/deployment.mjs` exited **0**.
It compared the 12 site files changed between `574f09e` and the measured revision
using credential-free GETs and SHA-256 plus byte equality. All returned **200**
and matched their source bytes:

- A: `converter/emit-network.mjs`, `review_desk.network.json`,
  `runtime/README.md`, `runtime/kernel.js`, `runtime/llm.js`, `runtime/runner.js`,
  `validator-rules.mjs`.
- B: `runtime/README.md`, `runtime/kernel.js`, `runtime/llm.js`,
  `runtime/runner.js`, `spec_scout.network.json`.

`deployment.json` retains each URL, response body, status, source/deployed hash,
comparison and target revision. This changed-file check is not a new exhaustive
publication/CORS/security audit.

### Fixed questions, requests and elapsed times

The questions were submitted through the actual chat controls, with **Allow** on
A's peer consent card. Each successful A trace contains exactly one
`prompt_allow` consent event and a successful `remote_call`; its peer answer is
also present in full in the caller's actual subsequent model-request tool message.
The converter likewise returned the specialist answer through the coordinator's
actual tool-result path.

- **A:** “Ask Spec Scout what MVP Profile 0.2 §3.2 requires before and while a caller
  loads a peer agent site.”
- **B:** “What does MVP Profile 0.2 §3.2 require before and while a caller loads a peer
  agent site?”
- **Converted team:** “Help me plan a beginner repair workshop with a safety-focused
  session outline.”

All **20 actual run model requests** recorded **model `alibaba/qwen3.8-flash`,
temperature `0.2`, stream `true`, HTTP 200**. These are the bodies passed to real
browser fetch, not configuration-derived predictions. The transparent observation
wrapper saved the body and response status without altering either; Edge's CDP
POST bodies were independently matched to those records. Firefox BiDi recorded
network request/completion metadata alongside its fetch-body records. Authorization
and Cookie headers were deliberately not collected. This is browser-to-development-
router request evidence, not a new capture of the router's upstream headers or
provider-internal defaults. Settings probes are not counted as run requests.

`durationMs` below is copied from the sole **top-level `kind:"run"`, `phase:"end"`,
`parent:null` trace span**, not a sum of agent/model spans or wall-clock estimates.
The table, `result.json` and `verification.json` retain the original values for
the follow-up calculation; no duration is rounded before that calculation.

| Case / relative evidence directory | Started–ended (UTC, includes setup) | Top-level durationMs | Run requests | Complete answers read (JS characters) | Captured execution / readability |
| --- | --- | ---: | ---: | --- | --- |
| `a-edge-1/` | 2026-11-16T12:59:01.210Z–13:00:23.254Z | 77390.19999998808 | 3 | spec_scout 4791; review_coordinator 3767 | completed / no garbling observed |
| `a-edge-2/` | 2026-11-16T13:00:43.272Z–13:02:03.901Z | 78037.19999998808 | 3 | spec_scout 5659; review_coordinator 3096 | completed / no garbling observed |
| `a-edge-3/` | 2026-11-16T13:02:11.782Z–13:03:06.346Z | 51780.09999999404 | 3 | spec_scout 6552; review_coordinator 2563 | completed / no garbling observed |
| `a-firefox-1/` | 2026-11-16T13:03:14.827Z–13:04:29.742Z | 70328 | 3 | spec_scout 3844; review_coordinator 3893 | completed / no garbling observed |
| `b-edge-1/` | 2026-11-16T13:04:38.165Z–13:05:28.312Z | 47318.19999998808 | 1 | spec_scout 3326 | completed / no garbling observed |
| `b-edge-2/` | 2026-11-16T13:05:36.624Z–13:06:08.880Z | 29373.90000000596 | 1 | spec_scout 3309 | completed / no garbling observed |
| `team-edge-1/` | 2026-11-16T13:07:43.043Z–13:08:25.656Z | 40203.30000001192 | 3 | specialist 2351; coordinator 3679 | completed / no garbling observed |
| `team-edge-2/` | 2026-11-16T13:08:34.758Z–13:09:20.569Z | 43567.69999998808 | 3 | specialist 2970; coordinator 3860 | completed / no garbling observed |

Each row was run as **`node {tmp}/live.mjs <case-id>`**, exit **0**, against the
revision above. Its exact executable source is retained as described below. All
captured run, agent and tool end spans have no error/limit outcome. No completed
run was cut off by a deadline. The incomplete tool attempt below cannot be called
a successful timing observation; its exclusion is authorized by user input 83,
not inferred from the later successes.

Reading notes: all four A peer answers and four A final answers are coherent
English explanations of peer loading, with recognizable requirement quotations
and evidence limits. B's two direct answers are also coherent. Both specialist
outlines and both workshop final agendas are readable, with no broken token
sequences or drafting monologue observed. This is not a full correctness review:
for example, `team-edge-1/answers.txt` labels its final agenda “about 1 hour 30
minutes” although its listed durations sum to 110 minutes. Some model headings
paraphrase §3.2 rather than using its exact title. These ordinary content issues
are not evidence of token corruption and are not hidden by the readability result.

### Failed collection and serving attempts — retained, not PASS

1. **Initial Edge collector crash:** `node {tmp}/live.mjs a-edge-1` exited **1**
   before saving a normal result. The CDP callback attempted `JSON.parse` on
   missing `Network.requestWillBeSent.request.postData`. Preflight/other requests
   can lack that field. The collector's unhandled callback exception terminated
   collection, and the browser did not survive the run. A rescue command
   (`node {tmp}/rescue.mjs`, exit **13**, unsettled top-level await) could not
   recover the session. **The exact question/run state and any answer/elapsed
   time are unknown.** It is not legitimate to infer “no question submitted” from
   the absent trace. The original collector, rescue script and explicit missing-
   evidence record are retained under `live-v1-crash.mjs`, `rescue.mjs` and
   `setup-edge-collector-crash/failure.json`. The disposable orphan profile was
   removed after confirming no matching Edge process remained. The collection
   cause was fixed by checking for postData before parsing; the subsequent eight
   completed runs are labeled separately. Request **50** initially blocked overall
   acceptance. **User input 83 then approved exclusion:** this is an incomplete
   attempt caused by a measurement-tool defect, not an observed product failure or
   deadline cutoff. It left no product answer or duration to enter in the timing
   set. The user approved the subsequent eight fresh-dialogue runs as the valid
   replacement set and required no additional paid attempts.
2. **Converted-team serving setup:** the first `team-edge-1` command exited **1**
   at boot observation timeout. The evidence server served generated `.mjs`
   runtime modules as `text/plain`. Its requests stopped at module loading, with
   no manifest fetch, model request or top-level run. The measurement server MIME
   map was corrected to `text/javascript`, not the product. The failed setup's
   complete request record, command error and profile cleanup remain in
   `setup-team-mime-failure/{failure.json,cleanup.json,diagnosis.txt}`. The successful
   team cases use the corrected collector. This is a pre-query setup failure, not
   a deadline-censored successful duration. User input **83** likewise excludes
   this measurement-tool preparation failure while requiring its evidence to remain.

No model/provider retry rule, sampling exception or higher temporary execution
limit was added. No failure was edited into a successful result.

### Durable evidence handoff and checks

Approved by reviewer input **82**, recorded as **D60**, the evidence is retained
outside run tmp at:

**`I:/project/agentic-web/.theora/judge-facing/9e9be81-public-check/`**

This is a local, git-excluded review handoff, not a public download. The scripts
were authored/executed in `{tmp}` only as an execution conduit; exact copies and
outputs survive here. Start with **`manifest-final.json`** and
**`verification-final.json`**. The initial `manifest.json` / `verification.json`
are also retained unchanged: their pending-approval wording is historical, before
user input 83. `measurement-decision.json` records that decision, not a recreated
browser observation.

| Relative path | What is actually preserved |
| --- | --- |
| `deployment.mjs`, `deployment.json` | Executed deployment comparison source and all 12 public response bodies, source hashes, revision, status/equality |
| `live-v1-crash.mjs`, `rescue.mjs`, `setup-edge-collector-crash/failure.json` | Initial collection error source, rescue source and explicit losses; no fabricated trace or answer |
| `live-v2-public.mjs` | Exact collector used for the six complete public cases and failed team serving setup |
| `live.mjs`, `team-edge-{1,2}/collector.mjs` | Corrected MIME collector used for the two complete team cases |
| `<case-id>/result.json` (each of eight case directories) | Browser version, fixed question, fresh history, conditions, actual request bodies/statuses, network metadata, entire trace, top run span, complete agent results, final history and rendered chat text |
| `<case-id>/answers.txt` | Readable full peer/specialist/final text extracted exactly from that case's agent_result events; not a generated summary |
| `<case-id>/cleanup.json` | Successful removal of that case's disposable profile |
| `team-input/`, `team-bundle/` | Exact expanded layout input, CLI output artifacts and served page/runtime files; the CLI stdout is in each team result |
| `setup-team-mime-failure/` | Failed pre-query serving setup, diagnosis and cleanup |
| `verify-evidence.mjs`, `verification.json` | Original pre-approval consistency audit and original-precision case times; no automatic text-quality classifier |
| `verify-evidence-final.mjs`, `verification-final.json` | Same consistency checks after user input 83, with the approved measurement-set scope; no new live/model run |
| `measurement-decision.json` | User input 83 disposition of the incomplete collection/preparation attempts |
| `diagnostic-provenance.md` | Exact copy of the operator's earlier small runtime-external diagnostic note; not rerun by this implementer |
| `manifest.json`, `manifest-final.json` | Initial and final relative file paths, sizes and SHA-256 for retained evidence |

`node {tmp}/verify-evidence.mjs` exited **0** at
**2026-11-16T13:12:11.897Z** (verification start). Its checks directly re-read the
stored records: 12 deployment matches; eight empty starting histories; eight
successful sole top-level spans; 20 requests with the stated model/temperature/
stream; answer extraction equality; final history equality; peer/specialist full
caller tool-result equality; consent and delegation; Edge request-body agreement;
profile cleanup and no remaining profile directories. The initial manifest lists
**72 artifacts**. The implementer also opened and read every `answers.txt` using
`read_file`, rather than inferring readability from exit status or previews.
These local consistency checks do not recover the initial attempt. Its explicit
exclusion is the user's decision above, not a technical claim of success.

After input 83, the updated audit (`node {tmp}/verify-evidence.mjs`, exact executed
copy `verify-evidence-final.mjs`) exited **0**, starting at
**2026-11-16T13:15:34.685Z**, with the same eight durations and 20 requests. The
final manifest contains **78 artifacts**. A subsequent direct SHA-256/size
re-read of every manifest entry also exited **0**; it confirmed that the entire
pre-existing ledger is an unchanged prefix and that local README/Devpost link
targets exist. Final evidence hashes:

- `manifest-final.json`:
  `4f44d2618875ecba85f920e79d97fe7b6d60849c1ace7f7256e0d6005a48d100`
- `verification-final.json`:
  `a334f30e5505014d5a566806a1bf551e36fc06c56366ef2f40412978301525d1`

The optional Otari feedback candidate in Devpost uses the operator's prior
diagnostic note (`diagnostic-provenance.md`): two streaming/no-temperature requests
had garbling; one streaming/0.2 request and four non-streaming requests (two without
temperature, two at 0.2) were readable. This implementer did not repeat that
experiment. The new eight browser runs are consistent with a bounded 0.2 mitigation
observation, not proof of causation or a known provider default. The feedback has
not been submitted.

Required candidate checks **`node tools/browser-check.mjs`** and
**`node tools/check-conformance.mjs`** are assigned to the engine before independent
review; they were **not run by this implementer** and are not claimed PASS here.
The project gate also remains engine-owned. A mock-router browser check does not
replace the paid public observations above. The README and Devpost draft were
rewritten for product use; historical diagnostics, revisions and failure details
remain in this ledger rather than their introductory text. Wiki updates are left
to the post-Goal librarian stage.

## 8. Measured execution limits

### Source and eligibility

`measured-limits` uses the eight fresh-dialogue runs in §7, observed against
`9e9be81b982f3f93d222fbf77b8947538cb45ad6`. It does not perform a new live run.
The source records remain under
`I:/project/agentic-web/.theora/judge-facing/9e9be81-public-check/`.
User input **83 / D61**, preserved in `measurement-decision.json`, approved this
exact replacement measurement set and excluded the two measurement-tool failures
with their original evidence intact. Those failures are not successful durations.
No successful run in this approved set failed, was cancelled, remained incomplete,
or was cut off by a deadline. This calculation does not silently discard a product
failure or override the Goal's rule against deadline-censored measurements.

The implementer ran **`node {tmp}/calculate-limits.mjs`**, exit **0**, from the
`measured-limits` working tree based on `1e4b2c7e64e041d1c4bbbab74970f227e2f8cae7`.
This read-only calculation re-read each `<case-id>/result.json` and checked:

- the §7 SHA-256 hashes of `manifest-final.json` and `verification-final.json`;
- each result's byte size and SHA-256 against that manifest;
- the exact approved case list, matching source revision and empty starting history;
- `executionOK: true`, exactly one `kind:"run"`, `phase:"end"` span, with
  `parent:null`, `status:"ok"` and a finite positive `durationMs`;
- no `composition_limit` event or error end span, and equality of the top-level
  span duration with both `result.run.durationMs` and `verification-final.json`.

Only that top-level span's duration enters the formula. Setup wall time, sums of
nested spans, and the duration of Spec Scout as a peer within A do not substitute
for a top-level network measurement. The calculation script is temporary, not a
new required evidence location; the durable inputs and every numeric operand and
result are recorded here so the calculation is reproducible without that script.

### Calculation (milliseconds retained at original precision)

For each network, `seconds = 30 * ceil(2 * max(durationMs) / 30000)`.
There is no rounding or truncation of the measured durations before this formula.

| Top-level network | Case | durationMs |
| --- | --- | ---: |
| review_desk | a-edge-1 | 77390.19999998808 |
| review_desk | a-edge-2 | 78037.19999998808 |
| review_desk | a-edge-3 | 51780.09999999404 |
| review_desk | a-firefox-1 | 70328 |
| spec_scout | b-edge-1 | 47318.19999998808 |
| spec_scout | b-edge-2 | 29373.90000000596 |
| converted_team | team-edge-1 | 40203.30000001192 |
| converted_team | team-edge-2 | 43567.69999998808 |

| Network | Longest case | max(durationMs) | 2 × max(durationMs) | 30-second multiples, rounded up | New max_execution_seconds |
| --- | --- | ---: | ---: | ---: | ---: |
| review_desk | a-edge-2 | 78037.19999998808 | 156074.39999997616 | 6 | 180 |
| spec_scout | b-edge-1 | 47318.19999998808 | 94636.39999997616 | 4 | 120 |
| converted_team | team-edge-2 | 43567.69999998808 | 87135.39999997616 | 3 | 90 |

Both runtime copies now declare **`MAX_EXECUTION_SECONDS = max(90, 180, 120, 90)
= 180`**. Review Desk changes from 240 to 180 seconds, Spec Scout from 180 to
120 seconds, and converter output (both layouts) from 240 to 90 seconds. These
are measured budgets for the fixed flows and conditions in §7, not a guarantee
that arbitrary later questions or provider response times fit within them.

### Runtime boundary and verification scope

The original undeclared query default remains **90 seconds**:
`min(network declaration ?? 90, MAX_EXECUTION_SECONDS)`. Both an oversized network
query declaration and a standalone agent declaration are clamped to the new
180-second runtime maximum. Earlier parent/composition deadlines still win. No
agent-call, remote-call, per-peer, concurrency, depth, `max_steps` default, or
action `timeoutMs` bounds were changed. Temperature and model policy are unchanged.

The mapping example, converter fixtures and both runtime local distribution
notices use the new values. The historical §7 and earlier records above are
unchanged: their old declarations describe the version actually measured.
New-limit public deployment and live remeasurement were not performed by this
Task; the engine owns landing and gate execution. Wiki updates remain the
post-Goal librarian's responsibility.

After joining the converter implementation, the implementer ran the following
checks on the changed working tree based on `1e4b2c7e64e041d1c4bbbab74970f227e2f8cae7`
(not a claim about a later deployed revision):

```text
node --test --test-name-pattern "^(smoke: Site A publishes a resolved two-agent network with the read-only validator action|smoke: measured query limits match the approved longest run budgets|peer: Site B manifest resolves to the informational one-agent network|site-[ab]: runtime uses the top network query deadline with default and maximum)$" tests/smoke.test.mjs tests/peer.test.mjs
node --test --test-name-pattern "^(CVT-NET/OUT-001: (mini-theora|sample-agents) parser-to-network byte snapshot and enumeration independence|CVT-NET-001/003/004: one role has the exact resolved envelope and no outgoing calls|converter web: both public samples use shared emitters, format metadata, AW2 reports and CLI-identical downloadable bytes|CVT-CLI/OUT-001: (theora|markdown) (explicit|auto) layout writes three byte snapshots|CVT-FRONT/OUT-001: (theora|markdown) explicit front overrides default/config and preserves all artifact bytes)$" tests/converter/emit.test.mjs tests/converter/web.test.mjs tests/converter/e2e.test.mjs
node --check site-a/runtime/scope.js
node --check site-b/runtime/scope.js
node --check site-a/converter/emit-network.mjs
```

All five commands exited **0**: the first reported **pass 5 / fail 0**, the second
**pass 10 / fail 0** (including both sample layouts' CLI/web byte equality), and
the syntax checks had no output. Node's existing `MODULE_TYPELESS_PACKAGE_JSON`
warning was present in the test runs. The new budget/cap assertions were also run
before the implementation changes: **exit 1, pass 0 / fail 3**, rejecting the old
240-second Review Desk declaration and the old runtime cap. The deadline checks
use a mocked clock, not elapsed-time sleeps, and exercise undeclared 90-second
queries, below/equal/above-cap declarations, and standalone agent clamping in
both runtime copies. The three Task checks and full project gate remain assigned
to the engine; this implementer did not run or claim those full checks.

## 9. Convert → test run 공개 실측

### 측정 판본과 보존 위치

이번 절은 `convert-test-run/public-check` 구현자가 직접 실행한 새 관찰이다.
기준은 착륙한 **`fcc8c0410b268b0e69ecf3a199efa4cc5e6ec47c`**이며,
측정 전 `HEAD`, `main`, `origin/main`이 모두 그 판본이고 작업 트리가 깨끗했다.
이전 절의 성공·실패 기록을 대체하거나 재해석하지 않는다.

검토자 입력 **85** / 결정 **D66**으로 확인한 영속 보존 루트:

**`I:/project/agentic-web/.theora/convert-test-run/fcc8c04-public-check/`**

이는 git에서 제외된 로컬 독립 검토 인계 자료이며 공개 다운로드가 아니다.
`{tmp}`는 실행용으로만 쓴다. 실제 실행 수집기는 각 시도의 `collector.mjs`로
복사하고 공개 응답과 실행별 원자료는 위 보존 루트에 남긴다. 실제 키 파일은
읽거나 출력하지 않고, 이미 실행 중인 개발 router와 가짜 sentinel만 사용한다.

### 공개 배포 선행 대조

`node {tmp}/deployment.mjs {tmp}/preflight`는 **exit 0**이었다.
`deployment.json`의 실제 UTC 범위는
**2026-11-16T17:06:18.819Z–17:06:24.770Z**다.
`git diff --name-only 23f3941 fcc8c0410b268b0e69ecf3a199efa4cc5e6ec47c -- site-a site-b`
목록의 변경 파일 **23개(A 18개, B 5개)**를 자격 없는 GET으로 읽었고,
모두 **HTTP 200, redirect 없음, 원본 바이트와 동일**이었다.
`credentials:'omit'`, `redirect:'manual'`로 요청했으며 응답 본문과 source/public
SHA-256, URL·상태·Content-Type·ACAO·Location을 파일별로 보존했다.
대상은 변환기·새 ADK 샘플·시험 실행 화면/다운로드·두 runtime의 변경 파일이다.
이는 변경 파일 대조이지 사이트 전체 보안·CORS 감사가 아니다.

### 미완료 시도 — 성공으로 대체하지 않음

- **`adk-edge-1/`**, `node {tmp}/live.mjs adk-edge-1`, **exit 1**.
  Edge **157.0.4341.60**, 실제 UTC
  **2026-11-16T17:08:35.048Z–17:09:24.629Z**.
  `observation timeout: sample conversion`으로 종료했다.
  보존된 `failure.json`에는 샘플 YAML 요청, 모델 요청, run span, 답이 모두 없다.
  `cleanup.json`은 버리는 프로필 삭제 완료를 기록한다.
  수집기가 버튼 DOM 존재만 기다리고 클릭한 뒤 converter 모듈과 그 의존 모듈의
  응답이 도착했다. 당시 readyState와 변환기 상태 문구는 수집하지 못했다.
  실패 뒤 추가 브라우저/모델 실행을 멈추고 검토자 요청 **52**로 진단과 재개 판단을
  보냈다. **사람 입력 86 / D67**은 정적 HTML의 버튼이 모듈 핸들러 등록 전에
  존재하는 **수집기 준비 경쟁**을 원인으로 확인하고, 실패 원본을 보존한 별도
  재개를 승인했다. 제품 실패나 성공한 시험 실행으로 바꾸지 않는다.
  보정한 수집기는 `document.readyState === 'complete'`까지 기다리고 한 번만
  클릭한다. Open in Review Desk는 실제 변환 완료 뒤, 시험 실행은 인계 검사·
  runtime 부팅·버튼 활성 확인 뒤 누른다. 재클릭·제품 수정·질문 변경·추가 성공
  횟수·임시 한도 상향은 없다. 새 시도는 **`adk-edge-1-r2/`**이며 아래에 나란히
  기록했다. 원래 미완료 시도는 PASS 집합에 넣지 않는다.
- 실행 전 보존 디렉터리 준비 명령 두 개도 각각 **exit 1**이었다(`ENOENT`,
  `ERR_FS_CP_EEXIST`). 부모 생성 뒤 파일별 배타 복사로 바로잡았으며 모델 실행은
  없었다. `preparation-failures.json`에 별도 보존했다. 이어 기존 개발 router의
  `/api/v1/models` 확인은 **HTTP 200**, 지정 모델 존재였다
  (`router-availability.json`; 추론 실행이 아님).

### 실행 조건과 고정 질문

- 공개 Review Desk: `https://almightie0214.github.io/agentic-web/`.
  공개 변환기: 같은 base의 `converter.html`.
  공개 피어: `https://spec-scout.pages.dev/spec_scout`.
  로컬 복제 페이지나 모의 router가 아니라 **공개 페이지와 실제 모델**을 썼다.
- Windows x64, Node **v24.16.0**, 설치된 Edge **157.0.4341.60**(CDP),
  Firefox **160.0**(WebDriver BiDi). 각각 새 버리는 프로필·빈 history로 시작했고
  여섯 시도의 프로필을 모두 삭제했다. 일반 사용자 프로필은 바꾸지 않았다.
- 내장 설정 패널에서 가짜 키 `otk_sentinel_dev`, 모델
  **`alibaba/qwen3.8-flash`**, router **`http://127.0.0.1:8640/api/v1`**를
  선택하고 Save and start로 재부팅했다. 기존 개발 router가 실제 Otari로 전달했다.
  실제 키는 브라우저나 수집기에 넣지 않았고 키 파일·운영 router 설정은 바꾸지
  않았다. 설정의 `/models` 조회는 아래 실행 모델 요청 수에서 제외한다.
- Edge는 `--disable-features=LocalNetworkAccessChecks`, Firefox는 버리는
  프로필의 `network.lna.skip-domains=127.0.0.1`을 썼다. Firefox 예외는 host
  전체에 적용된다. 기본 심사자 환경에서의 성공 증거가 아니다.
- 변환 네 건은 실제 샘플 버튼 → 정적 검사 통과 → Open in Review Desk → 같은
  탭의 Test run 메시지·Run 순서다. 인계 직후 run이 없음을 캡처한 뒤 Run을
  눌렀다. 입력이나 Publication base URL을 편집하지 않았고 별도 최상위 팀으로
  로드하지 않았다. 네 실행 모두 `editor` 표지로 실행 그래프에 표시됐고 채팅
  history는 비어 있었다. Spec Scout는 기존 채팅 Send → 동의 카드 **Allow**를
  한 번 누르는 흐름이다.

고정 질문은 수집기와 각 `result.json`에 그대로 있다:

- **ADK(세 성공 실행과 원래 미완료 시도 동일):** “For the fictional Cedar Museum,
  ask your specialist to obtain the calm route from the researcher. What is the
  route, its exact route code, and its duration?” 뿌리는 specialist를 부르고 중간은
  researcher를 불러야 잎에만 있는 경로 코드·시간을 얻는다.
- **Claude:** “Ask your specialist to suggest a calm, accessible 45-minute museum
  visit with rest breaks for a visitor who tires easily. Clearly distinguish
  assumptions from supplied facts and do not claim live venue information.”
- **Spec Scout:** “Ask Spec Scout what MVP Profile 0.2 §3.2 requires before and while
  a caller loads a peer agent site.”

### 결과 — 필수 다섯 실행의 범위 PASS

다섯 실행은 각각 **`node {tmp}/live.mjs <case-id>`**, **exit 0**이었다.
전문 **13개**를 구현자가 `read_file`로 모두 읽었으며 깨진 문장은 관찰되지 않았다.
모든 run·agent·tool·model 종료 span은 **`ok`**였고, 도구 오류 뒤 최종 답만 나온
실행은 없다. 아래 시간은 유일한 최상위 `kind:'run'`, `phase:'end'`,
`parent:null`, `id:'s3'`의 원래 **durationMs**다. setup을 포함한 UTC 범위나
중첩 span의 합과 혼동하지 않는다.

| Case / 보존 폴더 | 시작–종료 UTC(setup 포함) | durationMs | 모델 요청 | 읽은 답 전문(JS 문자 수) | 위임·최종 답 / 가독성 |
| --- | --- | ---: | ---: | --- | --- |
| `adk-edge-1-r2/` | 2026-11-16T17:14:17.096Z–17:14:39.350Z | 15867.800000011921 | 5 | researcher 150; specialist 153; coordinator 115 | 성공 / 깨짐 관찰 없음 |
| `adk-edge-2/` | 2026-11-16T17:14:52.264Z–17:15:08.648Z | 13002.100000023842 | 5 | researcher 175; specialist 143; coordinator 110 | 성공 / 깨짐 관찰 없음 |
| `claude-edge-1/` | 2026-11-16T17:15:20.790Z–17:15:52.731Z | 28713.100000023842 | 3 | specialist 1549; coordinator 1938 | 성공 / 깨짐 관찰 없음 |
| `adk-firefox-1/` | 2026-11-16T17:16:07.129Z–17:16:26.636Z | 13064 | 5 | researcher 175; specialist 138; coordinator 110 | 성공 / 깨짐 관찰 없음 |
| `scout-edge-1/` | 2026-11-16T17:16:38.225Z–17:18:02.618Z | 81756.5 | 3 | spec_scout 6342; review_coordinator 3874 | 성공 / 깨짐 관찰 없음 |

실제 모델 요청 **21건 모두** router host **`127.0.0.1:8640`**, model
**`alibaba/qwen3.8-flash`**, temperature **`0.2`**, stream **`true`**,
**HTTP 200**이다. 구성에서 추정한 값이 아니라 브라우저의 실제 `fetch`에 전달한
본문과 반환 상태를 바꾸지 않는 관찰 wrapper로 기록했다. Edge CDP의 실제 POST
본문과도 바이트 직렬화 전 객체가 일치함을 대조했고, Firefox는 BiDi의 요청·응답
메타데이터를 함께 남겼다. 이는 브라우저 → 개발 router 구간의 관찰이며 upstream
provider 헤더·본문을 새로 수집했다는 뜻은 아니다. Authorization·Cookie 헤더는
수집하지 않았다.

위임 증거는 결과 배지만이 아니라 parent span과 실제 caller tool 결과다:

- **ADK 세 건:** `s5 coordinator` → `s8 tool specialist` → `s9 specialist` →
  `s12 tool researcher` → `s13 researcher`. 두 tool 종료가 모두 `ok`이고,
  잎의 전문은 중간의 다음 모델 요청 `role:'tool', name:'researcher'`의 `text`와
  정확히 같으며, 중간의 전문도 뿌리의 다음 `name:'specialist'` 결과와 정확히 같다.
  세 답 모두 경로 Courtyard → Cedar Gallery → Window Bench, `CEDAR-27`,
  25 minutes를 읽을 수 있었다. 최종 답 전문과 시험 실행 화면 텍스트도 같다.
  화면에는 `Not converted for specialist: tools, model.` 알림이 있었다.
- **Claude:** `s5 coordinator` → `s8 tool specialist` → `s9 specialist`, 모두
  `ok`. specialist 전문이 뿌리의 다음 모델 요청 tool 결과와 같고 최종 답이 화면과
  같다. 45분 일반 경로·휴식·미확인 접근성 필요를 읽을 수 있었다. specialist는
  `Recommendation to coordinator:`로 시작한다. 문장이 깨진 것은 아니지만 모든
  출력 규칙이 완벽하게 지켜졌다고 주장하지 않는다. 원문을 그대로 보존했다.
- **Spec Scout:** `s4 review_coordinator` → `s7 tool spec_scout` →
  `s12 remote_call` → `s13 spec_scout`, 모두 `ok`. Allow 전 B 요청은 **0건**,
  `targetUrl:'https://spec-scout.pages.dev/spec_scout'`의 `prompt_allow` 동의 이벤트
  **1개**였다. 이후 B의 manifest·정의는 **200**, links는 **404**였다.
  피어 답 전문이 coordinator의 후속 모델 요청 tool 결과와 같고 최종 답은 채팅
  history와 같다. §3.2 발췌의 명세 설명을 읽을 수 있었다. 답의 redirect 설명은
  인용한 명세의 설명이며 이번 runtime이 redirect를 허용한다는 실측 주장은 아니다.

설정 재부팅 뒤·변환기·최종 Review Desk의 캡처된 CSP 이벤트 배열은 모두 비었다.
환경의 `lc.getunicorn.org` 요청은 그대로 보존했다(변환 실행마다 8건, Scout 4건).
사람 입력 86과 기존 §6의 로컬 HTTPS 필터 환경 요인 설명을 따르되, 이번 Task가
그 필터 자체를 새로 검사하거나 사이트 코드의 요청으로 판정한 것은 아니다.

### 독립 검토 인계와 원자료 재대조

보존 루트의 **`manifest-final.json`**, **`verification-final.json`**부터 읽는다.

| 상대 경로 | 보존한 자료 |
| --- | --- |
| `deployment.mjs`, `deployment.json` | 실행한 배포 비교 소스와 23개 공개 응답 본문·파일별 해시·상태·대상 판본 |
| `adk-edge-1/{collector.mjs,failure.json,cleanup.json}` | 최초 수집기 소스·미완료 관찰·프로필 삭제; 성공으로 수정하지 않음 |
| 성공 폴더별 `collector.mjs`, `result.json`, `answers.txt`, `cleanup.json` | 실제 실행 수집기 사본·조건·브라우저 판본·질문·인계한 산출물·실제 요청 본문/상태·network 메타데이터·전체 trace·모든 답 전문·최종 화면·실행 그래프·시간·프로필 삭제 |
| `preparation-failures.json`, `router-availability.json` | 브라우저 실행 전 디렉터리 준비 오류 두 건과 기존 router 모델 목록 확인 |
| `measurement-decision.json` | 사람 입력 86과 지정 보존 루트 승인 입력 85의 출처·처리; 브라우저 관찰과 구분 |
| `verify-evidence.mjs`, `verification.json`, `manifest.json` | 최초 원자료 정합성 감사와 파일 해시 목록; 원본 그대로 보존 |
| `verify-evidence-final.mjs`, `verification-final.json`, `manifest-final.json` | 최종 감사와 이전 감사까지 포함한 **33개 artifact**의 크기·SHA-256 목록 |

`node {tmp}/verify-evidence.mjs`는 **17:19:46.720Z–17:19:47.337Z**, **exit 0**으로
저장 자료를 직접 다시 읽었다. 같은 명령의 최종 감사 사본은
`verify-evidence-final.mjs`이며 **17:20:34.483Z–17:20:35.170Z**, **exit 0**이었다.
최종 감사는 Firefox 환경 요청 집계에서 responseCompleted도 요청으로 센 보조
필드만 바로잡았다(최초 `getunicornRequests:16`은 요청·응답 이벤트 16개, 실제
요청은 8개). 브라우저·모델을 다시 실행하거나 성공/실패 원자료를 고치지 않았다.
감사는 23개 공개 본문과 immutable Git 판본의 재대조, 빈 시작 history, 인계만으로
run 없음, 모든 종료 상태, 위임 parent 관계, 하위 전문과 실제 caller tool 결과의
일치, 요청 값·Edge POST 본문, 화면 전문, 동의·B 접촉 순서, 원래 실패와 프로필
삭제를 검사했다. 가독성은 자동 분류기가 아니라 위의 직접 읽기 관찰이다.
이후 `node -e` 인라인 인계 감사도 **exit 0**으로 최종 manifest의 **33개** 항목을
다시 읽어 크기·해시 일치, 두 최종 파일의 아래 해시 일치, 기존 원장이 바뀌지 않은
prefix임과 남은 프로필 0개를 확인했다. 검토에 tmp 파일은 필요하지 않다.
최종 제출 전 **17:26:45.482Z–17:26:46.070Z**의
`node --input-type=module -e <read-only evidence audit>`도 **exit 0**이었다.
보존된 최종 감사 소스의 쓰기 부분을 제외해 실행했으며, 33개 항목의 크기·해시와
23개 공개 본문·다섯 실행의 위임/실제 요청/화면 정합성을 다시 확인했다.
이 검사는 브라우저·모델을 호출하거나 기존 보존 파일을 덮어쓰지 않았다.

- `manifest-final.json` SHA-256:
  `6f9c37c636c237c7e996e67a7cf688e6abb9b85f5c7af6cae938963b1d56b7be`
- `verification-final.json` SHA-256:
  `33e4d071dbe3258724842f65eedc787e0b2eb2f73c4e47835069aa848a15b162`

이 결과는 명시한 다섯 실행의 위임 성공·답 가독성에 한정한 **공개 실측 PASS**다.
임의 입력, 정확성·인용 충실도·일반적인 모델 안정성, 기본 심사자 추론 접근,
상한 만료·Stop·동시 실행 거부의 공개 운동, 모든 네트워크 요청의 키 격리 보증은
주장하지 않는다. 독립 리뷰·전체 gate·제출 준비 완료의 판정도 아니다.
Task checks인 `node tools/browser-check.mjs`, `node tools/check-conformance.mjs`와
전체 gate는 엔진 소유이며 이 구현자가 실행하거나 PASS로 기록하지 않는다.
