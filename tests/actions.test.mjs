import assert from 'node:assert/strict';
import test from 'node:test';
import { registerActions } from '../site-a/actions.js';
import { ActionRegistry } from '../site-a/runtime/actions.js';
import { validateNetwork } from '../site-a/validator-rules.mjs';
import { fixtures } from './fixtures.mjs';

const scope = { base: 'https://desk.example.test/agentic-web', network: 'review_desk' };

function registered() {
  const registry = new ActionRegistry();
  // The same scoped wrapper used by runtime/action-transport.js.
  registerActions({ register: definition => registry.register(scope, definition) });
  const catalog = registry.catalog(scope);
  assert.equal(catalog.length, 1);
  const [action] = catalog;
  const prepare = args => registry.prepare({
    kind: 'action', action: action.ref, arguments: args,
  });
  const execute = args => registry.execute(prepare(args), async () => true, 'review-test');
  return { registry, action, prepare, execute };
}

function argumentsFor({ manifest, network, links, ...context }) {
  return {
    manifest: JSON.stringify(manifest),
    network: JSON.stringify(network),
    ...(links === undefined ? {} : { links: JSON.stringify(links) }),
    ...context,
  };
}

test('actions: validate_network registers a local read-only capability with a usable input schema', () => {
  const { action } = registered();
  assert.equal(action.ref, `${scope.base}/${scope.network}#validate_network`);
  assert.equal(action.name, 'validate_network');
  assert.ok(action.description.trim());
  assert.equal(action.effect, 'read');
  assert.equal(action.availability, 'local-only');
  assert.equal(action.inputSchema.type, 'object');
  assert.equal(action.inputSchema.additionalProperties, false);
  assert.deepEqual(action.inputSchema.required, ['manifest', 'network']);
  for (const field of ['manifest', 'network', 'links', 'networkName', 'baseUrl']) {
    assert.equal(action.inputSchema.properties[field].type, 'string');
  }
  assert.equal(action.inputSchema.properties.activePeerChain.type, 'array');
  assert.equal(action.inputSchema.properties.activePeerChain.items.type, 'string');
});

test('actions: fixture receipts equal rule reports without input mutation or external I/O', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', () => { throw new Error('No fetching in static validation.'); });
  let externalAccesses = 0;
  for (const name of ['localStorage', 'sessionStorage', 'document']) {
    const original = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, {
      configurable: true,
      get() { externalAccesses++; throw new Error(`No ${name} access in static validation.`); },
    });
    t.after(() => {
      if (original) Object.defineProperty(globalThis, name, original);
      else delete globalThis[name];
    });
  }
  const { execute } = registered();
  for (const [id, input] of Object.entries(fixtures)) {
    const before = structuredClone(input);
    const args = argumentsFor(input);
    const beforeArgs = structuredClone(args);
    const [receipt] = await execute(args);
    assert.equal(receipt.status, 'succeeded', id);
    assert.deepEqual(receipt.result, validateNetwork(input), id);
    assert.equal(receipt.result.valid, id === 'valid', id);
    assert.deepEqual((await execute(args))[0].result, receipt.result, 'reports must be deterministic');
    assert.deepEqual(input, before);
    assert.deepEqual(args, beforeArgs);
  }
  assert.equal(fetch.mock.callCount(), 0);
  assert.equal(externalAccesses, 0);
});

test('actions: selection, named links, and active peer context reach the rules unchanged', async () => {
  const { execute } = registered();
  const input = structuredClone(fixtures.valid);
  input.manifest.networks.unshift({ name: 'other', front_man: 'other_entry', hocon: './other.json' });
  input.networkName = 'artifact_review';
  input.network.link_slots = { scout: {} };
  input.network.tools[1].tools = ['scout'];
  input.links.networks.artifact_review.scout = 'https://peer.example.test/agents/scout';
  input.activePeerChain = ['https://peer.example.test/agents/scout'];
  let [receipt] = await execute(argumentsFor(input));
  assert.deepEqual(receipt.result, validateNetwork(input));
  assert.ok(receipt.result.checks.some(check => check.ruleId === 'peer.composition' && check.status === 'fail'));
  input.activePeerChain = [];
  [receipt] = await execute(argumentsFor(input));
  assert.deepEqual(receipt.result, validateNetwork(input));
  assert.equal(receipt.result.valid, true);
  input.networkName = 'missing';
  [receipt] = await execute(argumentsFor(input));
  assert.deepEqual(receipt.result, validateNetwork(input));
  assert.equal(receipt.result.valid, false);

  const { manifest, network } = fixtures.valid;
  [receipt] = await execute(argumentsFor({ manifest, network }));
  assert.deepEqual(receipt.result, validateNetwork({ manifest, network }), 'context is optional, not inferred from the desk origin');
});

test('actions: runtime rejects malformed arguments and JSON errors never become rule reports', async () => {
  const { prepare, execute } = registered();
  const args = argumentsFor(fixtures.valid);
  for (const field of ['manifest', 'network']) {
    const missing = { ...args };
    delete missing[field];
    assert.throws(() => prepare(missing), new RegExp(`Missing arguments.${field}`));
    assert.throws(() => prepare({ ...args, [field]: {} }), new RegExp(`Invalid arguments.${field}`));
  }
  for (const invalid of [null, [], 'input', { ...args, url: 'https://example.test/' },
    { ...args, links: {} }, { ...args, networkName: 42 }, { ...args, baseUrl: false },
    { ...args, activePeerChain: 'https://peer.example.test/scout' }, { ...args, activePeerChain: [null] }]) {
    assert.throws(() => prepare(invalid));
  }
  for (const field of ['manifest', 'network', 'links']) {
    for (const source of ['', '{', 'https://private.example.test/secret', '{"private":"do-not-echo"']) {
      const [receipt] = await execute({ ...args, [field]: source });
      assert.equal(receipt.status, 'unknown', 'the runtime represents handler errors as unknown receipts');
      assert.match(receipt.error, new RegExp(`Invalid JSON in ${field}\\.`));
      assert.doesNotMatch(receipt.error, /do-not-echo|private\.example/);
      assert.equal(receipt.result, undefined);
    }
  }
  // Valid JSON of an invalid artifact is a rule failure, not a parse error.
  for (const field of ['manifest', 'network']) {
    const [receipt] = await execute({ ...args, [field]: 'null' });
    assert.equal(receipt.status, 'succeeded');
    assert.equal(receipt.result.valid, false);
  }
});
