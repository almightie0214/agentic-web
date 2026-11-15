import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { registerHooks } from 'node:module';
import test from 'node:test';

const root = new URL('../', import.meta.url);

test('smoke: Site A publishes a resolved two-agent network with the read-only validator action', async () => {
  const manifest = await readJSON('site-a/agent-manifest.json');
  assert.equal(manifest.networks.length, 1);
  const [entry] = manifest.networks;
  assert.equal(entry.name, 'review_desk');
  assert.equal(entry.front_man, 'review_coordinator');
  assert.equal(entry.hocon, './review_desk.network.json');
  assert.deepEqual(manifest.llm_router, {
    base_url: 'https://api.otari.ai/api/v1', mock: false,
    byok_router: 'https://api.otari.ai/api/v1',
  });
  assert.equal(manifest.deployment.mode, 'static');
  assert.equal(manifest.peer_policy.mode, 'closed');
  assert.deepEqual(manifest.allowed_peers, []);
  assert.deepEqual(manifest.actions, {
    version: 1, module: './actions.js', agentTools: ['validate_network'],
  });
  assert.equal(manifest.coded_tools, undefined);

  const config = await readJSON(`site-a/${entry.hocon}`);
  assert.equal(config.llm_config.model_name, 'alibaba/qwen3.8-flash');
  assert.deepEqual(config.tools.map(agent => agent.name), ['review_coordinator', 'conformance_reviewer']);
  assert.ok(config.tools.some(agent => agent.name === entry.front_man), 'front_man must belong to tools');
  assert.deepEqual(config.tools[0].tools, ['conformance_reviewer']);
  assert.deepEqual(config.tools[1].tools, []);
  for (const agent of config.tools) {
    assert.ok(agent.instructions.trim());
    assert.ok(agent.function.description.trim());
    assert.deepEqual(agent.function.parameters.required, ['request']);
    assert.equal(agent.function.parameters.properties.request.type, 'string');
    assert.equal(agent.class, undefined);
    assert.equal(agent.toolbox, undefined);
  }
  const checkResolved = value => {
    if (typeof value === 'string') assert.doesNotMatch(value, /\$\{/);
    else if (value && typeof value === 'object') {
      for (const [key, child] of Object.entries(value)) {
        assert.ok(!['include', 'env'].includes(key), `unresolved directive: ${key}`);
        checkResolved(child);
      }
    }
  };
  checkResolved(config);
  const { AgentNetwork, validateNetwork } = await import('../site-a/runtime/kernel.js');
  const network = new AgentNetwork(config, entry.name);
  assert.equal(network.findFrontMan(), entry.front_man);
  assert.deepEqual(validateNetwork(network), { errors: [], warnings: [], externals: [], mcps: [] });
  for (const agent of config.tools) {
    assert.equal(network.getAgentSpec(agent.name).llm_config.model_name, 'alibaba/qwen3.8-flash');
  }
});

test('smoke: Site A runtime loads artifacts under a site subpath and rejects failures', async t => {
  const { Engine } = await import('../site-a/runtime/engine.js');
  const manifest = await readJSON('site-a/agent-manifest.json');
  const config = await readJSON('site-a/review_desk.network.json');
  const originals = new Map(['fetch', 'location'].map(name =>
    [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  t.after(() => {
    for (const [name, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  });
  Object.defineProperty(globalThis, 'location', {
    configurable: true, value: new URL('https://example.test/agentic-web/site-a/'),
  });
  // Node cannot import HTTPS modules. Map only the declared module boundary to
  // the real local action; keep manifest resolution and registration unchanged.
  const hooks = registerHooks({
    resolve(specifier, context, nextResolve) {
      if (specifier === 'https://example.test/agentic-web/site-a/actions.js') {
        return { url: new URL('site-a/actions.js', root).href, shortCircuit: true };
      }
      return nextResolve(specifier, context);
    },
  });
  t.after(() => hooks.deregister());
  for (const scenario of ['valid', 'missing manifest', 'missing network', 'invalid JSON', 'invalid graph']) {
    await t.test(scenario, async () => {
      const base = 'https://example.test/agentic-web/site-a';
      const requests = [];
      globalThis.fetch = async (url, options) => {
        requests.push(String(url));
        assert.equal(options?.headers?.Authorization, undefined);
        if (url === `${base}/agent-manifest.json`) {
          return new Response(JSON.stringify(manifest), { status: scenario === 'missing manifest' ? 404 : 200 });
        }
        if (url === `${base}/./review_desk.network.json`) {
          const data = structuredClone(config);
          if (scenario === 'invalid graph') data.tools[0].tools = ['missing_reviewer'];
          return new Response(scenario === 'invalid JSON' ? '{' : JSON.stringify(data), {
            status: scenario === 'missing network' ? 404 : 200,
          });
        }
        assert.equal(url, `${base}/links.json`, 'only site-relative public artifacts should be fetched');
        return new Response('', { status: 404 });
      };
      const engine = new Engine({ originUrl: `${base}/`, sandboxWorkerUrl: `${base}/runtime/sandbox-worker.js` });
      if (scenario === 'valid') {
        const { network } = await engine.loadTop();
        assert.equal(network.findFrontMan(), 'review_coordinator');
        assert.equal(engine.top.llm.baseUrl, 'https://api.otari.ai/api/v1');
        assert.equal(engine.mockLLM, false);
        const [action] = engine.actions.catalog({ base, network: network.name });
        assert.equal(engine.actions.catalog({ base, network: network.name }).length, 1);
        assert.equal(action.ref, `${base}/review_desk#validate_network`);
        assert.equal(action.effect, 'read');
        assert.equal(action.availability, 'local-only');
        assert.deepEqual(engine.actions.discoveryIssues, []);
        await checkReviewWiring(engine);
        assert.deepEqual(requests, [`${base}/agent-manifest.json`, `${base}/./review_desk.network.json`, `${base}/links.json`]);
      } else {
        const error = {
          'missing manifest': /manifest fetch 404/,
          'missing network': /fetch 404/,
          'invalid JSON': /parse|syntax|unexpected/i,
          'invalid graph': /failed validation.*missing_reviewer/,
        }[scenario];
        await assert.rejects(engine.loadTop(), error);
      }
    });
  }
});

// Exercise the published instructions and real tool dispatch with a scripted
// model, not a live provider. This checks wiring, not model obedience.
async function checkReviewWiring(engine) {
  const { runAgent } = await import('../site-a/runtime/runner.js');
  const { fixtures } = await import('./fixtures.mjs');
  const { validateNetwork } = await import('../site-a/validator-rules.mjs');
  const { network, manifest, base } = engine.top;
  for (const scenario of ['valid', 'bad-frontman', 'invalid JSON', 'missing artifacts']) {
    const input = fixtures[scenario === 'bad-frontman' ? scenario : 'valid'];
    const args = { manifest: JSON.stringify(input.manifest), network: JSON.stringify(input.network) };
    if (scenario === 'invalid JSON') args.network = '{';
    const visited = [];
    const call = (name, args) => ({ content: '', toolCalls: [{
      id: name, type: 'function', function: { name, arguments: JSON.stringify(args) },
    }] });
    const llm = {
      async chat({ messages, tools }) {
        const system = messages[0].content;
        const coordinator = system.startsWith('You coordinate');
        const agent = coordinator ? 'review_coordinator' : 'conformance_reviewer';
        visited.push(agent);
        const names = tools.map(tool => tool.function.name);
        assert.ok(names.includes('website_validate_network'), 'manifest opt-in must expose the registered action');
        assert.doesNotMatch(system, /No site actions|You have no actions|No browser actions are registered/);
        assert.match(system, /Respond in English/);
        assert.match(system, /untrusted/);
        const result = messages.findLast(message => message.role === 'tool');
        if (coordinator) {
          assert.ok(names.includes('conformance_reviewer'));
          assert.match(system, /Route every conformance question to conformance_reviewer/);
          assert.match(system, /Summarize only report-backed findings/);
          assert.match(system, /no successful action report.*validation has not completed/);
          if (!result) return call('conformance_reviewer', { request: messages.at(-1).content });
          assert.equal(JSON.parse(result.content).text, 'Scripted reviewer response.');
          return { content: 'Scripted coordinator response.', toolCalls: [] };
        }
        assert.match(system, /rules decide conformance and you only explain/);
        assert.match(system, /Use only a successful validate_network action report for the current artifacts/);
        assert.match(system, /call website_validate_network/);
        assert.match(system, /complete JSON-encoded strings, not objects, URLs, or HOCON/);
        assert.match(system, /do not turn an action error into a rule failure or invent a successful report/);
        assert.match(system, /ruleId, status, JSON Pointer path, message, and hint/);
        assert.match(system, /Preserve pass, fail, warning, and unverified as distinct statuses/);
        assert.match(system, /valid:true is not certification/);
        assert.match(system, /Ask for missing artifacts/);
        if (scenario === 'missing artifacts') {
          assert.equal(result, undefined, 'no report or action completion may be assumed without inputs');
        } else if (!result) {
          return call('website_validate_network', args);
        } else {
          const receipt = JSON.parse(result.content);
          if (scenario === 'invalid JSON') {
            assert.equal(receipt.status, 'unknown');
            assert.match(receipt.error, /Invalid JSON in network/);
            assert.equal(receipt.result, undefined, 'action errors are not rule reports');
          } else {
            assert.equal(receipt.status, 'succeeded');
            assert.deepEqual(receipt.result, validateNetwork({ manifest: input.manifest, network: input.network }));
            assert.equal(receipt.result.valid, scenario === 'valid');
            for (const status of ['warning', 'unverified']) {
              assert.ok(receipt.result.checks.some(check => check.status === status));
            }
          }
        }
        return { content: 'Scripted reviewer response.', toolCalls: [] };
      },
    };
    const response = await runAgent({ network, manifest, actions: engine.actions, llm,
      baseOrigin: base, displayOrigin: base, isTop: true,
      frontMan: network.findFrontMan(), trace: engine.trace, slyData: {},
    }, network.findFrontMan(), scenario === 'missing artifacts' ? 'Please review; no artifacts supplied.' : JSON.stringify(args), null, []);
    assert.equal(response.text, 'Scripted coordinator response.');
    assert.deepEqual(visited, ['review_coordinator', 'conformance_reviewer',
      ...(scenario === 'missing artifacts' ? [] : ['conformance_reviewer']), 'review_coordinator']);
  }
}

test('smoke: Site A boot shows the desk only after success and reports failures', async t => {
  const originals = new Map(['document', '__siteABoot'].map(name =>
    [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  t.after(() => {
    for (const [name, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  });
  const hooks = registerHooks({
    resolve(specifier, context, nextResolve) {
      if (context.parentURL?.startsWith(new URL('site-a/site.js?', root).href) && specifier === './runtime/index.js') {
        return { url: 'data:text/javascript,export async function boot(root, opts) { return await globalThis.__siteABoot(root, opts); }', shortCircuit: true };
      }
      return nextResolve(specifier, context);
    },
  });
  t.after(() => hooks.deregister());
  const html = await readFile(new URL('site-a/index.html', root), 'utf8');
  assert.match(html, /<section[^>]*id="agent-app"[^>]* hidden>/);
  for (const slot of ['header', 'agents']) {
    assert.match(html, new RegExp(`<div data-ns-slot="${slot}"></div>`));
  }
  for (const failure of [false, true]) {
    const element = () => ({
      hidden: false, value: '', dataset: {}, children: [],
      setAttribute(name, value) { this[name] = value; },
      append(...nodes) { this.children.push(...nodes); },
      replaceChildren(...nodes) { this.children = nodes; },
      addEventListener() {},
    });
    const elements = new Map([...html.matchAll(/id="([^"]+)"/g)].map(match => [`#${match[1]}`, element()]));
    const app = elements.get('#agent-app');
    app.hidden = true;
    const status = elements.get('#site-status');
    globalThis.document = {
      querySelector: selector => elements.get(selector) ?? null,
      querySelectorAll: () => [], createElement: element,
    };
    const calls = [];
    const entered = Promise.withResolvers();
    const loaded = Promise.withResolvers();
    globalThis.__siteABoot = async (mount, options) => {
      calls.push({ mount, options, hidden: app.hidden });
      entered.resolve();
      await loaded.promise;
      if (failure) throw new Error('Network load failed');
      const trace = new EventTarget();
      trace.events = [];
      const { AgentNetwork } = await import('../site-a/runtime/kernel.js');
      return { engine: { top: {
        base: new URL('site-a/', root).href.replace(/\/$/, ''),
        manifest: await readJSON('site-a/agent-manifest.json'),
        network: new AgentNetwork(await readJSON('site-a/review_desk.network.json'), 'review_desk'),
      } }, trace, actions: { register() {} } };
    };
    const importing = import(new URL(`site-a/site.js?boot-${failure}`, root));
    await entered.promise;
    assert.equal(app.hidden, true, 'the desk must remain hidden while boot is pending');
    loaded.resolve();
    await importing;
    assert.deepEqual(calls, [{
      mount: app, hidden: true,
      options: {
        originUrl: new URL('site-a/', root).href,
        sandboxWorkerUrl: new URL('site-a/runtime/sandbox-worker.js', root).href,
      },
    }]);
    assert.equal(app.hidden, failure);
    if (failure) {
      assert.equal(status.role, 'alert');
      assert.equal(status.dataset.state, 'error');
      assert.match(status.textContent, /could not be loaded/);
      assert.match(status.textContent, /agent-manifest\.json/);
    } else {
      assert.match(status.textContent, /Review Desk is ready/);
      assert.match(status.textContent, /provider key/);
    }
  }
});

async function readJSON(path) {
  return JSON.parse(await readFile(new URL(path, root), 'utf8'));
}

test('smoke: merge gate and npm test use the test file glob', async () => {
  const [gate, packageJSON] = await Promise.all([
    readJSON('theora.gate.json'),
    readJSON('package.json'),
  ]);

  assert.deepEqual(gate, {
    commands: [['node', '--test', 'tests/**/*.test.mjs']],
    timeout: '5m',
  });
  assert.equal(packageJSON.scripts.test, 'node --test "tests/**/*.test.mjs"');
});

function runtimeTest(name, check) {
  for (const site of ['A', 'B']) {
    const runtime = new URL(`site-${site.toLowerCase()}/runtime/`, root);
    test(`smoke: Site ${site} ${name}`, t => check(t, runtime));
  }
}

runtimeTest('runtime entry point and license are present', async (_t, runtime) => {
  for (const path of ['index.js', 'LICENSE.txt']) {
    const file = await stat(new URL(path, runtime));
    assert.ok(file.isFile(), `${path} must be a regular file`);
    assert.ok(file.size > 0, `${path} must not be empty`);
  }
});

runtimeTest('boot enables only the current runner contract', async (t, runtime) => {
  const entry = new URL('index.js?runner-contract', runtime).href;
  const modules = {
    './engine.js': `export class Engine {
      actions = { catalog: () => [], discoveryIssues: [] };
      top = { base: 'https://example.test/desk/', network: { name: 'test' } };
      async enableLangChain() { this.langChainEnabled = true; }
    }`,
    './trace.js': 'export class TraceBus {}',
    './ui.js': 'export function mountApp() {}',
    './byok.js': `export function getSelectedByokProfile() { return null; }
      export function loadTabByokSetup() { return {}; }`,
    './kernel.js': 'export class AgentNetwork {}; export function validateNetwork() {}; export const ChatMessageType = {};',
    './hocon.js': 'export function parseHocon() {}',
    './actions.js': 'export class ActionRegistry {}',
  };
  const hooks = registerHooks({
    resolve(specifier, context, nextResolve) {
      if (context.parentURL === entry && Object.hasOwn(modules, specifier)) {
        return { url: `data:text/javascript,${encodeURIComponent(modules[specifier])}`, shortCircuit: true };
      }
      return nextResolve(specifier, context);
    },
  });
  t.after(() => hooks.deregister());
  const { boot, Engine } = await import(entry);

  const originalGlobals = new Map(['document', 'location'].map(name =>
    [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  t.after(() => {
    for (const [name, descriptor] of originalGlobals) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  });
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { createElement: () => ({ style: {}, append() {} }) },
  });
  const mount = { setAttribute() {}, querySelector() { return null; }, prepend() {} };

  for (const source of ['opts', 'url']) {
    for (const runner of [undefined, 'langchain', 'langgraph']) {
      for (const mode of [undefined, 'static']) {
        const label = `${source}, runner=${runner}, mode=${mode}`;
        const location = new URL('https://example.test/desk/');
        if (source === 'url' && runner) location.searchParams.set('runner', runner);
        Object.defineProperty(globalThis, 'location', { configurable: true, value: location });
        Engine.prototype.loadTop = async () => ({ manifest: mode ? { deployment: { mode } } : {} });
        const { engine } = await boot(mount, source === 'opts' ? { runner } : {});
        assert.equal(!!engine.langChainEnabled, runner === 'langchain' && mode !== 'static', label);
      }
    }
  }
});

runtimeTest('settings use only an explicit mock router', async (t, runtime) => {
  const { mountApp } = await import(new URL('ui.js', runtime));
  const originalGlobals = new Map(['document', 'location'].map(name =>
    [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  t.after(() => {
    for (const [name, descriptor] of originalGlobals) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  });
  // A minimal DOM boundary records the Provider URL written by the real UI.
  const element = () => ({
    value: '', dataset: {}, style: {}, classList: { toggle() {} },
    appendChild() {}, addEventListener() {}, getAttribute() { return null; },
  });
  Object.defineProperty(globalThis, 'document', {
    configurable: true, value: { createElement: element, head: element() },
  });
  Object.defineProperty(globalThis, 'location', {
    configurable: true, value: new URL('https://example.test/desk/'),
  });
  const explicit = 'https://mock.example.test/v1';
  const old = { mock: true, base_url: 'https://old.example.test/v1' };
  for (const [llm_router, applied, expected] of [
    [{ mock_router: explicit }, {}, explicit],
    [undefined, {}, ''],
    [old, {}, ''],
    [{ ...old, mock_router: explicit }, {}, explicit],
    [{ mock_router: explicit }, { byokRouter: 'https://byok.example.test/v1' }, 'https://byok.example.test/v1'],
    [{ mock_router: explicit }, { top: { llm: { baseUrl: 'https://configured.example.test/v1' } } }, 'https://configured.example.test/v1'],
    [{ mock_router: explicit }, { routerOverride: 'https://chosen.example.test/v1' }, 'https://chosen.example.test/v1'],
  ]) {
    const fields = new Map();
    const root = {
      removeAttribute() {}, querySelectorAll() { return []; },
      querySelector(selector) {
        if (selector.startsWith('[data-ns-slot=') || selector === '#ns-split') return null;
        if (!fields.has(selector)) fields.set(selector, element());
        return fields.get(selector);
      },
    };
    mountApp(root, { engine: { ...applied }, trace: new EventTarget(), manifest: { llm_router } });
    assert.equal(fields.get('#ns-router').value, expected, JSON.stringify({ llm_router, applied }));
  }
});

runtimeTest('confirm widgets require explicit confirmText', async (_t, runtime) => {
  const { normalizePresentation, parseAgentResponse } = await import(new URL('cruse.js', runtime));
  for (const component of [
    { kind: 'confirm', confirmText: 'Proceed with the review.', confirmLabel: 'Proceed' },
    { kind: 'confirm', confirmText: 'Proceed with the review.' },
    { kind: 'confirm', confirmLabel: 'Proceed' },
    { kind: 'confirm' },
    { kind: 'confirm', confirmText: '', confirmLabel: 'Proceed' },
    { kind: 'confirm', confirmText: '   ', confirmLabel: 'Proceed' },
    { kind: 'confirm', confirmText: null, confirmLabel: 'Proceed' },
  ]) {
    const input = { version: 1, components: [component] };
    const normalized = normalizePresentation(input);
    const json = JSON.stringify(input);
    const parsed = [parseAgentResponse(json), parseAgentResponse(`\`\`\`cruse-ui\n${json}\n\`\`\``)];
    const valid = typeof component.confirmText === 'string' && !!component.confirmText.trim();
    for (const result of [normalized, ...parsed]) {
      if (valid) {
        assert.equal(result.presentation.components.length, 1);
        assert.equal(result.presentation.components[0].confirmText, component.confirmText);
        assert.equal(result.presentation.components[0].confirmLabel, component.confirmLabel);
      } else {
        assert.equal(result.presentation, null, json);
        assert.ok((result.issues || result.presentationIssues).length > 0, json);
      }
    }
  }
});

runtimeTest('welcome and response widgets share confirmation validation', async (t, runtime) => {
  const { mountApp, renderPresentation } = await import(new URL('ui.js', runtime));
  const originals = new Map(['document', 'location', 'requestAnimationFrame'].map(name =>
    [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  t.after(() => {
    for (const [name, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  });
  // Record DOM writes and events without replacing runtime rendering or validation.
  const element = () => ({
    value: '', innerHTML: '', dataset: {}, style: {}, children: [], fields: new Map(), events: new Map(),
    classList: { add() {}, toggle() {} },
    setAttribute() {}, removeAttribute() {}, getAttribute() { return null; }, closest() { return null; },
    append(...nodes) { for (const node of nodes) this.appendChild(node); },
    appendChild(node) { node.parentElement = this; this.children.push(node); },
    replaceChildren() { this.children = []; },
    remove() { this.parentElement.children = this.parentElement.children.filter(node => node !== this); },
    addEventListener(name, fn) { this.events.set(name, fn); },
    querySelectorAll(selector) { return selector === 'button,input,select,textarea' ? [...this.fields.values()] : []; },
    querySelector(selector) {
      if (selector.startsWith('[data-ns-slot=') || selector === '#ns-split') return null;
      if (selector === '[data-welcome="true"]') return this.children.find(node => node.dataset.welcome === 'true');
      if (!this.fields.has(selector)) this.fields.set(selector, element());
      return this.fields.get(selector);
    },
  });
  Object.defineProperty(globalThis, 'document', {
    configurable: true, value: { createElement: element, head: element() },
  });
  Object.defineProperty(globalThis, 'location', {
    configurable: true, value: new URL('https://example.test/desk/'),
  });
  Object.defineProperty(globalThis, 'requestAnimationFrame', { configurable: true, value: fn => fn() });
  const mount = (widget) => {
    const root = element();
    const submitted = [];
    const engine = {
      mockLLM: true, resetHistory() {},
      async *streamTurn(text) {
        submitted.push(text);
        yield { type: 'turn.completed', result: { text: '', presentation: null } };
      },
    };
    mountApp(root, { engine, trace: new EventTarget(), manifest: { welcome: { widget, message: 'Welcome to the review desk.' } } });
    const msgs = root.querySelector('#ns-msgs');
    return { root, msgs, submitted, cards: msgs.children.filter(node => node.className === 'ns-widget') };
  };
  for (const confirmText of [undefined, '', '   ', null, 42]) {
    const { root, cards, submitted } = mount({ kind: 'confirm', confirmText, confirmLabel: 'Proceed' });
    assert.equal(cards.length, 0, `invalid confirmText: ${confirmText}`);
    assert.deepEqual(submitted, []);
    root.querySelector('#ns-input').value = 'Continue chatting.';
    await root.querySelector('#ns-send').events.get('click')();
    assert.deepEqual(submitted, ['Continue chatting.']);
  }
  const current = { kind: 'confirm', confirmText: 'Submit this review.', confirmLabel: 'Proceed' };
  const { root, msgs, cards: [card], submitted } = mount(current);
  assert.equal(card.dataset.welcome, 'true');
  assert.equal(card.dataset.componentId, 'welcome');
  assert.match(card.innerHTML, /data-act="confirm">Proceed<\/button>/);
  assert.equal(msgs.querySelector('.ns-msg.bot').textContent, 'Welcome to the review desk.');
  await card.querySelector('[data-act="confirm"]').events.get('click')();
  assert.deepEqual(submitted, ['Submit this review.']);
  assert.equal(card.querySelector('[data-act="confirm"]').disabled, true);
  root.querySelector('#ns-newchat').events.get('click')();
  assert.ok(msgs.children.includes(card));
  assert.equal(card.querySelector('[data-act="confirm"]').disabled, false);

  const { cards: [defaultLabel] } = mount({ kind: 'confirm', confirmText: 'Continue.' });
  assert.match(defaultLabel.innerHTML, /data-act="confirm">Confirm<\/button>/);
  const { cards: [cancelCard], submitted: cancelled } = mount(current);
  await cancelCard.querySelector('[data-act="cancel"]').events.get('click')();
  assert.deepEqual(cancelled, ['Not yet, hold off.']);

  const form = mount({ kind: 'form', schema: { properties: { topic: { type: 'string' } } } });
  const [formCard] = form.cards;
  assert.equal(formCard.dataset.welcome, 'true');
  assert.equal(formCard.querySelector('[data-field="f0"]').id, 'welcome-welcome-f0');
  formCard.querySelector('[data-field="f0"]').value = 'Runtime';
  await formCard.querySelector('form').events.get('submit')({ preventDefault() {} });
  assert.deepEqual(form.submitted, ['topic: Runtime']);

  const container = element();
  const responseText = [];
  renderPresentation(container, { version: 1, components: [current] }, text => responseText.push(text), 'turn-1');
  const responseCard = container.children[0].children[0];
  assert.match(responseCard.innerHTML, /data-act="confirm">Proceed<\/button>/);
  await responseCard.querySelector('[data-act="confirm"]').events.get('click')();
  assert.deepEqual(responseText, ['Submit this review.']);
});

runtimeTest('BYOK uses only current tab settings and saved profiles', async (t, runtime) => {
  const { loadTabByokSetup, saveTabByokSetup, upsertByokProfile, getSelectedByokProfile } =
    await import(new URL('byok.js', runtime));
  const originals = new Map(['sessionStorage', 'localStorage', 'location'].map(name =>
    [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  t.after(() => {
    for (const [name, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  });
  const sessionItems = new Map();
  const sessionAccess = [];
  let failWrite = '';
  const storage = (items, access = []) => ({
    getItem(name) { access.push(['get', name]); return items.get(name) ?? null; },
    setItem(name, value) {
      access.push(['set', name]);
      if (name === failWrite) throw new Error('Storage write failed');
      items.set(name, String(value));
    },
    removeItem(name) { access.push(['remove', name]); items.delete(name); },
  });
  for (const [name, value] of Object.entries({
    sessionStorage: storage(sessionItems, sessionAccess),
    localStorage: storage(new Map()),
    location: new URL('https://example.test/scout/'),
  })) Object.defineProperty(globalThis, name, { configurable: true, value });
  const profile = { key: 'test-profile-key', router: 'https://provider.example.test/v1', model: 'profile-model' };
  const legacySlot = 'nsweb-byok-key';

  await t.test('obsolete standalone keys never override a profile or supply a key', () => {
    sessionItems.set(legacySlot, 'obsolete-test-key');
    assert.deepEqual(loadTabByokSetup(null), { key: '', router: '', model: '' });
    assert.deepEqual(loadTabByokSetup(profile), profile);
    assert.ok(sessionAccess.every(([, name]) => name !== legacySlot));
  });

  await t.test('current profiles and tab settings round-trip without touching the obsolete slot', () => {
    sessionItems.clear();
    sessionAccess.length = 0;
    upsertByokProfile({ ...profile, id: 'test-profile', name: 'Test provider' });
    assert.deepEqual(getSelectedByokProfile(), {
      ...profile, id: 'test-profile', name: 'Test provider', runner: false,
      updatedAt: getSelectedByokProfile().updatedAt,
    });
    assert.deepEqual(loadTabByokSetup(), profile);
    const tab = { key: 'test-tab-key', router: 'https://tab.example.test/v1', model: 'tab-model' };
    saveTabByokSetup(tab);
    assert.deepEqual(Object.fromEntries(sessionItems), {
      'nsweb-byok-tab-key': tab.key, 'nsweb-byok-model': tab.model, 'nsweb-byok-router': tab.router,
    });
    assert.deepEqual(loadTabByokSetup(), tab);
    assert.equal(getSelectedByokProfile().key, profile.key);
    saveTabByokSetup({ key: 'test-empty-router-key' });
    assert.deepEqual(loadTabByokSetup(), { key: 'test-empty-router-key', router: '', model: '' });
    saveTabByokSetup(null);
    assert.equal(sessionItems.size, 0);
    assert.deepEqual(loadTabByokSetup(), profile);
    failWrite = 'nsweb-byok-router';
    saveTabByokSetup(tab);
    assert.equal(sessionItems.size, 0, 'failed writes must not leave a partial tab setup');
    assert.deepEqual(loadTabByokSetup(), profile);
    assert.ok(sessionAccess.every(([, name]) => name !== legacySlot));
  });
});

runtimeTest('composed UI leaves retired activity slots untouched', async (t, runtime) => {
  const { mountApp } = await import(new URL('ui.js', runtime));
  const originals = new Map(['document', 'location'].map(name =>
    [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  t.after(() => {
    for (const [name, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  });
  const element = () => ({
    value: '', innerHTML: '', hidden: false, dataset: {}, style: {}, fields: new Map(),
    classList: { add() {}, toggle() {} },
    appendChild() {}, insertAdjacentHTML() {}, addEventListener() {},
    getAttribute() { return null; }, closest() { return null; },
    querySelectorAll() { return []; },
    querySelector(selector) {
      if (selector === '#ns-split') return null;
      if (!this.fields.has(selector)) this.fields.set(selector, element());
      return this.fields.get(selector);
    },
  });
  const styles = [];
  Object.defineProperty(globalThis, 'document', {
    configurable: true, value: { createElement: element, head: { appendChild(style) { styles.push(style); } } },
  });
  Object.defineProperty(globalThis, 'location', {
    configurable: true, value: new URL('https://example.test/desk/'),
  });
  const root = element();
  const chat = root.querySelector('[data-ns-slot="chat"]');
  const agents = root.querySelector('[data-ns-slot="agents"]');
  const settings = root.querySelector('[data-ns-slot="settings"]');
  const activity = root.querySelector('[data-ns-slot="activity"]');
  activity.innerHTML = 'Host-owned content';
  mountApp(root, { engine: { mockLLM: true }, trace: new EventTarget(), manifest: {} });
  assert.equal(root.dataset.nsLayout, 'composed');
  assert.match(chat.innerHTML, /id="ns-msgs"/);
  assert.match(agents.innerHTML, /id="ns-anodes"/);
  assert.match(settings.innerHTML, /id="ns-key"/);
  assert.equal(activity.innerHTML, 'Host-owned content');
  assert.equal(activity.hidden, false);
  assert.doesNotMatch(styles[0].textContent, /\[data-ns-slot="activity"\]/);
});

test('smoke: Site B boot loads the published network unchanged and reports failures', async (t) => {
  const html = await readFile(new URL('site-b/index.html', root), 'utf8');
  assert.match(html, /<html lang="en">/);
  assert.match(html, /<script type="module" src="\.\/site\.js"><\/script>/);
  assert.doesNotMatch(html, /(?:src|href)="(?:\/|https?:|\.\.\/site-a)/);
  assert.match(html, /<noscript>/);
  assert.match(html, /<section id="agent-app"[^>]*aria-describedby="site-status"[^>]* hidden>/);
  assert.match(html, /id="site-status"[^>]*role="status"/);
  for (const slot of ['header', 'agents']) {
    assert.match(html, new RegExp(`data-ns-slot="${slot}" hidden inert`));
  }
  const originals = new Map(['document', 'location', 'history', 'window', 'sessionStorage', 'localStorage', 'fetch']
    .map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  t.after(() => {
    for (const [name, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  });
  const setGlobal = (name, value) => Object.defineProperty(globalThis, name, { configurable: true, value });
  const element = () => ({
    value: '', innerHTML: '', hidden: false, disabled: false, dataset: {}, style: {}, fields: new Map(), attributes: new Map(),
    classList: { add() {}, toggle() {} },
    appendChild() {}, append() {}, prepend() {}, insertAdjacentHTML() {}, addEventListener() {},
    setAttribute(name, value) { this.attributes.set(name, value); },
    getAttribute(name) { return this.attributes.get(name) ?? null; },
    closest() { return null; }, querySelectorAll() { return []; },
    querySelector(selector) {
      if (selector === '#ns-split') return null;
      if (!this.fields.has(selector)) this.fields.set(selector, element());
      return this.fields.get(selector);
    },
  });
  const runtime = new URL('site-b/runtime/', root);
  const manifest = await readJSON('site-b/agent-manifest.json');
  const config = await readJSON('site-b/spec_scout.network.json');
  const base = new URL('site-b/', root).href.replace(/\/$/, '');
  // Keep real compilation and UI mounting; record constructed engines only.
  const observedEngine = `import { Engine as RuntimeEngine } from ${JSON.stringify(new URL('engine.js', runtime).href)};
    export class Engine extends RuntimeEngine {
      static instances = [];
      constructor(options) { super(options); Engine.instances.push(this); }
    }`;
  const engineURL = `data:text/javascript,${encodeURIComponent(observedEngine)}`;
  const { Engine } = await import(engineURL);
  const hooks = registerHooks({
    resolve(specifier, context, nextResolve) {
      if (specifier === './engine.js' && context.parentURL === new URL('index.js', runtime).href) {
        return { url: engineURL, shortCircuit: true };
      }
      if (specifier === './runtime/index.js' && context.parentURL?.endsWith('?shell-failure')) {
        return { url: 'data:text/javascript,throw new Error("Runtime unavailable")', shortCircuit: true };
      }
      return nextResolve(specifier, context);
    },
  });
  t.after(() => hooks.deregister());
  const { upsertByokProfile, saveTabByokSetup } = await import(new URL('byok.js', runtime));
  const profile = { key: 'test-profile-key', router: 'https://profile.example.test/v1', model: 'profile-model' };
  const tab = { key: 'test-tab-key', router: 'https://tab.example.test/v1', model: 'tab-model' };

  for (const scenario of ['empty', 'profile', 'tab', 'missing manifest', 'missing network', 'invalid JSON', 'invalid graph', 'failure']) {
    await t.test(scenario, async () => {
      const app = element();
      app.hidden = true;
      for (const slot of ['header', 'agents', 'chat', 'settings']) {
        assert.match(html, new RegExp(`data-ns-slot="${slot}"`));
      }
      const status = element();
      const storage = () => {
        const values = new Map();
        return { getItem: name => values.get(name) ?? null,
          setItem: (name, value) => values.set(name, String(value)), removeItem: name => values.delete(name) };
      };
      const requests = [];
      let replaced;
      setGlobal('document', { head: element(), createElement: element,
        querySelector: selector => selector === '#agent-app' ? app : status });
      setGlobal('location', new URL('https://example.test/nested/scout/?key=url-secret&key=duplicate&router=https%3A%2F%2Funtrusted.test&model=url-model&keep=yes#chat'));
      setGlobal('history', { replaceState(_state, _title, url) { replaced = url; } });
      setGlobal('localStorage', storage());
      setGlobal('sessionStorage', storage());
      setGlobal('window', { localStorage });
      const entered = Promise.withResolvers();
      const loaded = Promise.withResolvers();
      setGlobal('fetch', async (url, options) => {
        requests.push(String(url));
        assert.equal(options?.headers?.Authorization, undefined, 'artifact requests must not carry a provider key');
        if (url === `${base}/agent-manifest.json`) {
          entered.resolve();
          await loaded.promise;
          return new Response(JSON.stringify(manifest), { status: scenario === 'missing manifest' ? 404 : 200 });
        }
        if (url === `${base}/./spec_scout.network.json`) {
          const data = structuredClone(config);
          if (scenario === 'invalid graph') data.tools[0].tools = ['missing_agent'];
          return new Response(scenario === 'invalid JSON' ? '{' : JSON.stringify(data), {
            status: scenario === 'missing network' ? 404 : 200,
          });
        }
        if ([`${base}/links.json`, 'https://profile.example.test/agent-manifest.json',
          'https://tab.example.test/agent-manifest.json'].includes(url)) {
          return new Response('', { status: 404 });
        }
        assert.fail(`Unexpected request (no authoring data or model call is needed during boot): ${url}`);
      });
      if (scenario === 'profile' || scenario === 'tab') upsertByokProfile({ ...profile, id: 'shell-profile', name: 'Test setup' });
      if (scenario === 'tab') saveTabByokSetup(tab);
      const previousCount = Engine.instances.length;
      const importing = import(new URL(`site-b/site.js?shell-${scenario}`, root));
      if (scenario !== 'failure') {
        await entered.promise;
        assert.equal(app.hidden, true, 'the app stays hidden while the manifest is loading');
        loaded.resolve();
      }
      await importing;
      const cleaned = new URL(replaced, location);
      assert.equal(cleaned.searchParams.has('key'), false);
      assert.equal(cleaned.searchParams.get('keep'), 'yes');
      assert.equal(cleaned.searchParams.get('router'), 'https://untrusted.test');
      assert.equal(cleaned.searchParams.get('model'), 'url-model');
      assert.equal(cleaned.pathname, location.pathname);
      assert.equal(cleaned.hash, '#chat');
      if (scenario === 'failure') {
        assert.equal(app.hidden, true);
        assert.equal(status.attributes.get('role'), 'alert');
        assert.equal(status.dataset.state, 'error');
        assert.match(status.textContent, /could not be loaded/);
        assert.match(status.textContent, /HTTP or HTTPS/);
        assert.doesNotMatch(status.textContent, /url-secret|duplicate/);
        assert.equal(Engine.instances.length, previousCount);
        assert.deepEqual(requests, []);
        return;
      }
      if (!['empty', 'profile', 'tab'].includes(scenario)) {
        assert.equal(app.hidden, true);
        assert.equal(status.attributes.get('role'), 'alert');
        assert.equal(status.dataset.state, 'error');
        assert.match(status.textContent, /could not be loaded/);
        assert.match(status.textContent, /HTTP or HTTPS/);
        assert.doesNotMatch(status.textContent, /url-secret|duplicate/);
        assert.match(status.textContent, /agent-manifest\.json/);
        assert.match(status.textContent, /network definition/);
        assert.equal(Engine.instances.length, previousCount + 1);
        return;
      }
      const engine = Engine.instances.at(-1);
      const expected = scenario === 'tab' ? tab : scenario === 'profile' ? profile : { key: '', router: '', model: '' };
      assert.equal(Engine.instances.length, previousCount + 1);
      assert.equal(engine.byokKey, expected.key);
      assert.equal(engine.routerOverride, expected.router);
      assert.equal(engine.modelOverride, expected.model);
      assert.equal(engine.originUrl, new URL('site-b/', root).href.replace(/\/$/, ''));
      assert.equal(engine.sandboxWorkerUrl, new URL('sandbox-worker.js', runtime).href);
      assert.equal(engine.top.network.name, 'spec_scout');
      assert.equal(engine.top.network.findFrontMan(), 'spec_scout');
      assert.equal(engine.top.network.getAgentSpec('spec_scout').instructions, config.tools[0].instructions,
        'embedded evidence must be used unchanged');
      assert.deepEqual(requests, [
        `${base}/agent-manifest.json`,
        ...(scenario === 'empty' ? [] : [`${new URL(expected.router).origin}/agent-manifest.json`]),
        `${base}/./spec_scout.network.json`, `${base}/links.json`,
      ], 'boot only retrieves runtime metadata, never authoring data or model responses');
      assert.equal(app.hidden, false);
      assert.equal(app.dataset.nsLayout, 'composed');
      const settings = app.querySelector('[data-ns-slot="settings"]').innerHTML;
      for (const id of ['ns-key', 'ns-router', 'ns-model', 'ns-model-options', 'ns-profile', 'ns-save-profile']) {
        assert.match(settings, new RegExp(`id="${id}"`));
      }
      assert.match(app.querySelector('[data-ns-slot="chat"]').innerHTML, /id="ns-msgs"/);
      assert.equal(app.querySelector('#ns-input').disabled, false);
      assert.equal(app.querySelector('#ns-send').disabled, false);
      assert.match(status.textContent, /Spec Scout is ready/);
      assert.match(status.textContent, /provider key/);
      assert.equal(app.querySelector('#ns-router').value, expected.router || manifest.llm_router.base_url);
      assert.equal(app.querySelector('#ns-model').value, expected.model);
      assert.equal(app.querySelector('#ns-key').value, expected.key);
    });
  }
});
