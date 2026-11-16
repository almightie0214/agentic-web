import test from 'node:test';
import assert from 'node:assert/strict';

const base = 'https://desk.invalid/review';
const router = 'https://visitor-router.invalid/v1';
const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};
const completion = delta => new Response(`data: ${JSON.stringify({ model: 'visitor-model', choices: [{ delta, finish_reason: 'stop' }] })}\n\ndata: [DONE]\n\n`, { headers: { 'Content-Type': 'text/event-stream' } });
const call = name => ({ tool_calls: [{ index: 0, id: name, type: 'function', function: { name, arguments: '{"request":"question"}' } }] });
const editor = (config = {}, manifest = {}) => ({
  baseUrl: base,
  manifest: { networks: [{ name: 'review_desk', hocon: 'https://untrusted.invalid/definition.json' }],
    llm_router: { base_url: 'https://untrusted.invalid/v1', byok_router: 'https://untrusted.invalid/v1' },
    peer_policy: { mode: 'closed' }, ...manifest },
  network: { llm_config: { model_name: 'untrusted-model', temperature: 0.2 },
    tools: [{ name: 'front', instructions: 'Editor instructions.', tools: [] }], ...config },
});

for (const site of ['site-a', 'site-b']) {
  const { Engine } = await import(`../${site}/runtime/engine.js`);
  const fixture = ({ modelOverride = '', seconds = 5, maxSteps = 3, key = 'visitor-key' } = {}) => {
    const engine = new Engine({ originUrl: base, byokKey: key, modelOverride });
    const manifest = { networks: [{ name: 'review_desk', hocon: './desk.json' }],
      llm_router: { base_url: router, byok_router: router }, deployment: { mode: 'static' } };
    const compiled = engine._compileDefinition({ max_execution_seconds: seconds, max_steps: maxSteps,
      llm_config: { model_name: 'desk-model' }, tools: [{ name: 'desk', instructions: 'Desk instructions.', tools: [] }] },
    manifest, manifest.networks[0], { base, isTop: true });
    engine.top = { ...compiled, base, manifest };
    return engine;
  };
  const restoreFetch = t => {
    const original = globalThis.fetch;
    t.after(() => { globalThis.fetch = original; });
  };

  test(site + ': editor routes only through the desk, delegates and keeps history private', async t => {
    restoreFetch(t);
    for (const modelOverride of ['', 'visitor-model']) {
      const engine = fixture({ modelOverride });
      engine.history.push({ role: 'user', content: 'private earlier chat' });
      const input = editor({ tools: [
        { name: 'front', instructions: 'Editor front.', tools: ['middle'] },
        { name: 'middle', instructions: 'Editor middle.', tools: ['leaf'] },
        { name: 'leaf', instructions: 'Editor leaf.', tools: [] },
      ] });
      const before = structuredClone(input);
      const bodies = [];
      globalThis.fetch = async (url, options) => {
        assert.equal(url, router + '/chat/completions');
        assert.equal(options.headers.Authorization, 'Bearer visitor-key');
        const body = JSON.parse(options.body);
        bodies.push(body);
        assert.equal(body.model, modelOverride || 'desk-model');
        assert.equal(body.temperature, 0.2);
        assert.ok(!body.messages.some(m => m.content === 'private earlier chat'));
        const result = body.messages.findLast(m => m.role === 'tool');
        const agent = body.messages[0].content;
        if (agent === 'Editor leaf.') return completion({ content: 'Leaf answer.' });
        if (result) {
          assert.match(result.content, agent === 'Editor front.' ? /Middle answer/ : /Leaf answer/);
          return completion({ content: agent === 'Editor front.' ? 'Front answer.' : 'Middle answer.' });
        }
        return completion(call(body.tools[0].function.name));
      };
      assert.equal((await engine.runEditor(input, 'question')).text, 'Front answer.');
      assert.equal(bodies.length, 5);
      assert.deepEqual(input, before, 'caller-owned editor input remains unchanged');
      assert.deepEqual(engine.history, [{ role: 'user', content: 'private earlier chat' }]);
      const agents = engine.trace.events.filter(e => e.kind === 'agent' && e.phase === 'start');
      assert.deepEqual(agents.map(e => e.agent), ['front', 'middle', 'leaf']);
      assert.ok(agents.every(e => e.origin === 'editor'));
      assert.equal(engine.running, false);
    }
  });

  test(site + ': editor cannot inherit website capabilities or stored links by network name', async t => {
    restoreFetch(t);
    const storage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    const storageAccess = [];
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
      getItem(...args) { storageAccess.push(['read', ...args]); return 'https://desk.invalid/review/helper'; },
      setItem(...args) { storageAccess.push(['write', ...args]); },
    } });
    t.after(() => storage ? Object.defineProperty(globalThis, 'localStorage', storage) : delete globalThis.localStorage);
    const engine = fixture();
    const ref = engine.actions.register({ base, network: 'review_desk' }, { name: 'save', description: 'Secret website capability.',
      effect: 'read', inputSchema: { type: 'object', properties: {} } }, async () => assert.fail('website action executed'));
    let modelCalls = 0;
    globalThis.fetch = async (url, options) => {
      assert.equal(url, router + '/chat/completions');
      const body = JSON.parse(options.body);
      modelCalls++;
      assert.deepEqual(body.tools.map(tool => tool.function.name), ['render_cruse'], 'website_* tools must not be advertised');
      assert.doesNotMatch(body.messages[0].content, /Secret website capability|#save/);
      return completion({ content: `Visible prose.\n\`\`\`cruse-ui\n${JSON.stringify({ version: 1, components: [{ kind: 'action', id: 'save', action: ref, label: 'Save', arguments: {} }] })}\n\`\`\`` });
    };
    const input = editor({ cruse: true }, { actions: { module: 'https://untrusted.invalid/action.js', agentTools: ['save'] } });
    const result = await engine.runEditor(input, 'question');
    assert.equal(result.text, 'Visible prose.');
    assert.equal(result.presentation, null);
    assert.ok(result.presentationIssues.length);
    assert.equal(engine.actionPresentations.size, 0);
    assert.equal(modelCalls, 1);
    // Directly exercise the editor context's link path; bindings belong to its
    // fresh network only, never to localStorage or this site's mutable endpoint.
    const linked = editor({ link_slots: { helper: {} }, tools: [{ name: 'front', instructions: 'Editor.', tools: ['helper'] }] });
    const { network, llm } = engine._compileDefinition(linked.network, linked.manifest, linked.manifest.networks[0]);
    const ctx = engine._makeCtx({ network, llm, manifest: linked.manifest, composition: engine._turnBudget(), chain: [], isTop: false });
    engine.onLinkRequired = () => null;
    assert.equal(await ctx.resolveLink('helper'), null);
    network.setLink('helper', 'https://peer.invalid/helper');
    assert.equal(await ctx.resolveLink('helper'), 'https://peer.invalid/helper');
    assert.equal(engine._compileDefinition(linked.network, linked.manifest, linked.manifest.networks[0]).network.getLink('helper'), null);
    assert.deepEqual(storageAccess, []);
  });

  test(site + ': editor rejects unsupported capabilities and invalid definitions before contact', async t => {
    restoreFetch(t);
    globalThis.fetch = async () => assert.fail('invalid input contacted a site or provider');
    const engine = fixture();
    for (const [config, manifest, expected] of [
      [{}, { coded_tools: { bundle: 'code.js' } }, /coded tools/],
      [{ tools: [{ name: 'front', instructions: 'Code.', class: 'Code' }] }, {}, /coded tools/],
      [{ tools: [{ name: 'front', instructions: 'MCP.', tools: ['https://peer.invalid/mcp'] }] }, {}, /MCP/],
      [{ tools: [{ name: 'front', instructions: 'REST.', toolbox: 'get' }] }, {}, /toolbox/],
      [{ tools: [{ name: 'front', instructions: 'Answer.', tools: ['missing'] }] }, {}, /validation/],
      [{ max_execution_seconds: 0 }, {}, /validation/],
      [{ llm_config: { temperature: 3 } }, {}, /validation/],
    ]) {
      await assert.rejects(engine.runEditor(editor(config, manifest), 'question'), expected);
      assert.equal(engine.running, false);
    }
    await assert.rejects(engine.runEditor({ ...editor(), networkName: 'missing' }, 'question'), /Select a network/);
  });

  test(site + ': editor absolute peers require policy and consent even for the desk origin', async t => {
    restoreFetch(t);
    for (const target of ['https://peer.invalid/helper', base + '/helper']) {
      for (const outcome of ['blocked', 'decline', 'allow']) {
        const engine = fixture();
        const reads = [];
        let consent = 0;
        const publisher = target.slice(0, target.lastIndexOf('/'));
        engine.onConsent = info => {
          consent++;
          assert.equal(info.targetUrl, target);
          assert.deepEqual(reads, []);
          return outcome === 'decline' ? 'decline' : 'allow';
        };
        globalThis.fetch = async (url, options) => {
          if (options?.method === 'POST') {
            assert.equal(url, router + '/chat/completions');
            const body = JSON.parse(options.body);
            if (body.messages[0].content === 'Peer.') return completion({ content: 'Peer answer.' });
            if (!body.messages.some(m => m.role === 'tool')) return completion(call(body.tools[0].function.name));
            assert.match(body.messages.at(-1).content, outcome === 'allow' ? /Peer answer/ : outcome === 'decline' ? /declined/ : /Policy:/);
            return completion({ content: 'Final answer.' });
          }
          reads.push(String(url));
          assert.equal(consent, 1);
          const documents = {
            [publisher + '/agent-manifest.json']: { networks: [{ name: 'helper', hocon: './helper.json' }] },
            [publisher + '/helper.json']: { tools: [{ name: 'helper', instructions: 'Peer.', tools: [] }] },
            [publisher + '/links.json']: {},
          };
          assert.ok(Object.hasOwn(documents, url), String(url));
          return new Response(JSON.stringify(documents[url]));
        };
        const input = editor({ tools: [{ name: 'front', instructions: 'Editor.', tools: [target] }] },
          outcome === 'blocked' ? {} : { allowed_peers: [new URL(target).origin] });
        assert.equal((await engine.runEditor(input, 'question')).text, 'Final answer.');
        assert.equal(consent, outcome === 'blocked' ? 0 : 1);
        assert.equal(reads.length, outcome === 'allow' ? 3 : 0);
      }
    }
    // A links.json envelope supplies bindings, even when the slot is named networks.
    const linkedEngine = fixture();
    linkedEngine.onLinkRequired = () => assert.fail('provided binding must not prompt for a URL');
    linkedEngine.onConsent = info => { assert.equal(info.targetUrl, 'https://peer.invalid/helper'); return 'decline'; };
    globalThis.fetch = async (url, options) => {
      assert.equal(url, router + '/chat/completions');
      const body = JSON.parse(options.body);
      if (!body.messages.some(m => m.role === 'tool')) return completion(call('networks'));
      assert.match(body.messages.at(-1).content, /declined/);
      return completion({ content: 'Bound peer declined.' });
    };
    const linkedInput = editor({ link_slots: { networks: {} }, tools: [{ name: 'front', instructions: 'Linked.', tools: ['networks'] }] },
      { allowed_peers: ['https://peer.invalid'] });
    linkedInput.links = { version: 1, networks: { review_desk: { networks: 'https://peer.invalid/helper' } } };
    assert.equal((await linkedEngine.runEditor(linkedInput, 'question')).text, 'Bound peer declined.');
    globalThis.fetch = async () => assert.fail('relative peer contacted a site');
    await assert.rejects(fixture().runEditor(editor({ tools: [{ name: 'front', instructions: 'Relative.', tools: ['/helper'] }] }), 'question'), /publication base/);
  });

  test(site + ': editor keeps the desk deadline and aborts model waits deterministically', async t => {
    restoreFetch(t);
    t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 1700000000000 });
    const clock = t.mock.timers;
    const engine = fixture({ seconds: 2 });
    const entered = deferred();
    let modelSignal;
    globalThis.fetch = (url, options) => { modelSignal = options.signal; entered.resolve(); return new Promise(() => {}); };
    const operation = engine.runEditor(editor({ max_execution_seconds: 500 }), 'question');
    const rejected = assert.rejects(operation, error => error.code === 'EXECUTION_DEADLINE');
    await entered.promise;
    clock.tick(1999);
    await new Promise(setImmediate);
    assert.equal(modelSignal.aborted, false);
    assert.equal(engine.running, true);
    clock.tick(1);
    await rejected;
    assert.equal(modelSignal.aborted, true);
    assert.equal(engine.running, false);
  });

  test(site + ': editor and chat share cancellation and exclusive run ownership', async t => {
    restoreFetch(t);
    for (const first of ['editor', 'chat']) {
      const engine = fixture();
      const entered = deferred();
      const late = deferred();
      let modelSignal;
      globalThis.fetch = (_url, options) => { modelSignal = options.signal; entered.resolve(); return late.promise; };
      const states = [];
      const observe = event => { if (event.detail.kind === 'run') states.push([event.detail.phase, engine.running]); };
      engine.trace.addEventListener('event', observe);
      t.after(() => engine.trace.removeEventListener('event', observe));
      const controller = new AbortController();
      const operation = first === 'editor' ? engine.runEditor(editor(), 'question', { signal: controller.signal })
        : engine.runTurn('question', { signal: controller.signal });
      const rejected = assert.rejects(operation, /Stopped by visitor/);
      await entered.promise;
      assert.equal(engine.running, true);
      await assert.rejects(engine.runEditor(editor(), 'overlap'), /already active/);
      await assert.rejects(engine.runTurn('overlap'), /already active/);
      controller.abort(new Error('Stopped by visitor'));
      await rejected;
      assert.equal(modelSignal.aborted, true);
      assert.equal(engine.running, false);
      late.resolve(completion({ content: 'Late ignored answer.' }));
      await new Promise(setImmediate);
      assert.deepEqual(engine.history, []);
      assert.deepEqual(states, [['start', true], ['end', false]]);
    }
  });

  test(site + ': editor obeys desk step and invocation budgets and rejects keyless inference', async t => {
    restoreFetch(t);
    const engine = fixture({ maxSteps: 1 });
    let requests = 0;
    globalThis.fetch = async (_url, options) => {
      requests++;
      const body = JSON.parse(options.body);
      if (body.messages[0].content === 'Leaf.') return completion({ content: 'Leaf answer.' });
      return completion(call('leaf'));
    };
    await assert.rejects(engine.runEditor(editor({ max_steps: 100, tools: [
      { name: 'front', instructions: 'Front.', tools: ['leaf'] }, { name: 'leaf', instructions: 'Leaf.', tools: [] },
    ] }), 'question'), /max_steps \(1\)/);
    assert.equal(requests, 2);
    globalThis.fetch = async () => assert.fail('missing key must not contact provider');
    await assert.rejects(fixture({ key: '' }).runEditor(editor(), 'question'), /provider key is required/);
    // Multiple tool invocations consume the very same turn-wide agent budget.
    const budgetEngine = fixture();
    let composition;
    const makeCtx = budgetEngine._makeCtx.bind(budgetEngine);
    budgetEngine._makeCtx = options => { composition = options.composition; return makeCtx(options); };
    globalThis.fetch = async (_url, options) => {
      const body = JSON.parse(options.body);
      if (body.messages.some(m => m.role === 'tool')) {
        assert.match(body.messages.at(-1).content, /24 agent invocations/);
        return completion({ content: 'Budget enforced.' });
      }
      return completion({ tool_calls: Array.from({ length: 24 }, (_, i) => ({ index: i, id: 'leaf-' + i,
        type: 'function', function: { name: 'leaf', arguments: '{}' } })) });
    };
    // Leaf responses must finish; otherwise the fixture would recursively emit calls.
    const fetch = globalThis.fetch;
    globalThis.fetch = (url, options) => JSON.parse(options.body).messages[0].content === 'Leaf.'
      ? Promise.resolve(completion({ content: 'Leaf answer.' })) : fetch(url, options);
    assert.equal((await budgetEngine.runEditor(editor({ tools: [
      { name: 'front', instructions: 'Front.', tools: ['leaf'] }, { name: 'leaf', instructions: 'Leaf.', tools: [] },
    ] }), 'question')).text, 'Budget enforced.');
    assert.equal(composition.agentCalls, 24);
    assert.equal(composition.maxRemoteCalls, 4);
    assert.equal(composition.maxCallsPerPeer, 1);
  });
}
