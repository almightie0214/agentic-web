import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { AgentNetwork, validateNetwork } from '../site-a/runtime/kernel.js';
import { schemaFor } from '../site-a/runtime/runner.js';
import { RemoteRegistry } from '../site-a/runtime/remote.js';
import { fixtures } from './fixtures.mjs';

// Fixture preconditions only. The rules-core and rules-integrity tasks will add
// report assertions against validator-rules.mjs here; the reference runtime's
// graph validator is not a substitute for those conformance rules.
test('fixtures: four independent inputs survive JSON serialization', () => {
  assert.deepEqual(Object.keys(fixtures), ['valid', 'bad-frontman', 'bad-schema', 'bad-cycle']);
  for (const input of Object.values(fixtures)) {
    assert.deepEqual(JSON.parse(JSON.stringify(input)), input);
  }
  const edited = structuredClone(fixtures['bad-schema']);
  edited.network.tools[0].instructions = 'Changed by a test.';
  assert.notEqual(edited.network.tools[0].instructions, fixtures.valid.network.tools[0].instructions);
  for (const id of ['bad-frontman', 'bad-schema', 'bad-cycle']) {
    assert.notStrictEqual(fixtures[id].network, fixtures.valid.network);
    assert.notStrictEqual(fixtures[id].network.tools[1].function, fixtures.valid.network.tools[1].function);
  }
});

test('fixtures: valid input has coherent identity and a loadable local graph', () => {
  const { manifest, network, links, baseUrl } = fixtures.valid;
  const [entry] = manifest.networks;
  assert.equal(entry.name, 'artifact_review');
  assert.equal(network.name, entry.name);
  assert.equal(network.front_man, entry.front_man);
  assert.ok(network.metadata.description.trim());
  assert.equal(new URL(entry.hocon, baseUrl).href,
    'https://review.example.test/agentic-web/artifact_review.network.json');
  assert.deepEqual(links, { version: 1, networks: { artifact_review: {} } });
  assert.equal(new Set(network.tools.map(agent => agent.name)).size, network.tools.length);
  for (const agent of network.tools) {
    assert.ok(agent.function.description.trim());
    assert.ok(agent.instructions.trim());
  }
  const loaded = new AgentNetwork(network, entry.name);
  assert.equal(loaded.findFrontMan(), entry.front_man);
  assert.deepEqual(validateNetwork(loaded), { errors: [], warnings: [], externals: [], mcps: [] });
});

test('fixtures: omitted parameters and literal instructions agree with the reference profile', async () => {
  const { network } = fixtures.valid;
  const reader = network.tools[1];
  assert.equal(Object.hasOwn(reader.function, 'parameters'), false);
  assert.ok(reader.instructions.includes('${visitor_note}'));
  const loaded = new AgentNetwork(network, network.name);
  assert.equal(loaded.getAgentSpec(reader.name).instructions, reader.instructions);

  // Compare structure with the pinned official example in specification §2.2,
  // without copying its domain, instructions, or agent data into our fixtures.
  const spec = await readFile(new URL('../docs/worldwide_agentic_web_mvp_spec.md', import.meta.url), 'utf8');
  const section = spec.split('### 2.2 Portable Data Profile')[1]?.split('## 3.')[0];
  const block = section?.match(/```json\s*([\s\S]*?)```/);
  assert.ok(block, 'the pinned specification must supply its portable network example');
  const official = JSON.parse(block[1]);
  assert.ok(official.tools.length > 0);
  assert.ok(official.metadata.description.trim());
  const defaultParameters = {
    type: 'object',
    properties: { request: { type: 'string', description: 'The request to handle.' } },
    required: ['request'],
  };
  for (const agent of [...official.tools, reader]) {
    assert.ok(agent.function.description.trim());
    assert.equal(Object.hasOwn(agent.function, 'parameters'), false);
    assert.deepEqual(schemaFor(agent.name, agent.function).function.parameters, defaultParameters);
  }
  const entry = network.tools[0];
  assert.deepEqual(schemaFor(entry.name, entry.function).function.parameters, entry.function.parameters);
});

test('fixtures: bad-frontman removes only the manifest front_man field', () => {
  const input = structuredClone(fixtures['bad-frontman']);
  const [entry] = input.manifest.networks;
  assert.equal(Object.hasOwn(entry, 'front_man'), false);
  assert.ok(input.network.tools.some(agent => agent.name === fixtures.valid.manifest.networks[0].front_man));
  entry.front_man = fixtures.valid.manifest.networks[0].front_man;
  assert.deepEqual(input, fixtures.valid, 'no unrelated defect should mask the missing manifest field');
});

test('fixtures: bad-schema declares invalid parameters instead of omitting them', () => {
  const input = structuredClone(fixtures['bad-schema']);
  const fn = input.network.tools[1].function;
  assert.equal(Object.hasOwn(fn, 'parameters'), true);
  assert.deepEqual(fn.parameters, { type: 'not-a-json-schema-type' });
  assert.ok(!['null', 'boolean', 'object', 'array', 'number', 'integer', 'string'].includes(fn.parameters.type));
  delete fn.parameters;
  assert.deepEqual(input, fixtures.valid, 'the declared invalid schema must be the only change');
});

test('fixtures: bad-cycle re-enters the active network through its own peer URL', () => {
  const input = structuredClone(fixtures['bad-cycle']);
  const [entry] = input.manifest.networks;
  const [target] = input.network.tools[1].tools;
  assert.equal(target, 'https://review.example.test/agentic-web/artifact_review');
  const url = new URL(target);
  const name = url.pathname.split('/').at(-1);
  const base = new URL('./', url).href.replace(/\/$/, '');
  assert.equal(name, entry.name);
  assert.equal(`${base}/`, input.baseUrl);
  assert.ok(!input.network.tools.some(agent => agent.name === target), 'the edge must be a peer URL, not a local agent reference');
  assert.deepEqual(input.network.tools[0].tools, ['artifact_reader']);
  const loaded = new AgentNetwork(input.network, entry.name);
  const graph = validateNetwork(loaded);
  assert.deepEqual(graph.errors, [], 'a composition cycle need not be an invalid local graph');
  assert.deepEqual(graph.externals, [target]);

  // A reference registry seam check, not browser execution or proof of consent,
  // live hosting, or actual runtime interruption (reserved for AW4).
  const registry = new RemoteRegistry();
  const activeChain = [`${base}::${entry.name}`];
  assert.throws(() => registry.checkCycle(activeChain, base, name), { code: 'COMPOSITION_CYCLE' });
  assert.doesNotThrow(() => registry.checkCycle([], base, name), 'a completed earlier invocation is not an active cycle');
  assert.doesNotThrow(() => registry.checkCycle(activeChain, base, 'other_network'));

  input.network.tools[1].tools = [];
  assert.deepEqual(input, fixtures.valid, 'self peer re-entry must be the only change');
});
