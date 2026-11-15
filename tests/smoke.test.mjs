import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { registerHooks } from 'node:module';
import test from 'node:test';

const root = new URL('../', import.meta.url);

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

test('smoke: Site B BYOK uses only current tab settings and saved profiles', async (t) => {
  const { loadTabByokSetup, saveTabByokSetup, upsertByokProfile, getSelectedByokProfile } =
    await import('../site-b/runtime/byok.js');
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
