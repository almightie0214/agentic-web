import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { AgentNetwork, validateNetwork } from '../site-b/runtime/kernel.js';
import { Engine, manifestAllowsPeer } from '../site-a/runtime/engine.js';
import { buildToolTable, dispatchToolCall } from '../site-a/runtime/runner.js';

const siteA = new URL('../site-a/', import.meta.url);
const siteB = new URL('../site-b/', import.meta.url);
const readJSON = async url => JSON.parse(await readFile(url, 'utf8'));

test('peer: Site A maps review_desk to the public Spec Scout network URL', async () => {
  const links = await readJSON(new URL('links.json', siteA));
  assert.deepEqual(links, {
    version: 1,
    networks: {
      review_desk: { spec_scout: 'https://spec-scout.pages.dev/spec_scout' },
    },
  });
  const manifestA = await readJSON(new URL('agent-manifest.json', siteA));
  const manifestB = await readJSON(new URL('agent-manifest.json', siteB));
  assert.deepEqual(Object.keys(links.networks), manifestA.networks.map(entry => entry.name));
  // Deployment URL changes must update links.json and allowed_peers together.
  const peerOrigins = [...new Set(Object.values(links.networks)
    .flatMap(bindings => Object.values(bindings)).map(target => new URL(target).origin))];
  assert.deepEqual(manifestA.allowed_peers, peerOrigins);
  assert.deepEqual(manifestA.peer_policy, { mode: 'closed' });
  const peer = new URL(links.networks.review_desk.spec_scout);
  assert.equal(peer.pathname.split('/').pop(), manifestB.networks[0].name);
  // B deploys at root; peer site bases in general may also contain a path prefix.
  assert.equal(new URL('./agent-manifest.json', peer).href,
    `${peer.origin}/agent-manifest.json`);
});

test('peer: Site B configures public artifact CORS for Cloudflare Pages (not live response evidence)', async () => {
  const headers = await readFile(new URL('_headers', siteB), 'utf8');
  // Cover the public static bundle, not just the HTML entry page.
  assert.match(headers, /^\/\*\r?\n[ \t]+Access-Control-Allow-Origin:[ \t]*\*[ \t]*$/m);
  assert.doesNotMatch(headers, /Access-Control-Allow-Credentials:[ \t]*true/i);
});

test('peer: Site B publishes a script-free top-level 404 page to disable the Pages SPA fallback (not live response evidence)', async () => {
  const html = await readFile(new URL('404.html', siteB), 'utf8');
  assert.match(html, /<!doctype html>/i);
  assert.match(html, /<html\s+lang="en">/i);
  assert.match(html, /<h1>[^<]+<\/h1>/i);
  assert.doesNotMatch(html, /<script\b|\bon\w+\s*=|javascript:/i);
});

test('peer: Site A Pages artifact preserves separate publication roots (not activation evidence)', async () => {
  const workflow = await readFile(new URL('../.github/workflows/pages.yml', import.meta.url), 'utf8');
  // Missing workflow or uploading the repository root would break the two-host handoff.
  assert.match(workflow, /uses: actions\/upload-pages-artifact@[^\r\n]+\r?\n[ \t]+with:\r?\n[ \t]+path: site-a[ \t]*(?:\r?\n|$)/);
});

test('peer: Site A closed policy permits only the declared Spec Scout origin', async () => {
  const manifest = await readJSON(new URL('agent-manifest.json', siteA));
  const links = await readJSON(new URL('links.json', siteA));
  const peer = new URL(links.networks.review_desk.spec_scout);
  for (const [target, allowed] of [
    [peer.href, true],
    [`${peer.origin}/agents/spec_scout`, true],
    ['https://other.invalid/spec_scout', false],
    [`https://${peer.hostname}.attacker.invalid/spec_scout`, false],
    [`http://${peer.hostname}/spec_scout`, false],
    [`https://${peer.hostname}:8443/spec_scout`, false],
  ]) {
    assert.equal(manifestAllowsPeer(target, manifest), allowed, target);
  }
});

test('peer: coordinator resolves the symbolic Spec Scout tool before consent-gated local execution', async t => {
  const base = 'https://review-desk.invalid/desk';
  const manifestA = await readJSON(new URL('agent-manifest.json', siteA));
  const configA = await readJSON(new URL('review_desk.network.json', siteA));
  const links = await readJSON(new URL('links.json', siteA));
  const target = links.networks.review_desk.spec_scout;
  const peer = new URL(target);
  const peerBase = peer.origin;
  const manifestB = await readJSON(new URL('agent-manifest.json', siteB));
  const configB = await readJSON(new URL('spec_scout.network.json', siteB));
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });

  for (const scenario of ['allow', 'decline', 'missing exact network']) {
    await t.test(scenario, async () => {
      const requests = [];
      const events = [];
      globalThis.fetch = async url => {
        url = new URL(url).href;
        requests.push(url);
        if (url.startsWith(`${peerBase}/`)) events.push('peer fetch');
        const published = new Map([
          [`${base}/review_desk.network.json`, configA],
          [`${base}/links.json`, links],
          [`${peerBase}/agent-manifest.json`, scenario === 'missing exact network'
            ? { ...manifestB, networks: [{ ...manifestB.networks[0], name: 'other' }] } : manifestB],
          [`${peerBase}/spec_scout.network.json`, configB],
          [`${peerBase}/links.json`, null],
        ]);
        assert.ok(published.has(url), `unexpected fetch: ${url}`);
        const data = published.get(url);
        return new Response(JSON.stringify(data), { status: data === null ? 404 : 200 });
      };
      const engine = new Engine({ originUrl: base });
      const compiled = await engine._compile(base, manifestA, manifestA.networks[0], { isTop: true });
      engine.top = { ...compiled, base, manifest: manifestA };
      const { network } = compiled;
      assert.equal(network.findFrontMan(), manifestA.networks[0].front_man);
      assert.deepEqual(validateNetwork(network).errors, []);
      const chain = [`${base}::${network.name}`];
      const ctx = engine._makeCtx({ ...engine.top, isTop: true, chain, slyData: {} });
      const { toolByName, toolSchemas } = await buildToolTable(ctx,
        network.getAgentSpec(network.findFrontMan()), chain);
      assert.equal(toolByName.get('conformance_reviewer').kind, 'agent');
      const entry = toolByName.get('spec_scout');
      assert.deepEqual(entry, { kind: 'link', reference: 'spec_scout' });
      assert.ok(toolSchemas.some(tool => tool.function.name === 'spec_scout'));
      assert.equal(network.getLink(entry.reference), target);
      assert.deepEqual(events, [], 'advertising the symbolic tool must not contact B');
      const question = 'What does section 3.2 require for peer loading?';
      engine.onConsent = async info => {
        assert.deepEqual(events, [], 'consent must precede any peer fetch');
        assert.equal(info.peerOrigin, peer.host);
        assert.equal(info.requestText, question);
        events.push('consent');
        return scenario === 'decline' ? 'decline' : 'allow';
      };
      const resolveRemote = ctx.resolveRemote;
      let modelCalls = 0;
      ctx.resolveRemote = async (url, ...args) => {
        assert.equal(url, target, 'links.json must resolve to <B root>/spec_scout');
        assert.equal(manifestAllowsPeer(url, manifestA), true);
        const session = await resolveRemote(url, ...args);
        assert.equal(session.base, peerBase);
        assert.equal(session.network.name, manifestB.networks[0].name);
        assert.equal(session.llm.baseUrl, engine.top.llm.baseUrl);
        // Only model inference is scripted; peer loading, validation and execution
        // use the published artifacts and the real browser-runtime path.
        session.llm.chat = async ({ messages, tools }) => {
          modelCalls++;
          assert.equal(messages[0].content, configB.tools[0].instructions);
          assert.equal(messages.at(-1).content, question);
          assert.deepEqual(tools, [], 'B has no site actions or further peers');
          return { content: 'Scripted Spec Scout answer.', toolCalls: [] };
        };
        return session;
      };
      const invoke = () => dispatchToolCall(ctx, entry, { request: question }, null, chain);
      if (scenario === 'missing exact network') {
        await assert.rejects(invoke(), /No published network named 'spec_scout'/);
        assert.equal(modelCalls, 0);
      } else if (scenario === 'decline') {
        assert.ok((await invoke()).includes(`user declined to contact ${peer.host}`));
        assert.equal(modelCalls, 0);
      } else {
        assert.equal((await invoke()).text, 'Scripted Spec Scout answer.');
        assert.equal(modelCalls, 1);
      }
      assert.equal(events[0], 'consent');
      assert.deepEqual(requests.filter(url => url.startsWith(`${peerBase}/`)),
        scenario === 'decline' ? [] : scenario === 'missing exact network'
          ? [`${peerBase}/agent-manifest.json`]
          : [`${peerBase}/agent-manifest.json`, `${peerBase}/spec_scout.network.json`, `${peerBase}/links.json`]);
    });
  }
});

// The published name is the exact final URL segment used by the spec_scout link.
test('peer: Site B publishes the exact spec_scout network name', async () => {
  const manifest = await readJSON(new URL('agent-manifest.json', siteB));
  assert.equal(manifest.brand, 'Spec Scout');
  assert.equal(manifest.networks.length, 1);
  const [entry] = manifest.networks;
  assert.equal(entry.name, 'spec_scout');
  assert.equal(entry.front_man, 'spec_scout');
  assert.equal(entry.hocon, './spec_scout.network.json');
  assert.ok(entry.description.trim());
  assert.deepEqual(manifest.llm_router, {
    base_url: 'https://api.otari.ai/api/v1', mock: false,
    byok_router: 'https://api.otari.ai/api/v1',
  });
  assert.equal(manifest.deployment.mode, 'static');
  assert.equal(manifest.peer_policy.mode, 'closed');
  assert.deepEqual(manifest.allowed_peers, []);
  assert.equal(manifest.actions, undefined, 'Spec Scout must not publish site actions');
  assert.equal(manifest.coded_tools, undefined, 'the peer needs no publisher executable code');
});

test('peer: Site B embeds authoring excerpts with their source sections and version', async () => {
  const { source, excerpts } = await readJSON(new URL('spec-excerpts.json', siteB));
  const config = await readJSON(new URL('spec_scout.network.json', siteB));
  const instructions = config.tools.find(agent => agent.name === 'spec_scout').instructions;
  const citation = [
    'SOURCE FOR ALL EXCERPTS',
    `Title: ${source.title}`,
    `Version: ${source.version}`,
    `Date: ${source.date}`,
    `Author: ${source.author}`,
    `Repository: ${source.repository}`,
    `Commit: ${source.commit}`,
    `Path: ${source.path}`,
    `Source URL: ${source.url}`,
    `License: ${source.license}`,
  ].join('\n');
  assert.ok(instructions.includes(citation), 'embedded source citation must match the authoring source');
  assert.ok(excerpts.length > 0, 'the authoring source must supply evidence');
  for (const excerpt of excerpts) {
    const block = `[${excerpt.id}] ${excerpt.topic} — Section ${excerpt.section}\n${excerpt.text}`;
    assert.ok(instructions.includes(block), `${excerpt.id}: preserve the quotation with its source section`);
  }
});

test('peer: Site B manifest resolves to the informational one-agent network', async () => {
  const manifest = await readJSON(new URL('agent-manifest.json', siteB));
  const [entry] = manifest.networks;
  const config = await readJSON(new URL(entry.hocon, siteB));
  assert.deepEqual(config.tools.map(agent => agent.name), ['spec_scout']);
  const [scout] = config.tools;
  assert.deepEqual(scout.tools, []);
  assert.equal(scout.class, undefined);
  assert.equal(scout.toolbox, undefined);
  assert.ok(scout.instructions.trim());
  const network = new AgentNetwork(config, entry.name);
  assert.equal(network.findFrontMan(), entry.front_man);
  assert.deepEqual(validateNetwork(network), { errors: [], warnings: [], externals: [], mcps: [] });
});


for (const site of ['site-a', 'site-b']) {
  const runtime = new URL('../' + site + '/runtime/', import.meta.url);
  const { Engine: RuntimeEngine } = await import(new URL('engine.js', runtime));
  const { AgentNetwork: RuntimeNetwork } = await import(new URL('kernel.js', runtime));
  const { runAgent, dispatchToolCall: dispatch, executeToolCalls } = await import(new URL('runner.js', runtime));
  const { createCallScope, bindContext } = await import(new URL('scope.js', runtime));
  const base = 'https://caller.invalid';
  const peerBase = 'https://peer.invalid';
  const pending = () => new Promise(() => {});
  const deferred = () => {
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    return { promise, resolve };
  };
  const tick = () => new Promise(done => setTimeout(done, 0));
  const fixture = (config = {}, extra = {}) => {
    const engine = new RuntimeEngine({ originUrl: base });
    const network = new RuntimeNetwork({ tools: [{ name: 'front', instructions: 'Answer.', tools: [] }], ...config }, 'test');
    const manifest = { networks: [{ name: 'test', hocon: 'test.json' }], peer_policy: { mode: 'closed' }, allowed_peers: [peerBase], deployment: { mode: 'static' }, ...extra };
    const llm = { baseUrl: 'browser://mock', mock: true, chat: async () => ({ content: 'A valid answer.', toolCalls: [] }) };
    engine.top = { base, network, manifest, llm };
    engine.userRouter = { baseUrl: llm.baseUrl, mock: true };
    const chain = [base + '::test'];
    const ctx = engine._makeCtx({ ...engine.top, isTop: true, chain, slyData: {} });
    return { engine, network, manifest, llm, ctx, chain };
  };
  const toolCall = entry => ({ id: 'call', name: 'test_tool', args: {}, entry });

  test(site + ': runtime rejects retired executable capabilities at compile time', async t => {
    const originalFetch = globalThis.fetch;
    t.after(() => { globalThis.fetch = originalFetch; });
    for (const [label, config, metadata] of [
      ['MCP', { tools: [{ name: 'front', instructions: 'Answer', tools: [{ url: peerBase + '/mcp' }] }] }, {}],
      ['MCP URL', { tools: [{ name: 'front', instructions: 'Answer', tools: [peerBase + '/mcp'] }] }, {}],
      ['toolbox', { tools: [{ name: 'front', instructions: 'Answer', tools: ['rest'] }, { name: 'rest', toolbox: 'requests_get', args: { url: peerBase } }] }, {}],
      ['coded', { tools: [{ name: 'front', instructions: 'Answer', tools: [] }, { name: 'code', class: 'Executable' }] }, {}],
      ['bundle', { tools: [{ name: 'front', instructions: 'Answer', tools: [] }] }, { coded_tools: { bundle: 'code.js' } }],
      ['bridge', { tools: [{ name: 'front', instructions: 'Answer', tools: [] }] }, { actions: { version: 1, bridge: 'bridge.html' } }],
    ]) {
      const { engine, manifest } = fixture();
      globalThis.fetch = async url => new Response(JSON.stringify(String(url).endsWith('/links.json') ? {} : config));
      await assert.rejects(engine._compile(base, { ...manifest, ...metadata }, manifest.networks[0], { isTop: true }), /This runtime does not support/, label);
    }
  });

  test(site + ': runtime rejects unusable answers and accepts prose and valid presentations', async () => {
    const presentation = { version: 1, components: [{ kind: 'report', markdown: 'Useful report.' }] };
    for (const [content, accepted] of [
      ['', false], [null, false], ['   ', false], ['<function=WebFetch>{"url":"https://example.invalid"}</function>', false],
      ['<function=WebFetch>', false], ['<function=One>{}</function>\n<function=Two>{}</function>', false],
      ['The notation <function=WebFetch> is an example, not a call.', true],
      ['<function=One>{}</function> These two tags are examples. <function=Two>{}</function>', true],
      ['Example code: \n' + '```text\n<function=WebFetch>\n```', true],
      ['The tool failed, so I cannot verify that claim.', true],
      [JSON.stringify({ version: 1, components: [{ kind: 'confirm', confirmLabel: 'old' }] }), false],
      [JSON.stringify({ version: 1, components: [{ kind: 'action', action: 'missing#action' }] }), false],
      ['A valid prose answer.\n```cruse-ui\n' + JSON.stringify({ version: 1, components: [{ kind: 'action', action: 'missing#action' }] }) + '\n```', true],
      [JSON.stringify(presentation), true],
      ['<tool_response>' + JSON.stringify(presentation) + '</tool_response>', true],
      [JSON.stringify({ Mode: 'Answer', Name: 'front', Response: JSON.stringify(presentation) }), true],
    ]) {
      const { ctx, llm, chain, engine } = fixture();
      llm.chat = async () => ({ content, toolCalls: [] });
      if (accepted) await runAgent(ctx, 'front', 'question', null, chain);
      else {
        await assert.rejects(runAgent(ctx, 'front', 'question', null, chain), /answer|response|call|presentation|component|action/i);
        assert.equal(engine.trace.events.filter(e => e.kind === 'agent' && e.phase === 'end').at(-1).status, 'error');
      }
    }
    const { ctx, llm, chain } = fixture({ max_steps: 1 });
    llm.chat = async () => ({ content: '', toolCalls: [{ id: 'missing', function: { name: 'missing', arguments: '{}' } }] });
    await assert.rejects(runAgent(ctx, 'front', 'question', null, chain), /max_steps|step limit|steps/i);
    ctx.composition = { deadline: Date.now() + 1000, agentCalls: 1, maxAgentCalls: 1 };
    await assert.rejects(runAgent(ctx, 'front', 'question', null, chain), /limit of 1/);
  });

  test(site + ': runtime translates every tool failure only at executeToolCalls', async () => {
    const { ctx, chain, engine } = fixture();
    ctx.resolveRemote = async () => ({ invoke: async () => { throw new Error('peer failure'); } });
    ctx.resolveLink = async () => { throw new Error('link failure'); };
    ctx.llm.chat = async () => { throw new Error('model failure'); };
    for (const entry of [
      { kind: 'agent', ref: 'front' }, { kind: 'remote', url: peerBase + '/peer' },
      { kind: 'link', reference: 'unbound' }, { kind: 'presentation' },
      { kind: 'website', ref: 'unavailable' }, { kind: 'unknown' }, undefined,
    ]) {
      const [result] = await executeToolCalls(ctx, [toolCall(entry)], null, chain);
      assert.ok(result.error, String(entry?.kind));
      assert.equal(result.status, 'error');
      assert.match(result.content, /Error/);
      assert.equal(engine.trace.events.filter(e => e.kind === 'tool' && e.phase === 'end').at(-1).status, 'error');
    }
    ctx.composition = { deadline: Date.now() + 1000, remoteCalls: 1, maxRemoteCalls: 1, peerCalls: new Map(), maxCallsPerPeer: 1 };
    await assert.rejects(dispatch(ctx, { kind: 'remote', url: peerBase + '/peer' }, {}, null, chain), /limit of 1/);
    ctx.composition = undefined;
    ctx.resolveRemote = async () => { const error = new Error('composition cycle detected'); error.code = 'COMPOSITION_CYCLE'; throw error; };
    await assert.rejects(dispatch(ctx, { kind: 'remote', url: peerBase + '/peer' }, {}, null, chain), /cycle/);
  });

  test(site + ': runtime website failures retain receipts including unknown write outcomes', async () => {
    for (const failure of ['handler', 'handler-null', 'output', 'timeout', 'deadline']) {
      const { engine, ctx, chain, manifest } = fixture();
      manifest.actions = { agentTools: ['check'] };
      let started = 0;
      const ref = engine.actions.register({ base, network: 'test' }, {
        name: 'check', description: 'Check', effect: ['timeout', 'deadline'].includes(failure) ? 'write' : 'read',
        inputSchema: { type: 'object', properties: {} }, outputSchema: { type: 'string' }, timeoutMs: 100,
      }, async () => { started++; if (failure === 'handler') throw new Error('handler rejected'); if (failure === 'handler-null') throw null; if (failure === 'output') return 4; return pending(); });
      const scope = createCallScope(ctx, { max_execution_seconds: failure === 'deadline' ? 0.03 : 1 });
      const active = bindContext(ctx, scope.signal, scope.deadline);
      try {
        if (failure === 'deadline') {
          await assert.rejects(executeToolCalls(active, [toolCall({ kind: 'website', ref })], null, chain), e => e.code === 'EXECUTION_DEADLINE');
          const end = engine.trace.events.filter(e => e.kind === 'tool' && e.phase === 'end').at(-1);
          assert.equal(end.status, 'error');
          assert.equal(end.receipt.status, 'unknown', 'started writes keep uncertain receipts even when the parent fails');
          assert.equal(started, 1);
          continue;
        }
        const [result] = await executeToolCalls(active, [toolCall({ kind: 'website', ref })], null, chain);
        assert.ok(result.error, failure);
        assert.equal(started, 1);
        assert.match(result.content, failure === 'handler' ? /handler rejected/ : failure === 'handler-null' ? /null/ : failure === 'output' ? /Invalid result/ : /unknown|deadline/i);
        if (failure === 'timeout') {
          assert.match(JSON.stringify(result.error.receipt || result.error.receipts || result.receipts || result.content), /unknown/);
        }
      } finally { scope.dispose(); }
    }
  });

  test(site + ': runtime scopes every ctx function and tool kind before any contact', async t => {
    const { engine, ctx, chain } = fixture();
    let contacts = 0;
    const originalFetch = globalThis.fetch;
    t.after(() => { globalThis.fetch = originalFetch; });
    globalThis.fetch = async () => { contacts++; throw new Error('unexpected fetch'); };
    engine.onConsent = engine.onLinkRequired = engine.onActionConfirm = engine.onAnswerDelta = () => { contacts++; };
    ctx.llm.chat = () => { contacts++; };
    const abort = new AbortController();
    const error = Object.assign(new Error('execution deadline test'), { code: 'EXECUTION_DEADLINE' });
    abort.abort(error);
    const active = bindContext(ctx, abort.signal, Date.now());
    const functions = Object.entries(active).filter(([, value]) => typeof value === 'function');
    assert.ok(functions.length >= 5);
    for (const [name, fn] of functions) await assert.rejects(Promise.resolve().then(() => fn({ targetUrl: peerBase })), e => e === error, name);
    for (const kind of ['agent', 'remote', 'link', 'website', 'presentation', 'unknown']) {
      await assert.rejects(dispatch(active, { kind, ref: 'front', url: peerBase + '/peer' }, {}, null, chain), e => e === error, kind);
    }
    assert.equal(contacts, 0);
  });

  test(site + ': runtime records each consent source once after caller policy', async t => {
    const { engine, ctx, chain } = fixture();
    const info = { targetUrl: peerBase + '/peer', peerOrigin: 'peer.invalid', parentSpan: 'parent', kind: 'network' };
    for (const [answer, source] of [['allow', 'prompt_allow'], ['always', 'prompt_always'], ['allow', 'remembered_always'], ['decline', 'decline'], [null, 'headless_default']]) {
      if (source === 'decline') engine.consent.clear();
      let prompts = 0;
      engine.onConsent = answer === null ? null : async () => { prompts++; return answer; };
      const before = engine.trace.events.length;
      const result = await ctx.requestConsent(info);
      assert.equal(result, answer === 'decline' ? 'decline' : 'allow');
      const events = engine.trace.events.slice(before).filter(e => e.kind === 'consent');
      assert.equal(events.length, 1, source);
      assert.equal(events[0].source, source);
      assert.equal(events[0].parent, 'parent');
      assert.equal(prompts, source === 'remembered_always' || source === 'headless_default' ? 0 : 1);
    }
    let prompts = 0;
    engine.onConsent = async () => { prompts++; return 'allow'; };
    await assert.rejects(ctx.requestConsent({ ...info, targetUrl: 'https://blocked.invalid/peer' }), /Policy/);
    const originalFetch = globalThis.fetch;
    t.after(() => { globalThis.fetch = originalFetch; });
    let fetches = 0;
    globalThis.fetch = async () => { fetches++; throw new Error('forbidden contact'); };
    await assert.rejects(dispatch(ctx, { kind: 'remote', url: 'https://blocked.invalid/peer' }, {}, null, chain), /Policy/);
    assert.equal(prompts, 0);
    assert.equal(fetches, 0);
  });

  test(site + ': runtime pending work ends at own inherited and composition deadlines', async t => {
    const originalFetch = globalThis.fetch;
    t.after(() => { globalThis.fetch = originalFetch; });
    for (const boundary of ['model', 'consent', 'link', 'manifest', 'definition', 'links']) {
      for (const owner of ['own', 'parent', 'composition']) {
        await t.test(boundary + ' / ' + owner, async () => {
          const { engine, ctx, llm, network, chain } = fixture();
          let late;
          let lateArtifact;
          let lateDocument;
          let persisted = 0;
          engine._persistLink = async () => { persisted++; };
          let fetches = 0;
          let modelSignal;
          if (boundary === 'model') llm.chat = async ({ signal }) => { modelSignal = signal; return pending(); };
          else {
            network.getAgentSpec('front').tools = boundary === 'link' ? ['unbound'] : [peerBase + '/peer'];
            if (boundary === 'link') network.linkSlots.add('unbound');
            let calls = 0;
            llm.chat = async () => ++calls === 1 ? { content: '', toolCalls: [{ id: 'peer-call', function: { name: boundary === 'link' ? 'unbound' : 'peer', arguments: '{}' } }] } : { content: 'Recovered from tool error.', toolCalls: [] };
            if (boundary === 'consent' || boundary === 'link') {
              late = deferred();
              engine.onConsent = () => boundary === 'consent' ? late.promise : 'allow';
              engine.onLinkRequired = () => late.promise;
            }
            globalThis.fetch = async (url, options) => {
              fetches++;
              assert.ok(options.signal, boundary);
              url = String(url);
              if ((boundary === 'manifest' && url.endsWith('agent-manifest.json')) || (boundary === 'definition' && url.endsWith('peer.json')) || (boundary === 'links' && url.endsWith('links.json'))) {
                lateArtifact = deferred();
                lateDocument = boundary === 'manifest' ? { networks: [{ name: 'peer', hocon: 'peer.json' }] }
                  : boundary === 'definition' ? { tools: [{ name: 'peer', instructions: 'Answer.', tools: [] }] } : {};
                return lateArtifact.promise;
              }
              if (url.endsWith('agent-manifest.json')) return new Response(JSON.stringify({ networks: [{ name: 'peer', hocon: 'peer.json' }] }));
              if (url.endsWith('peer.json')) return new Response(JSON.stringify({ tools: [{ name: 'peer', instructions: 'Answer.', tools: [] }] }));
              return new Response('{}');
            };
          }
          network.getAgentSpec('front').max_execution_seconds = owner === 'own' ? 0.035 : 1;
          if (owner === 'parent') ctx.deadline = Date.now() + 35;
          if (owner === 'composition') ctx.composition = { deadline: Date.now() + 35, agentCalls: 0, maxAgentCalls: 10, remoteCalls: 0, maxRemoteCalls: 10, peerCalls: new Map(), maxCallsPerPeer: 10 };
          const started = Date.now();
          await assert.rejects(runAgent(ctx, 'front', 'question', null, chain), error => error.code === 'EXECUTION_DEADLINE');
          assert.ok(Date.now() - started < 1000, boundary + ' must not remain pending');
          if (modelSignal) assert.ok(modelSignal.aborted);
          const count = fetches;
          late?.resolve(boundary === 'consent' ? 'always' : peerBase + '/peer');
          lateArtifact?.resolve(new Response(JSON.stringify(lateDocument)));
          await tick();
          assert.equal(fetches, count, 'late UI input cannot contact a peer');
          assert.equal(engine.consent.size, 0);
          assert.equal(engine.runtimeAllowedPeers.size, 0);
          assert.equal(engine.registry.cache.size, 0);
          assert.equal(persisted, 0);
          assert.equal(network.getLink('unbound'), null);
        });
      }
    }
  });

  test(site + ': runtime invalidates queued decisions and input cancelled just before commit', async t => {
    const { engine, ctx, network } = fixture();
    const originalFetch = globalThis.fetch;
    t.after(() => { globalThis.fetch = originalFetch; });
    globalThis.fetch = async () => { assert.fail('cancelled input must not fetch'); };
    const firstInput = deferred();
    let prompts = 0;
    engine.onConsent = () => { prompts++; return firstInput.promise; };
    const firstScope = createCallScope(ctx, { max_execution_seconds: 1 });
    const secondScope = createCallScope(ctx, { max_execution_seconds: 0.025 });
    const info = { targetUrl: peerBase + '/peer', peerOrigin: 'peer.invalid', kind: 'network' };
    const first = bindContext(ctx, firstScope.signal, firstScope.deadline).requestConsent(info);
    const second = bindContext(ctx, secondScope.signal, secondScope.deadline).requestConsent(info);
    try {
      await assert.rejects(second, e => e.code === 'EXECUTION_DEADLINE');
      firstInput.resolve('allow');
      await first;
      await tick();
      assert.equal(prompts, 1, 'expired queued prompts never reach UI');
      assert.equal(engine.trace.events.filter(e => e.kind === 'consent').length, 1);
    } finally { firstScope.dispose(); secondScope.dispose(); }
    for (const boundary of ['consent', 'link']) {
      const controller = new AbortController();
      const error = Object.assign(new Error('cancel before commit'), { code: 'EXECUTION_DEADLINE' });
      const active = bindContext(ctx, controller.signal, Date.now() + 1000);
      if (boundary === 'consent') {
        engine.onConsent = () => { controller.abort(error); return 'always'; };
        await assert.rejects(active.requestConsent(info), e => e === error);
      } else {
        engine.onLinkRequired = () => { controller.abort(error); return peerBase + '/peer'; };
        await assert.rejects(active.resolveLink('unbound', null), e => e === error);
      }
      assert.equal(engine.consent.size, 0);
      assert.equal(engine.runtimeAllowedPeers.size, 0);
      assert.equal(network.getLink('unbound'), null);
    }
    const lateManifest = deferred();
    const optionalScope = createCallScope(ctx, { max_execution_seconds: 0.025 });
    globalThis.fetch = async (_url, options) => {
      assert.equal(options.signal, optionalScope.signal, 'omitted optional span/chain still carries the invocation signal');
      return lateManifest.promise;
    };
    try {
      await assert.rejects(bindContext(ctx, optionalScope.signal, optionalScope.deadline).resolveRemote(peerBase + '/peer'), e => e.code === 'EXECUTION_DEADLINE');
      lateManifest.resolve(new Response(JSON.stringify({ networks: [{ name: 'peer', hocon: 'peer.json' }] })));
      await tick();
      assert.equal(engine.registry.cache.size, 0);
    } finally { optionalScope.dispose(); }
  });

  test(site + ': runtime actual peer failure reaches caller and child deadlines leave siblings intact', async t => {
    const originalFetch = globalThis.fetch;
    t.after(() => { globalThis.fetch = originalFetch; });
    for (const [response, accepted] of [
      ['<function=WebFetch>{}</function>', false], ['', false], ['deadline', false], ['max_steps', false],
      [JSON.stringify({ version: 1, components: [{ kind: 'confirm' }] }), false],
      [JSON.stringify({ version: 1, components: [{ kind: 'action', action: 'unavailable' }] }), false],
      ['valid', true], [JSON.stringify({ version: 1, components: [{ kind: 'report', markdown: 'Peer report.' }] }), true],
    ]) {
      const { engine, ctx, chain } = fixture();
      globalThis.fetch = async url => new Response(JSON.stringify(String(url).endsWith('agent-manifest.json')
        ? { networks: [{ name: 'peer', hocon: 'peer.json' }] }
        : String(url).endsWith('peer.json') ? { max_steps: 1, max_execution_seconds: response === 'deadline' ? 0.025 : 1, tools: [{ name: 'peer', instructions: 'Answer.', tools: [] }] } : {}));
      const session = await engine.resolveRemote(peerBase + '/peer', chain, null, engine.top.manifest);
      session.llm.chat = response === 'deadline' ? pending : async () => response === 'max_steps'
        ? { content: '', toolCalls: [{ id: 'x', function: { name: 'unknown', arguments: '{}' } }] }
        : { content: response === 'valid' ? 'A real peer answer.' : response, toolCalls: [] };
      const [result] = await executeToolCalls(ctx, [toolCall({ kind: 'remote', url: peerBase + '/peer' })], null, chain);
      if (accepted) assert.ok(!result.error);
      else {
        assert.ok(result.error, response);
        assert.equal(engine.trace.events.filter(e => e.kind === 'remote_call' && e.phase === 'end').at(-1).status, 'error');
      }
      if (response === 'deadline') {
        ctx.network.getAgentSpec('front').tools = [peerBase + '/peer'];
        const originalChat = ctx.llm.chat;
        ctx.llm.chat = async ({ messages }) => {
          const tool = messages.findLast(message => message.role === 'tool');
          if (!tool) return { content: '', toolCalls: [{ id: 'child-timeout', function: { name: 'peer', arguments: '{}' } }] };
          assert.match(tool.content, /deadline/);
          return { content: 'The peer timed out; I will use the available information.', toolCalls: [] };
        };
        assert.equal((await runAgent(ctx, 'front', 'parent question', null, chain)).text, 'The peer timed out; I will use the available information.');
        ctx.llm.chat = originalChat;
        ctx.network.getAgentSpec('front').tools = [];
      }
      assert.equal((await runAgent(ctx, 'front', 'sibling question', null, chain)).text, 'A valid answer.');
      assert.equal(ctx.signal?.aborted, undefined, 'child scope never mutates its parent');
    }
    const { ctx, llm, chain } = fixture({ tools: [
      { name: 'front', instructions: 'Parent.', tools: ['short', 'long'] },
      { name: 'short', instructions: 'Short.', tools: [], max_execution_seconds: 0.025 },
      { name: 'long', instructions: 'Long.', tools: [], max_execution_seconds: 0.4 },
    ] });
    llm.chat = async ({ messages, signal }) => {
      if (messages[0].content === 'Short.') return pending();
      await new Promise(done => setTimeout(done, 65));
      assert.equal(signal.aborted, false);
      return { content: 'Long sibling completed.', toolCalls: [] };
    };
    const parentScope = createCallScope(ctx, { max_execution_seconds: 1 });
    try {
      const results = await executeToolCalls(bindContext(ctx, parentScope.signal, parentScope.deadline), [
        { ...toolCall({ kind: 'agent', ref: 'short' }), id: 'short' },
        { ...toolCall({ kind: 'agent', ref: 'long' }), id: 'long' },
      ], null, chain);
      assert.equal(results[0].error.code, 'EXECUTION_DEADLINE');
      assert.equal(results[1].status, 'ok');
      assert.equal(JSON.parse(results[1].content).text, 'Long sibling completed.');
      assert.equal(parentScope.signal.aborted, false);
    } finally { parentScope.dispose(); }
  });
}
