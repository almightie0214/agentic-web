import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { parseRoles } from '../../site-a/converter/parse-roles.mjs';
import { emitNetwork } from '../../site-a/converter/emit-network.mjs';
import { emitManifest } from '../../site-a/converter/emit-manifest.mjs';
import { validateNetwork } from '../../site-a/validator-rules.mjs';

const fixtures = new URL('./fixtures/', import.meta.url);
const role = (name) => ({ name, description: `Review as ${name}.`, instructions: `# ${name}\n\nReview supplied text.` });
const parsed = (configFront) => ({ roles: ['zulu', 'alpha', 'Beta'].map(role), configFront, layout: 'markdown' });
// CVT-NET-005: expected suffixes are independent of the emitter implementation.
const frontRule = '\n\n## Converter-owned output rule\nReturn only the final answer intended for the visitor. Do not include drafts, plans, process notes, or messages addressed to other roles.';
const specialistRule = '\n\n## Converter-owned output rule\nReturn only the answer to the inquiry you received. Do not include drafts, plans, process notes, or messages addressed to other roles.';
const bytes = (value) => JSON.stringify(value, null, 2) + '\n';
const inquirySchema = {
  type: 'object',
  properties: { inquiry: { type: 'string', description: 'The request to handle.' } },
  required: ['inquiry'],
  additionalProperties: false,
};

for (const layout of ['mini-theora', 'sample-agents', 'adk']) {
  test(`CVT-NET/OUT-001: ${layout} parser-to-network byte snapshot and enumeration independence`, async () => {
    const files = layout === 'mini-theora'
      ? JSON.parse(await readFile(new URL('mini-theora/layout.json', fixtures), 'utf8'))
      : layout === 'adk'
        ? await Promise.all(['root_agent.yaml', 'middle/agent.yaml', 'middle/leaf/agent.yaml']
          .map(async (path) => ({ path, content: await readFile(new URL(`adk/${path}`, fixtures), 'utf8') })))
        : await Promise.all((await readdir(new URL('sample-agents/', fixtures)))
        .filter((name) => name.endsWith('.md'))
        .map(async (name) => ({ path: name, content: await readFile(new URL(`sample-agents/${name}`, fixtures), 'utf8') })));
    const snapshot = await readFile(new URL(`${layout}/expected/converted_team.network.json`, fixtures), 'utf8');
    const input = parseRoles(files);
    const result = emitNetwork(input);
    assert.equal(result.frontMan, 'coordinator');
    assert.equal(bytes(result.network), snapshot);
    assert.deepEqual(result.network.tools.map(({ name, tools }) => ({ name, tools })), layout === 'adk' ? [
      { name: 'coordinator', tools: ['specialist'] }, { name: 'researcher', tools: [] },
      { name: 'specialist', tools: ['researcher'] },
    ] : [
      { name: 'coordinator', tools: ['specialist'] }, { name: 'specialist', tools: [] },
    ]);
    assert.equal(bytes(emitNetwork(parseRoles([...files].reverse())).network), snapshot);

    // CVT-MAN/LINK/OUT-001: all three publication artifacts share the same identity.
    const publication = emitManifest(result.frontMan, input.layout);
    for (const [key, filename] of [['manifest', 'agent-manifest.json'], ['links', 'links.json']]) {
      const expected = await readFile(new URL(`${layout}/expected/${filename}`, fixtures), 'utf8');
      assert.equal(bytes(publication[key]), expected);
    }
    const reversed = emitNetwork(parseRoles([...files].reverse()));
    assert.equal(bytes(emitManifest(reversed.frontMan, input.layout)), bytes(publication));
    assert.equal(publication.manifest.networks[0].front_man, result.network.tools[0].name);
    assert.deepEqual(Object.keys(publication.links.networks), [publication.manifest.networks[0].name]);
    if (layout === 'adk') {
      assert.equal(validateNetwork({ ...publication, network: result.network }).valid, true);
      assert.doesNotMatch(bytes({ ...publication, network: result.network }), /notices|unavailable_demo_tool|source_model_not_transferred/);
    }
  });
}

for (const layout of ['theora', 'markdown']) for (const [label, configFront, options, expectedFront, expectedOrder] of [
  ['sorted default', undefined, {}, 'Beta', ['Beta', 'alpha', 'zulu']],
  ['config over default', 'zulu', {}, 'zulu', ['zulu', 'Beta', 'alpha']],
  ['explicit over config', 'zulu', { front: 'alpha' }, 'alpha', ['alpha', 'Beta', 'zulu']],
  ['explicit without config', undefined, { front: 'zulu' }, 'zulu', ['zulu', 'Beta', 'alpha']],
]) {
  test(`CVT-FRONT-001/NET-002/004/005: ${layout} ${label}, front first with sorted star edges and output rules`, () => {
    const input = { ...parsed(configFront), layout };
    const { network, frontMan } = emitNetwork(input, options);
    assert.equal(frontMan, expectedFront);
    assert.equal(emitManifest(frontMan, input.layout).manifest.networks[0].front_man, expectedFront);
    assert.deepEqual(network.tools.map(({ name }) => name), expectedOrder);
    assert.deepEqual(network.tools[0].tools, expectedOrder.slice(1));
    for (const agent of network.tools.slice(1)) assert.deepEqual(agent.tools, []);
    for (const agent of network.tools) {
      const source = input.roles.find(({ name }) => name === agent.name);
      assert.deepEqual(Object.keys(agent), ['name', 'function', 'instructions', 'tools']);
      assert.deepEqual(Object.keys(agent.function), ['description', 'parameters']);
      assert.equal(agent.function.description, source.description);
      assert.equal(agent.instructions, source.instructions + (agent.name === expectedFront ? frontRule : specialistRule));
      assert.deepEqual(agent.function.parameters, inquirySchema);
      assert.ok(!agent.tools.includes(agent.name));
    }
    assert.equal(bytes(emitNetwork({ ...input, roles: [...input.roles].reverse() }, options).network), bytes(network));
  });
}

test('CVT-NET-004/005: ADK preserves source child order and intermediate delegation without notices', () => {
  const input = {
    layout: 'adk', configFront: 'zulu',
    roles: [
      { ...role('zulu'), tools: ['middle', 'alpha'] },
      { ...role('middle'), tools: ['leaf'] },
      { ...role('leaf'), tools: [] },
      { ...role('alpha'), tools: [] },
    ],
    notices: [{ role: 'middle', keys: ['tools', 'model'], hiddenKeyCount: 0 }],
  };
  input.roles.forEach((source) => { Object.freeze(source.tools); Object.freeze(source); });
  Object.freeze(input.roles);
  Object.freeze(input);
  const { network, frontMan } = emitNetwork(input, { front: 'zulu' });
  assert.equal(frontMan, 'zulu');
  assert.equal(network.metadata.description, 'Converted Google ADK agent network.');
  assert.equal(emitManifest(frontMan, input.layout).manifest.networks[0].description, network.metadata.description);
  assert.deepEqual(network.tools.map(({ name, tools }) => ({ name, tools })), [
    { name: 'zulu', tools: ['middle', 'alpha'] }, { name: 'alpha', tools: [] },
    { name: 'leaf', tools: [] }, { name: 'middle', tools: ['leaf'] },
  ]);
  for (const agent of network.tools) {
    assert.equal(agent.instructions, input.roles.find(({ name }) => name === agent.name).instructions
      + (agent.name === 'zulu' ? frontRule : specialistRule));
  }
  assert.doesNotMatch(bytes(network), /notices|hiddenKeyCount/);
  network.tools[0].tools.push('changed');
  assert.deepEqual(emitNetwork(input).network.tools[0].tools, ['middle', 'alpha']);
  assert.throws(() => emitNetwork(input, { front: 'alpha' }), /^Error: CVT-FRONT-001:/);
  assert.throws(() => emitNetwork({ ...input, configFront: undefined }), /^Error: CVT-FRONT-001:/);
  for (const tools of [undefined, 'leaf', ['unknown'], ['middle'], ['leaf', 'leaf']]) {
    const roles = input.roles.map((source) => source.name === 'middle' ? { ...source, tools } : source);
    assert.throws(() => emitNetwork({ ...input, roles }), /^Error: CVT-IR-001:/);
  }
});

test('CVT-NET-001/003/004: one role has the exact resolved envelope and no outgoing calls', () => {
  const source = role('solo');
  const input = { roles: [source], layout: 'markdown' };
  assert.equal(emitManifest(emitNetwork(input).frontMan, input.layout).manifest.networks[0].front_man, 'solo');
  assert.deepEqual(emitNetwork(input), {
    frontMan: 'solo',
    network: {
      metadata: { description: 'Converted Markdown role conversation network.' },
      llm_config: { model_name: 'alibaba/qwen3.8-flash', temperature: 0.2 },
      max_steps: 12,
      max_execution_seconds: 90,
      tools: [{ name: 'solo', function: { description: source.description, parameters: inquirySchema },
        instructions: source.instructions + frontRule, tools: [] }],
    },
  });
});

test('CVT-NET-001/002/004: copy only public role fields, not executable or peer capabilities', () => {
  const files = [
    { path: '.claude/agents/alpha.md', content: '---\nname: alpha\ntools: Bash, Read\nmodel: source-model\n---\n# Alpha\nKeep ${literal} and https://example.test as text.\napi_key: synthetic-secret\nRead /home/example/private' },
    { path: '.claude/agents/zulu.md', content: '# Zulu\nReview text.' },
  ];
  const input = parseRoles(files);
  // Even additional IR metadata cannot introduce capabilities into emitted JSON.
  Object.assign(input, { include: 'private.conf', allowed_peers: ['https://peer.invalid'], class: 'Shell' });
  Object.assign(input.roles[0], { tools: ['Bash', 'alpha'], toolbox: 'Shell', function: { parameters: { type: 'number' } } });
  const { network } = emitNetwork(input);
  assert.deepEqual(Object.keys(network), ['metadata', 'llm_config', 'max_steps', 'max_execution_seconds', 'tools']);
  assert.deepEqual(network.tools[0], {
    name: 'alpha',
    function: { description: 'Alpha', parameters: inquirySchema },
    instructions: '# Alpha\nKeep ${literal} and https://example.test as text.\n[REDACTED_SECRET]\n[REDACTED_LOCAL_PATH]' + frontRule,
    tools: ['zulu'],
  });
  assert.deepEqual(Object.keys(network.tools[1]), ['name', 'function', 'instructions', 'tools']);
  assert.deepEqual(network.tools[1].tools, []);
  assert.doesNotMatch(bytes(network), /synthetic-secret|\/home\/example|source-model|private\.conf|peer\.invalid|Bash|Shell|toolbox/);
});

test('CVT-META-001: descriptions follow the parsed format in network and manifest', () => {
  const files = [
    { path: '.theora/roles/reader/agent.md', content: '# Theora reader' },
    { path: 'reader.md', content: '# Markdown reader' },
  ];
  for (const [options, label] of [[{}, 'Theora'], [{ layout: 'theora' }, 'Theora'], [{ layout: 'markdown' }, 'Markdown']]) {
    const input = parseRoles(files, options);
    const { network, frontMan } = emitNetwork(input);
    const { manifest } = emitManifest(frontMan, input.layout);
    assert.equal(network.metadata.description, `Converted ${label} role conversation network.`);
    assert.equal(manifest.networks[0].description, network.metadata.description);
  }
});

test('CVT-META-001: missing or invalid input format fails without disclosure or fallback', () => {
  for (const layout of [undefined, null, '', 'Theora', 'unknown', false, 42, {}, [], '/private/DO_NOT_DISCLOSE']) {
    for (const emit of [() => emitNetwork({ ...parsed(), layout }), () => emitManifest('alpha', layout)]) {
      assert.throws(emit, (error) => {
        assert.equal(error.message, 'CVT-META-001: invalid converter input.');
        assert.equal(error.cause, undefined);
        return true;
      });
    }
  }
});

test('CVT-FRONT-001/SEC-003: invalid explicit and config candidates fail without disclosure or fallback', () => {
  for (const candidate of ['', ' ', ' alpha', 'alpha ', 'alpha\n', 'Alpha', 'unknown', null, false, 42, {}, [], '/private/DO_NOT_DISCLOSE', 'ghp_DO_NOT_DISCLOSE']) {
    for (const [input, options] of [
      [parsed('zulu'), { front: candidate }],
      [parsed(candidate), { front: 'alpha' }],
    ]) {
      assert.throws(() => emitNetwork(input, options), (error) => {
        assert.equal(error.message, 'CVT-FRONT-001: invalid converter input.');
        assert.equal(error.cause, undefined);
        return true;
      });
    }
  }
  // The parser validates config before emission even when an override is intended.
  for (const content of ['not JSON', '{"front_man":"unknown"}', '{"front_man":null}']) {
    assert.throws(() => emitNetwork(parseRoles([
      { path: '.theora/roles/alpha/agent.md', content: '# Alpha' },
      { path: '.theora/config/theora.json', content },
    ]), { front: 'alpha' }), /^Error: CVT-(?:IN-003|ROLE-001):/);
  }
});

test('CVT-ERR/IR-001: no empty network or malformed role subset is emitted', () => {
  for (const input of [undefined, null, {}, { roles: [] }, { roles: {} }, { roles: Array(1) },
    { roles: [null] }, { roles: [role('alpha'), { ...role('zulu'), instructions: ' ' }] },
    { roles: [{ ...role('alpha'), description: '' }] }, { roles: [{ ...role('alpha'), name: 1 }] },
    { roles: [role('alpha'), role('Alpha')] }]) {
    assert.throws(() => emitNetwork(input), /^Error: CVT-IR-001:/);
  }
  for (const options of [null, [], 'alpha']) {
    assert.throws(() => emitNetwork(parsed(), options), /^Error: CVT-FRONT-001:/);
  }
});

test('CVT-CORE/OUT-001: frozen inputs, repeatable output, and independent schemas per agent and call', () => {
  const input = parsed('zulu');
  input.roles.forEach(Object.freeze);
  Object.freeze(input.roles);
  Object.freeze(input);
  const options = Object.freeze({ front: 'alpha' });
  const before = bytes(input);
  const first = emitNetwork(input, options);
  const expected = bytes(first);
  assert.equal(bytes(emitNetwork(input, options)), expected);
  first.network.tools[0].function.parameters.required.push('changed');
  first.network.tools[0].function.parameters.properties.inquiry.type = 'number';
  first.network.tools[0].tools.push('changed');
  first.network.llm_config.model_name = 'changed';
  assert.deepEqual(first.network.tools[1].function.parameters, inquirySchema);
  assert.equal(bytes(emitNetwork(input, options)), expected);
  assert.equal(bytes(input), before);
});

test('CVT-MAN-001/ERR-001: malformed selected fronts fail without disclosure or coercion', () => {
  for (const front of [undefined, null, false, 42, {}, [], '', ' ', ' alpha', 'alpha ', 'alpha\n',
    '0alpha', 'a-b', 'a'.repeat(61), '/private/DO_NOT_DISCLOSE', 'alpha\0']) {
    assert.throws(() => emitManifest(front, 'markdown'), (error) => {
      assert.equal(error.message, 'CVT-MAN-001: invalid converter input.');
      assert.equal(error.cause, undefined);
      return true;
    });
  }
  for (const front of ['A', 'a'.repeat(60), 'Role_123']) {
    assert.equal(emitManifest(front, 'markdown').manifest.networks[0].front_man, front);
  }
});

test('CVT-CORE/MAN/LINK/OUT-001: publication calls return independent data with no peer grants', () => {
  const first = emitManifest('alpha', 'markdown');
  const expected = bytes(first);
  assert.deepEqual(Object.keys(first), ['manifest', 'links']);
  assert.deepEqual(first.manifest.allowed_peers, []);
  assert.deepEqual(first.manifest.peer_policy, { mode: 'closed' });
  assert.deepEqual(first.links, { version: 1, networks: { converted_team: {} } });
  first.manifest.networks[0].front_man = 'changed';
  first.manifest.llm_router.mock = true;
  first.manifest.allowed_peers.push('https://peer.invalid');
  first.manifest.peer_policy.mode = 'open';
  first.manifest.deployment.mode = 'changed';
  first.links.networks.converted_team.slot = { url: 'https://peer.invalid' };
  assert.equal(bytes(emitManifest('alpha', 'markdown')), expected);
  assert.equal(emitManifest('zulu', 'markdown').manifest.networks[0].front_man, 'zulu');
});

for (const [moduleName, exportName, args] of [
  ['emit-network', 'emitNetwork', [parsed('zulu'), { front: 'alpha' }]],
  ['emit-manifest', 'emitManifest', ['alpha', 'markdown']],
]) {
  test(`CVT-CORE-001: ${moduleName} loads as a browser-portable module without Node imports`, async () => {
    const source = await readFile(new URL(`../../site-a/converter/${moduleName}.mjs`, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /\b(?:from\s*|import\s*(?:\(\s*)?)["']node:/);
    const helper = await readFile(new URL('../../site-a/converter/describe-layout.mjs', import.meta.url), 'utf8');
    assert.doesNotMatch(helper, /\b(?:from\s*|import\s*(?:\(\s*)?)["']node:/);
    const portableSource = source.replace("'./describe-layout.mjs'", `'data:text/javascript;base64,${Buffer.from(helper).toString('base64')}'`);
    const portable = await import(`data:text/javascript;base64,${Buffer.from(portableSource).toString('base64')}`);
    const emitter = exportName === 'emitNetwork' ? emitNetwork : emitManifest;
    assert.deepEqual(portable[exportName](...args), emitter(...args));
  });
}
