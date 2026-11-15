import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { AgentNetwork, validateNetwork } from '../site-a/runtime/kernel.js';
import { schemaFor } from '../site-a/runtime/runner.js';
import { RemoteRegistry } from '../site-a/runtime/remote.js';
import { Engine } from '../site-a/runtime/engine.js';
import { fixtures } from './fixtures.mjs';
import { validateNetwork as reviewNetwork } from '../site-a/validator-rules.mjs';

// These checks establish fixture preconditions, not conformance reports. The
// reference runtime's graph validator does not cover all profile requirements.
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
  // live hosting, or actual runtime interruption.
  const registry = new RemoteRegistry();
  const activeChain = [`${base}::${entry.name}`];
  assert.throws(() => registry.checkCycle(activeChain, base, name), { code: 'COMPOSITION_CYCLE' });
  assert.doesNotThrow(() => registry.checkCycle([], base, name), 'a completed earlier invocation is not an active cycle');
  assert.doesNotThrow(() => registry.checkCycle(activeChain, base, 'other_network'));

  input.network.tools[1].tools = [];
  assert.deepEqual(input, fixtures.valid, 'self peer re-entry must be the only change');
});

const failures = report => report.checks.filter(check => check.status === 'fail');

function failsAt(input, ruleId, path) {
  const report = reviewNetwork(input);
  assert.equal(report.valid, false);
  assert.ok(failures(report).some(check => check.ruleId === ruleId && check.path === path), JSON.stringify(report));
  return report;
}

test('rules: fixture reports are deterministic, read-only, and distinguish static checks from runtime observations', t => {
  const fetch = t.mock.method(globalThis, 'fetch', () => { throw new Error('Rules must not fetch.'); });
  for (const [id, input] of Object.entries(fixtures)) {
    const before = structuredClone(input);
    const report = reviewNetwork(input);
    assert.deepEqual(input, before);
    assert.deepEqual(reviewNetwork(JSON.parse(JSON.stringify(input))), report);
    assert.equal(report.valid, id === 'valid');
    for (const check of report.checks) {
      assert.ok(check.ruleId && check.path.startsWith('/') && check.message);
      assert.ok(['pass', 'fail', 'warning', 'unverified'].includes(check.status));
      if (check.status !== 'pass') assert.ok(check.hint);
    }
  }
  failsAt(fixtures['bad-frontman'], 'manifest.front_man', '/manifest/networks/0/front_man');
  failsAt(fixtures['bad-schema'], 'agent.parameters', '/network/tools/1/function/parameters/type');
  failsAt(fixtures['bad-cycle'], 'peer.composition', '/network/tools/1/tools/0');
  const omitted = reviewNetwork(fixtures.valid).checks.find(check => check.path === '/network/tools/1/function/parameters');
  assert.equal(omitted.status, 'pass');
  assert.match(omitted.message, /default.*request:string/);
  const input = structuredClone(fixtures.valid);
  input.network.tools[1].function.parameters = { $ref: 'https://schemas.example.test/external.json' };
  assert.equal(reviewNetwork(input).valid, true, 'reference availability is not a schema structure claim');
  assert.equal(fetch.mock.callCount(), 0);
});

test('samples: published JSON inputs produce the same reports as their fixtures', async t => {
  const cases = [
    { id: 'valid', valid: true },
    { id: 'bad-frontman', valid: false, ruleId: 'manifest.front_man', path: '/manifest/networks/0/front_man' },
    { id: 'bad-schema', valid: false, ruleId: 'agent.parameters', path: '/network/tools/1/function/parameters/type' },
    { id: 'bad-cycle', valid: false, ruleId: 'peer.composition', path: '/network/tools/1/tools/0' },
  ];
  for (const { id, valid, ruleId, path } of cases) {
    await t.test(id, async () => {
      const input = JSON.parse(await readFile(new URL(`../site-a/samples/${id}.network.json`, import.meta.url), 'utf8'));
      assert.deepEqual(input, fixtures[id], 'the sample must preserve the fixture preconditions and review context');
      const before = structuredClone(input);
      const report = reviewNetwork(input);
      assert.deepEqual(input, before, 'reviewing a sample must not change its contents');
      assert.deepEqual(report, reviewNetwork(fixtures[id]));
      assert.equal(report.valid, valid);
      if (valid) {
        assert.deepEqual(failures(report), []);
        const parameters = report.checks.find(check => check.ruleId === 'agent.parameters'
          && check.path === '/network/tools/1/function/parameters');
        assert.equal(parameters.status, 'pass');
        assert.match(parameters.message, /default.*request:string/);
      } else {
        assert.ok(failures(report).some(check => check.ruleId === ruleId && check.path === path), JSON.stringify(report));
      }
      assert.equal(report.checks.find(check => check.ruleId === 'runtime.composition').status, 'unverified',
        'static samples do not demonstrate browser cycle interruption');
    });
  }
});

test('rules: required manifest strings and agent function descriptions reject missing, blank, and non-string values', () => {
  for (const key of ['name', 'front_man', 'hocon']) {
    for (const value of [undefined, null, '', '  ', 42, {}, []]) {
      const input = structuredClone(fixtures.valid);
      if (value === undefined) delete input.manifest.networks[0][key];
      else input.manifest.networks[0][key] = value;
      failsAt(input, `manifest.${key}`, `/manifest/networks/0/${key}`);
    }
  }
  for (const index of [0, 1]) {
    for (const value of [undefined, null, '', '  ', 42, {}, []]) {
      const input = structuredClone(fixtures.valid);
      if (value === undefined) delete input.network.tools[index].function.description;
      else input.network.tools[index].function.description = value;
      failsAt(input, 'agent.description', `/network/tools/${index}/function/description`);
    }
  }
});

test('rules: identity is supplied by the manifest and network metadata, with consistent optional duplicates', async () => {
  const input = structuredClone(fixtures.valid);
  delete input.network.name;
  delete input.network.front_man;
  assert.equal(reviewNetwork(input).valid, true, 'duplicate identity fields are not required');
  const manifest = JSON.parse(await readFile(new URL('../site-a/agent-manifest.json', import.meta.url)));
  const network = JSON.parse(await readFile(new URL('../site-a/review_desk.network.json', import.meta.url)));
  assert.equal(reviewNetwork({ manifest, network }).valid, true);
  for (const value of [undefined, null, '', '  ', 42]) {
    const edited = structuredClone(input);
    if (value === undefined) delete edited.network.metadata.description;
    else edited.network.metadata.description = value;
    failsAt(edited, 'network.description', '/network/metadata/description');
  }
  for (const key of ['name', 'front_man']) {
    for (const value of ['different', '', null, 42]) {
      const edited = structuredClone(input);
      edited.network[key] = value;
      failsAt(edited, `network.identity.${key}`, `/network/${key}`);
    }
  }
});

test('rules: front_man must both exist and match the reference entry selection', () => {
  for (const [front, exists] of [['not_defined', false], ['artifact_reader', true]]) {
    const input = structuredClone(fixtures.valid);
    input.manifest.networks[0].front_man = front;
    delete input.network.front_man;
    const report = failsAt(input, 'network.front_man.selected', '/manifest/networks/0/front_man');
    assert.equal(report.checks.find(check => check.ruleId === 'network.front_man.exists').status, exists ? 'pass' : 'fail');
  }
  const cases = [
    { edit() {}, expected: 'review_entry' },
    { edit(agents) { agents[0].instructions = ''; }, expected: 'artifact_reader' },
    { edit(agents) { agents[0].class = 'ExampleTool'; }, expected: 'artifact_reader' },
    { edit(agents) { agents[0].toolbox = 'ExampleToolbox'; }, expected: 'artifact_reader' },
    { edit(agents) { agents.forEach(agent => delete agent.instructions); }, expected: 'review_entry' },
    { edit(agents) { agents.forEach(agent => { agent.class = 'ExampleTool'; }); }, expected: 'review_entry' },
    { edit(agents) { agents[0].name = ' review_entry '; }, expected: 'review_entry' },
  ];
  for (const { edit, expected } of cases) {
    const input = structuredClone(fixtures.valid);
    edit(input.network.tools);
    input.manifest.networks[0].front_man = expected;
    delete input.network.front_man;
    const loaded = new AgentNetwork(input.network, input.network.name);
    assert.equal(loaded.findFrontMan(), expected, 'fixture must reach the intended selection branch');
    assert.equal(reviewNetwork(input).valid, true, JSON.stringify(input));
  }
});

test('rules: malformed artifact containers return structured failures instead of throwing', () => {
  for (const value of [undefined, null, false, 0, '', [], {}]) {
    assert.equal(reviewNetwork(value).valid, false);
    for (const key of ['manifest', 'network']) {
      const input = structuredClone(fixtures.valid);
      input[key] = value;
      assert.equal(reviewNetwork(input).valid, false, `${key}: ${JSON.stringify(value)}`);
    }
  }
  for (const value of [undefined, null, {}, '', 42, []]) {
    const input = structuredClone(fixtures.valid);
    input.manifest.networks = value;
    failsAt(input, 'manifest.networks', '/manifest/networks');
    input.manifest = structuredClone(fixtures.valid.manifest);
    input.network.tools = value;
    failsAt(input, 'network.tools', '/network/tools');
  }
  for (const value of [null, [], 'entry', {}]) {
    const input = structuredClone(fixtures.valid);
    input.manifest.networks[0] = value;
    failsAt(input, 'manifest.name', '/manifest/networks/0/name');
  }
  for (const name of ['', ' ', 'review_entry']) {
    const input = structuredClone(fixtures.valid);
    input.network.tools[1].name = name;
    failsAt(input, 'agent.name', '/network/tools/1/name');
  }
  for (const value of [null, [], 'agent', {}, { name: 'review_entry' },
    { name: 42, tools: ['https://peer.example.test/agents/scout'] }]) {
    const input = structuredClone(fixtures.valid);
    input.network.tools[1] = value;
    assert.equal(reviewNetwork(input).valid, false);
  }
  for (const value of [null, [], 'function', {}]) {
    const input = structuredClone(fixtures.valid);
    input.network.tools[1].function = value;
    failsAt(input, 'agent.description', '/network/tools/1/function/description');
  }
  for (const replacement of [{ toString: null }, [{ toString: null }]]) {
    const input = structuredClone(fixtures.valid);
    input.network.commondefs = { replacement_strings: { x: replacement } };
    input.network.tools[0].instructions = 'Explain {x}';
    assert.deepEqual(JSON.parse(JSON.stringify(input)), input, 'the malformed config must remain parsed JSON input');
    assert.throws(() => new AgentNetwork(input.network, input.network.name), TypeError,
      'the fixture must reach a real reference-runtime configuration failure');
    const before = structuredClone(input);
    const report = failsAt(input, 'network.config', '/network');
    assert.deepEqual(input, before);
    const failure = failures(report).find(check => check.ruleId === 'network.config');
    assert.ok(failure.message && failure.hint);
    assert.ok(report.checks.some(check => check.ruleId === 'agent.parameters' && check.status === 'pass'),
      'checks completed before configuration processing must be preserved');
    assert.equal(report.checks.some(check => check.ruleId === 'network.front_man.selected'), false,
      'a configuration failure cannot establish a front-agent match or mismatch');
  }
  const input = structuredClone(fixtures.valid);
  input.network.commondefs = { replacement_strings: { x: 'the public artifacts' } };
  input.network.tools[0].instructions = 'Explain {x}';
  const report = failsAt(input, 'network.resolved', '/network/tools/0/instructions');
  assert.equal(report.checks.find(check => check.ruleId === 'network.front_man.selected').status, 'pass',
    'processable configuration must still reach entry-agent selection, but publication must expand replacements');
});

test('rules: network selection never falls back from a missing requested name', () => {
  const input = structuredClone(fixtures.valid);
  input.manifest.networks.unshift({ name: 'another', front_man: 'other_entry', hocon: './another.json' });
  input.networkName = 'artifact_review';
  assert.equal(reviewNetwork(input).valid, true);
  input.networkName = 'missing';
  failsAt(input, 'manifest.selection', '/manifest/networks');
  input.networkName = 'another';
  failsAt(input, 'network.identity.name', '/network/name');
});

test('rules: declared parameters validate schema structure recursively, not just the root type', () => {
  const valid = [
    {}, true, false, { type: ['string', 'null'] },
    { type: 'object', required: ['optionalProperty'], additionalProperties: false },
    { anyOf: [{ type: 'string' }, { type: 'number', minimum: 0 }], default: null, 'x-note': { type: 'ordinary extension data' } },
    { definitions: { value: { type: 'string' } }, $ref: '#/definitions/value' },
    { $schema: 'http://json-schema.org/draft-07/schema#', type: 'array', items: [{ type: 'string' }, false] },
    { $schema: 'https://json-schema.org/draft/2020-12/schema', prefixItems: [{ type: 'string' }], items: false },
    { $schema: 'http://json-schema.org/draft-04/schema#', type: 'number', minimum: 0, exclusiveMinimum: true },
    { type: 'string', enum: ['a', 'b'], pattern: '^[a-z]+$', minLength: 1 },
  ];
  for (const schema of valid) {
    const input = structuredClone(fixtures.valid);
    input.network.tools[1].function.parameters = schema;
    assert.equal(reviewNetwork(input).valid, true, JSON.stringify(schema));
  }
  const invalid = [
    [null, ''], [[], ''], ['object', ''], [5, ''],
    [{ type: 'invalid' }, '/type'], [{ type: [] }, '/type'], [{ type: ['string', 'string'] }, '/type'],
    [{ properties: [] }, '/properties'], [{ properties: { 'a/b~c': { type: 'bad' } } }, '/properties/a~1b~0c/type'],
    [{ items: { type: 'bad' } }, '/items/type'], [{ allOf: [] }, '/allOf'], [{ anyOf: [null] }, '/anyOf/0'],
    [{ additionalProperties: 3 }, '/additionalProperties'], [{ required: 'request' }, '/required'],
    [{ required: ['a', 'a'] }, '/required'], [{ minimum: '0' }, '/minimum'], [{ multipleOf: 0 }, '/multipleOf'],
    [{ maxLength: -1 }, '/maxLength'], [{ minItems: 1.5 }, '/minItems'], [{ uniqueItems: 'yes' }, '/uniqueItems'],
    [{ enum: 'not an array' }, '/enum'],
    [{ $schema: 'http://json-schema.org/draft-07/schema#', enum: [{ a: 1, b: 2 }, { b: 2, a: 1 }] }, '/enum'],
    [{ pattern: '[' }, '/pattern'], [{ patternProperties: { '[': {} } }, '/patternProperties/['],
    [{ $ref: 1 }, '/$ref'], [{ $schema: 'not a URI' }, '/$schema'], [{ $ref: '#bad%xy' }, '/$ref'],
    [{ $ref: 'relative[bad]' }, '/$ref'], [{ $id: 'https://example.test/value#anchor' }, '/$id'],
    [{ $vocabulary: { relative: true } }, '/$vocabulary'], [{ $vocabulary: { 'https://example.test/vocab': 'yes' } }, '/$vocabulary'],
    [{ dependentRequired: { field: [2] } }, '/dependentRequired/field'],
    [{ $defs: { inner: { not: null } } }, '/$defs/inner/not'],
    [{ $schema: 'https://json-schema.org/draft/2020-12/schema', items: [{}] }, '/items'],
  ];
  for (const [schema, suffix] of invalid) {
    const input = structuredClone(fixtures.valid);
    input.network.tools[1].function.parameters = schema;
    failsAt(input, 'agent.parameters', `/network/tools/1/function/parameters${suffix}`);
  }
});

test('rules: schema dialects preserve their own boolean, tuple, required, enum, and keyword constraints', () => {
  const cases = [
    {
      uri: 'http://json-schema.org/draft-04/schema#', label: 'Draft 4',
      valid: [
        { properties: { value: {} }, required: ['value'], enum: [{ type: 'ordinary data' }] },
        { items: [{ type: 'string' }], additionalItems: false, additionalProperties: true },
        { minimum: 0, exclusiveMinimum: true, $defs: null, if: 42, examples: 5 },
      ],
      invalid: [[{ properties: { value: false } }, '/properties/value'], [{ required: [] }, '/required'],
        [{ enum: [] }, '/enum'], [{ enum: [1, 1] }, '/enum'], [{ exclusiveMinimum: true }, '/exclusiveMinimum'],
        [{ minimum: 0, exclusiveMinimum: 1 }, '/exclusiveMinimum']],
    },
    {
      uri: 'http://json-schema.org/draft-06/schema#', label: 'Draft 6',
      valid: [{ required: [], properties: { value: false }, items: [true, {}], exclusiveMinimum: 0, if: null, $defs: 5 }],
      invalid: [[{ enum: [] }, '/enum'], [{ exclusiveMaximum: true }, '/exclusiveMaximum'], [{ examples: 5 }, '/examples']],
    },
    {
      uri: 'https://json-schema.org/draft-07/schema', label: 'Draft 7',
      valid: [{ required: [], properties: { value: true }, items: [{}], if: false, then: true, readOnly: false, prefixItems: 42 }],
      invalid: [[{ if: null }, '/if'], [{ writeOnly: 'yes' }, '/writeOnly'], [{ enum: [false, false] }, '/enum']],
    },
    {
      uri: 'https://json-schema.org/draft/2019-09/schema', label: 'Draft 2019-09',
      valid: [{ required: [], enum: [], items: [false], $recursiveAnchor: true, $anchor: 'a:b', $dynamicAnchor: 42 },
        { enum: [1, 1], dependentSchemas: { value: true }, minContains: 0 }],
      invalid: [[{ $recursiveAnchor: 'yes' }, '/$recursiveAnchor'], [{ minContains: -1 }, '/minContains'],
        [{ dependentSchemas: { value: 42 } }, '/dependentSchemas/value']],
    },
    {
      uri: 'https://json-schema.org/draft/2020-12/schema#', label: 'Draft 2020-12',
      valid: [{ required: [], enum: [], prefixItems: [false], items: true, additionalItems: null },
        { enum: [1, 1], $dynamicAnchor: '_value', $recursiveAnchor: 'oldAnchor' }],
      invalid: [[{ items: [{}] }, '/items'], [{ $anchor: 'a:b' }, '/$anchor'],
        [{ prefixItems: [] }, '/prefixItems'], [{ $recursiveAnchor: true }, '/$recursiveAnchor']],
    },
  ];
  for (const row of cases) {
    for (const schema of row.valid) {
      const input = structuredClone(fixtures.valid);
      input.network.tools[1].function.parameters = { $schema: row.uri, ...schema };
      const report = reviewNetwork(input);
      assert.equal(report.valid, true, JSON.stringify(input));
      const result = report.checks.find(check => check.path === '/network/tools/1/function/parameters');
      assert.ok(result.message.includes(row.label));
      assert.match(result.message, /explicit/);
    }
    for (const [schema, suffix] of row.invalid) {
      const input = structuredClone(fixtures.valid);
      input.network.tools[1].function.parameters = { $schema: row.uri, ...schema };
      const report = failsAt(input, 'agent.parameters', `/network/tools/1/function/parameters${suffix}`);
      assert.ok(failures(report).every(check => check.message.includes(row.label)));
    }
  }
  for (const schema of [true, false, { enum: [] }, { enum: [1, 1] },
    { default: { type: 'data' }, examples: [{ type: 'data' }], const: { type: 'data' }, enum: [{ type: 'data' }] }]) {
    const input = structuredClone(fixtures.valid);
    input.network.tools[1].function.parameters = schema;
    const report = reviewNetwork(input);
    assert.equal(report.valid, true);
    const result = report.checks.find(check => check.path === '/network/tools/1/function/parameters');
    assert.match(result.message, /Draft 2020-12.*default selection/);
  }
  const input = structuredClone(fixtures.valid);
  input.network.tools[1].function.parameters = { items: [{}] };
  const report = failsAt(input, 'agent.parameters', '/network/tools/1/function/parameters/items');
  assert.match(failures(report)[0].hint, /declare.*\$schema/);
});

test('rules: custom schema dialects stay unverified and embedded dialects require resource roots', () => {
  const path = '/network/tools/1/function/parameters';
  for (const uri of ['https://custom.example/draft/2020-12/schema', 'https://json-schema.org/unknown/schema']) {
    const input = structuredClone(fixtures.valid);
    input.network.tools[1].function.parameters = { $schema: uri, type: 'custom' };
    const report = reviewNetwork(input);
    assert.equal(report.valid, false, 'unverified is not an all-pass result');
    assert.deepEqual(failures(report), [], 'an unknown dialect is not an invalid schema');
    assert.equal(report.checks.filter(check => check.status === 'unverified' && check.ruleId === 'agent.parameters').length, 1);
    const result = report.checks.find(check => check.path === `${path}/$schema`);
    assert.equal(result.status, 'unverified');
    assert.ok(result.message.includes(uri));
    assert.ok(result.hint);
  }
  for (const value of [null, false, 42, '', './relative-schema', 'https://bad host/schema']) {
    const input = structuredClone(fixtures.valid);
    input.network.tools[1].function.parameters = { $schema: value };
    failsAt(input, 'agent.parameters', `${path}/$schema`);
  }
  const input = structuredClone(fixtures.valid);
  const child = { $id: 'nested', $schema: 'http://json-schema.org/draft-07/schema#', items: [{}] };
  input.network.tools[1].function.parameters = { $defs: { child } };
  assert.equal(reviewNetwork(input).valid, true, 'a modern embedded resource can choose Draft 7');
  delete child.$id;
  failsAt(input, 'agent.parameters', `${path}/$defs/child/$schema`);
  child.$id = 'nested';
  child.$schema = 'https://custom.example/schema';
  const unknown = reviewNetwork(input);
  assert.equal(unknown.valid, false);
  assert.equal(unknown.checks.find(check => check.path === `${path}/$defs/child/$schema`).status, 'unverified');
  input.network.tools[1].function.parameters = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    definitions: { child: { $id: 'nested', $schema: 'https://json-schema.org/draft/2020-12/schema' } },
  };
  failsAt(input, 'agent.parameters', `${path}/definitions/child/$schema`);
});

test('rules: resolved publication rejects structural dependencies but permits literal prose and schema data', () => {
  const cases = [
    { edit(n) { n.include = './private.conf'; }, path: '/network/include' },
    { edit(n) { n.llm_config = { model_name: '${MODEL_NAME}' }; }, path: '/network/llm_config/model_name' },
    { edit(n) { n.tools[1].tools = ['${PEER_URL}']; }, path: '/network/tools/1/tools/0' },
    { edit(n) { n.tools[0].llm_config = { $env: 'MODEL' }; }, path: '/network/tools/0/llm_config/$env' },
    { edit(n) { n.max_steps = '${?STEP_LIMIT}'; }, path: '/network/max_steps' },
    { edit(n) { n.commondefs = { replacement_values: { LIMIT: 8 } }; n.max_steps = 'LIMIT'; }, path: '/network/max_steps' },
    { edit(n) { n.commondefs = { replacement_strings: { note: 'resolved' } }; n.tools[0].instructions = 'Read {note}'; }, path: '/network/tools/0/instructions' },
  ];
  for (const { edit, path } of cases) {
    const input = structuredClone(fixtures.valid);
    edit(input.network);
    failsAt(input, 'network.resolved', path);
  }
  for (const field of ['instructions', 'command']) {
    const input = structuredClone(fixtures.valid);
    const literal = 'Explain ${visitor_note} as literal syntax.';
    input.network.tools[1][field] = literal;
    assert.equal(new AgentNetwork(input.network, input.network.name).getAgentSpec('artifact_reader')[field], literal,
      'without commondefs, prompt text must reach the runtime unchanged');
    assert.equal(reviewNetwork(input).valid, true, `${field} is public prompt text, not a structural dependency`);
    for (const commondefs of [
      { replacement_strings: { visitor_note: 'resolved' } },
      { replacement_values: { [literal]: 'Resolved public prompt.' } },
    ]) {
      input.network.commondefs = commondefs;
      assert.notEqual(new AgentNetwork(input.network, input.network.name).getAgentSpec('artifact_reader')[field], literal,
        'this case must actually depend on runtime configuration replacement');
      failsAt(input, 'network.resolved', `/network/tools/1/${field}`);
    }
  }
  const input = structuredClone(fixtures.valid);
  input.network.tools[0].instructions = 'Explain include "file.conf", ${ENV}, and ${?ENV} as literal syntax.';
  input.network.metadata.description = 'Documentation of ${ENV} and include syntax.';
  input.network.tools[1].function.parameters = {
    type: 'object', properties: { include: { type: 'string', default: '${ENV}' } },
    examples: [{ include: '${ENV}' }], description: 'Explain ${SCHEMA}.',
  };
  input.network.commondefs = { replacement_strings: { unused: 'public' } };
  assert.equal(reviewNetwork(input).valid, true, 'unused reusable definitions and quoted examples are not dependencies');
});

test('rules: tool references require local definitions, valid peer URLs, or valid MCP descriptors', () => {
  const valid = [
    'review_entry', 'artifact_reader', 'https://peer.example.test/agents/scout',
    'https://例え.example.test/agents/scout',
    'https://peer.example.test/scout?version=1#info', '/agentic-web/other_network',
    'http://localhost:8080/agents/scout', 'http://127.0.0.1/scout', 'http://[::1]:8080/scout',
    { url: 'https://tools.example.test/endpoint', tools: ['search'] },
    { url: 'https://tools.example.test/mcp' }, 'https://mcp.example.test/service',
  ];
  for (const ref of valid) {
    const input = structuredClone(fixtures.valid);
    input.network.tools[1].tools = [ref];
    const loaded = new AgentNetwork(input.network, input.network.name);
    assert.notEqual(loaded.classifyTool(ref).kind, 'missing', 'the runtime must recognize this reference kind');
    assert.equal(reviewNetwork(input).valid, true, JSON.stringify(reviewNetwork(input)));
  }
  const invalid = [
    ['missing_agent', 'tool.local'], ['', 'tool.local'], [null, 'tool.local'], [42, 'tool.local'], [[], 'tool.local'],
    ['file:///private/agent', 'tool.peer.url'], ['ftp://peer.example.test/scout', 'tool.peer.url'],
    ['https://peer.example.test/', 'tool.peer.url'], ['https://peer.example.test/agents/', 'tool.peer.url'],
    ['http://peer.example.test/scout', 'tool.peer.url'], ['https://bad host/scout', 'tool.peer.url'],
    ['https://peer.example.test/%zz', 'tool.peer.url'], ['//peer.example.test/scout', 'tool.peer.url'],
    ['https://user:secret@peer.example.test/scout', 'tool.peer.url'],
    ['https://[invalid/scout', 'tool.peer.url'],
    [{}, 'tool.mcp'], [{ url: 42 }, 'tool.mcp'], [{ url: 'file:///mcp' }, 'tool.mcp'],
    [{ url: 'https://tools.example.test/mcp', tools: 'search' }, 'tool.mcp'],
    [{ url: 'https://tools.example.test/mcp', tools: [42] }, 'tool.mcp'],
    [{ url: 'https://tools.example.test/mcp', tools: [''] }, 'tool.mcp'],
  ];
  for (const [ref, rule] of invalid) {
    const input = structuredClone(fixtures.valid);
    input.network.tools[1].tools = [ref];
    failsAt(input, rule, '/network/tools/1/tools/0');
  }
  for (const value of [undefined, null, {}, 'artifact_reader', 42]) {
    const input = structuredClone(fixtures.valid);
    if (value === undefined) delete input.network.tools[1].tools;
    else input.network.tools[1].tools = value;
    failsAt(input, 'agent.tools', '/network/tools/1/tools');
  }
});

test('rules: named links use published network bindings and do not replace local agents', async () => {
  for (const source of ['network.links', 'links.json']) {
    const input = structuredClone(fixtures.valid);
    input.network.link_slots = { scout: {} };
    input.network.tools[1].tools = ['scout'];
    input.network.links = {};
    const bindings = source === 'network.links' ? input.network.links : input.links.networks.artifact_review;
    for (const target of ['/agentic-web/other_network', './other_network', '//review.example.test/agentic-web/other_network',
      'https://review.example.test/agentic-web/other_network']) {
      bindings.scout = target;
      const loaded = new AgentNetwork({ ...input.network,
        links: { ...input.network.links, ...input.links.networks.artifact_review } }, input.network.name);
      const context = { _storedLink: () => '', runtimeAllowedPeers: new Set(),
        _persistLink: async () => {}, trace: { note() {} } };
      const runtime = Engine.prototype.resolveLink.call(context, 'scout', loaded, input.baseUrl);
      if (target.startsWith('https://')) {
        assert.equal(await runtime, target);
        assert.equal(reviewNetwork(input).valid, true, `${source}: complete same-origin bindings are valid`);
      } else {
        await assert.rejects(runtime, /Stored link 'scout' is not a valid http\(s\) URL/);
        failsAt(input, 'tool.peer.url', '/network/tools/1/tools/0');
      }
    }
  }
  const input = structuredClone(fixtures.valid);
  input.network.link_slots = { scout: {} };
  input.network.tools[1].tools = ['scout'];
  failsAt(input, 'tool.link', '/network/tools/1/tools/0');
  input.links.networks.artifact_review.scout = 'https://peer.example.test/agents/scout';
  assert.equal(reviewNetwork(input).valid, true);
  const loaded = new AgentNetwork(input.network, input.network.name);
  assert.equal(loaded.classifyTool('scout').kind, 'link');
  delete input.network.link_slots;
  assert.equal(new AgentNetwork(input.network, input.network.name).classifyTool('scout').kind, 'missing');
  failsAt(input, 'tool.local', '/network/tools/1/tools/0');
  input.network.link_slots = { scout: {} };
  input.links.networks.artifact_review.scout = '';
  failsAt(input, 'tool.peer.url', '/network/tools/1/tools/0');
  input.links.networks.artifact_review.scout = new URL('artifact_review', input.baseUrl).href;
  failsAt(input, 'peer.composition', '/network/tools/1/tools/0');
  input.network.tools[1].tools = ['review_entry'];
  input.links.networks.artifact_review.review_entry = 'not a peer URL';
  assert.equal(reviewNetwork(input).valid, true, 'a local definition takes precedence over a link binding');
  input.network.link_slots = { include: {}, description: {} };
  input.network.links = {
    include: 'https://peer.example.test/agents/scout',
    description: 'https://peer.example.test/agents/scout',
  };
  input.network.tools[1].tools = ['include', 'description'];
  assert.equal(reviewNetwork(input).valid, true, 'link-map member names are not configuration directives or prose fields');
  input.network.links.description = '${PEER}';
  failsAt(input, 'network.resolved', '/network/links/description');
});

test('rules: composition means active peer re-entry, not internal recursion or completed repeated calls', () => {
  const input = structuredClone(fixtures.valid);
  input.network.tools[1].tools = ['review_entry', 'artifact_reader', 'review_entry'];
  assert.equal(reviewNetwork(input).valid, true, 'internal mutual references, self calls, and repetitions are not peer cycles');
  const a = 'https://ancestor.example.test/agents/alpha';
  const b = new URL('artifact_review', input.baseUrl).href;
  input.activePeerChain = [a];
  input.network.tools[1].tools = [a];
  const report = failsAt(input, 'peer.composition', '/network/tools/1/tools/0');
  assert.match(failures(report)[0].message, /would re-enter.*Static analysis/);
  input.activePeerChain = [];
  assert.equal(reviewNetwork(input).valid, true, 'an earlier completed A call is not in the active chain');
  input.activePeerChain = [a, b];
  input.network.tools[1].tools = [];
  failsAt(input, 'peer.composition', '/network');
  input.activePeerChain = [a, a];
  failsAt(input, 'peer.composition', '/activePeerChain/1');
  delete input.activePeerChain;
  for (const target of [b, '/agentic-web/artifact_review', 'https://REVIEW.example.test:443/agentic-web/./artifact_review']) {
    input.network.tools[1].tools = [target];
    failsAt(input, 'peer.composition', '/network/tools/1/tools/0');
  }
  input.network.tools[1].tools = ['https://review.example.test/other-base/artifact_review'];
  assert.equal(reviewNetwork(input).valid, true, 'network identity includes the publication subpath');
  input.network.tools[0].tools = [];
  input.network.tools[1].tools = [b];
  assert.equal(reviewNetwork(input).valid, true, 'unreachable local agents do not establish an active hop');
  delete input.baseUrl;
  input.network.tools[0].tools = ['artifact_reader'];
  const unknown = reviewNetwork(input);
  assert.equal(unknown.valid, true);
  assert.equal(unknown.checks.find(check => check.ruleId === 'runtime.composition').status, 'unverified',
    'without current publication identity, self re-entry cannot be established');
  for (const chain of [null, 'alpha', [null], ['https://peer.example.test/'], ['file:///alpha']]) {
    input.activePeerChain = chain;
    failsAt(input, 'peer.chain', '/activePeerChain');
  }
  delete input.activePeerChain;
  for (const base of [null, '', 42, 'file:///site', 'https://review.example.test/base?query']) {
    input.baseUrl = base;
    failsAt(input, 'peer.base', '/baseUrl');
  }
});

test('rules: undeclared execution limits warn while invalid declarations fail and enforcement stays unverified', () => {
  const input = structuredClone(fixtures.valid);
  delete input.network.max_steps;
  let report = reviewNetwork(input);
  assert.equal(report.valid, true);
  assert.deepEqual(failures(report), []);
  assert.equal(report.checks.filter(check => check.ruleId === 'execution.limit' && check.status === 'warning').length, 4);
  for (const key of ['max_steps', 'max_execution_seconds']) {
    for (const value of [null, '', '8', 0, -1, {}, [], ...(key === 'max_steps' ? [1.5] : [])]) {
      const edited = structuredClone(input);
      edited.network[key] = value;
      failsAt(edited, 'execution.limit', `/network/${key}`);
      delete edited.network[key];
      edited.network.tools[1][key] = value;
      failsAt(edited, 'execution.limit', `/network/tools/1/${key}`);
    }
  }
  input.network.max_steps = 8;
  input.network.max_execution_seconds = 0.5;
  report = reviewNetwork(input);
  assert.equal(report.valid, true);
  assert.equal(report.checks.some(check => check.status === 'warning'), false);
  assert.equal(report.checks.filter(check => check.ruleId.startsWith('runtime.')).every(check => check.status === 'unverified'), true);
  input.network.tools[1].max_steps = 0;
  failsAt(input, 'execution.limit', '/network/tools/1/max_steps');
  input.network.tools[1].max_steps = 2;
  assert.equal(reviewNetwork(input).valid, true, 'an explicit positive agent override is accepted');
  delete input.network.max_steps;
  delete input.network.max_execution_seconds;
  for (const agent of input.network.tools) {
    agent.max_steps = 2;
    agent.max_execution_seconds = 1;
  }
  assert.equal(reviewNetwork(input).checks.some(check => check.status === 'warning'), false,
    'per-agent declarations suffice without network defaults');
});
