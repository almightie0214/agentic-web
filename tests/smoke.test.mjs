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

test('smoke: Site A runtime entry point and license are present', async () => {
  for (const path of ['site-a/runtime/index.js', 'site-a/runtime/LICENSE.txt']) {
    const file = await stat(new URL(path, root));
    assert.ok(file.isFile(), `${path} must be a regular file`);
    assert.ok(file.size > 0, `${path} must not be empty`);
  }
});

test('smoke: Site A boot enables only the current runner contract', async (t) => {
  const entry = new URL('site-a/runtime/index.js?runner-contract', root).href;
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

test('smoke: Site A settings use only an explicit mock router', async (t) => {
  const { mountApp } = await import('../site-a/runtime/ui.js');
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
