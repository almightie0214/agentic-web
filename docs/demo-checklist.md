# Demo checklist and browser evidence ledger

## Status: corrected local rechecks passed; public acceptance still unverified

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
Public HTTPS/CORS and judging access remain UNVERIFIED. Writing this checklist,
passing Node checks, or merging it does not complete runtime acceptance.

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
- Published binding still points to `https://spec-scout.invalid/spec_scout` in
  `site-a/links.json`, with the matching reserved origin in
  `site-a/agent-manifest.json`. It is not a reachable demonstration endpoint.
- `site-b/_headers` declares `Access-Control-Allow-Origin: *`. This is a local
  configuration observation, not a measured response header.
- At preparation time no browser run or video had occurred. The later user-run
  environment, revision, models, origins and sanitized trace/request observations
  are recorded in §3. No video or screenshot was reviewed by the implementer.

### Confirmed execution handoff — user decision, 2026-11-16

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
open observations. For subsequent runs use the local setup below or actual A/B
HTTPS URLs after activation. Preserve failed attempts and distinguish earlier
runtime observations from revalidation of a corrected candidate. Request minimal
scope approval for runtime defects and recheck after correction. Public HTTPS/CORS
and judging access remain separate user acceptance steps after deployment activation.

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
| P01 | Public HTTPS and CORS response measurements | UNVERIFIED | Loopback HTTP only; no public deployment |
| P02 | Independent judging access and demonstrated public revision | UNVERIFIED | No public access handoff/check |

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
- P01 public HTTPS/CORS and P02 judging access stay UNVERIFIED until deployment
  activation and independent access checks (§4); deployment operator and user own
  those acceptance steps. Video remains a plan, not delivered footage. This is a
  local browser evidence handoff, **not submission readiness**.

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

## 4. Public deployment and judging handoff (after activation)

- [ ] Deployment operator confirms A publishes only `site-a/`, B only `site-b/`,
  and records actual public URLs, deployed commit/build and artifact correspondence.
- [ ] Update production `site-a/links.json` and manifest `allowed_peers` together
  through the deployment task; run the peer consistency tests and static CLI.
  Do not treat a local fixture override as the production fix.
- [ ] In a clean real browser load A/B over HTTPS, inspect the public manifest,
  actual resolved definitions and links, final URLs/status/content and B response
  `Access-Control-Allow-Origin` on every public artifact used. Confirm readable
  cross-origin fetches from A. Record redirects and distinguish missing files,
  TLS/DNS/network errors and actual browser CORS rejection.
- [ ] Repeat the relevant B01–B08 path on the public revision, with private user
  key entry and no secret capture. Local two-origin evidence cannot replace this.
- [ ] A separate judging visitor can reach A and inspect public artifacts without
  publisher account access. Explain honestly that live inference needs the
  visitor's supported provider/key and any costs; do not distribute a shared key.
  Record the visitor's actual access result, remaining restrictions and owner.
- [ ] Mark submission-ready only after required runtime evidence is recorded and
  public HTTPS/CORS and judging access are accepted. Otherwise retain blockers.

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
