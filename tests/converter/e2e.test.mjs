import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmod, copyFile, cp, lstat, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validateNetwork } from '../../site-a/validator-rules.mjs';
import { checkConformance } from '../../tools/check-conformance.mjs';
import { parseRoles } from '../../site-a/converter/parse-roles.mjs';

const cli = fileURLToPath(new URL('../../tools/theora2hocon/theora2hocon.mjs', import.meta.url));
const fixtures = new URL('./fixtures/', import.meta.url);
const workspaceRoot = fileURLToPath(new URL('../../.theora/tmp/converter-e2e', import.meta.url));
const artifacts = ['agent-manifest.json', 'converted_team.network.json', 'links.json'];
const bytes = (value) => JSON.stringify(value, null, 2) + '\n';

async function workspace(t) {
  await mkdir(workspaceRoot, { recursive: true });
  const root = await mkdtemp(join(workspaceRoot, 'converter-private-path-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const input = join(root, 'input-private-name');
  const output = join(root, 'output-private-name');
  await mkdir(input);
  return { root, input, output };
}

async function put(input, path, content) {
  const target = join(input, path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, content);
}

async function assemble(input, layout) {
  if (layout === 'theora') {
    const records = JSON.parse(await readFile(new URL('mini-theora/layout.json', fixtures), 'utf8'));
    // The input .theora layout exists only inside this test's unique workspace.
    for (const { path, content } of records) await put(input, path, content);
  } else if (layout === 'adk') {
    for (const path of ['root_agent.yaml', 'middle/agent.yaml', 'middle/leaf/agent.yaml']) {
      await put(input, path, await readFile(new URL(`adk/${path}`, fixtures)));
    }
  } else {
    for (const name of await readdir(new URL('sample-agents/', fixtures))) {
      if (name.endsWith('.md')) {
        await copyFile(new URL(`sample-agents/${name}`, fixtures), join(input, name));
      }
    }
  }
}

function invoke(args) {
  const result = spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', timeout: 15_000 });
  assert.equal(result.error, undefined);
  assert.equal(result.signal, null);
  return result;
}

function success(result) {
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, '');
}

async function failure(result, { input, output, root }, extraPrivate = []) {
  assert.notEqual(result.status, 0);
  assert.ok(result.stderr.trim(), 'failure must have a diagnostic');
  const diagnostic = result.stdout + result.stderr;
  for (const value of [input, output, root, 'input-private-name', 'output-private-name', ...extraPrivate]) {
    assert.ok(!diagnostic.includes(value), 'diagnostic must not disclose paths or source values');
  }
  // Parse/argument failures must not leave any newly generated bundle members.
  for (const name of artifacts) {
    await assert.rejects(lstat(join(output, name)), (error) => ['ENOENT', 'ENOTDIR'].includes(error.code));
  }
}

async function snapshots(output, layout) {
  assert.deepEqual((await readdir(output)).sort(), artifacts);
  const fixture = layout === 'theora' ? 'mini-theora' : layout === 'adk' ? 'adk' : 'sample-agents';
  for (const name of artifacts) {
    assert.deepEqual(await readFile(join(output, name)), await readFile(new URL(`${fixture}/expected/${name}`, fixtures)));
  }
}

async function frontAndWiring(output, front, other) {
  const network = JSON.parse(await readFile(join(output, 'converted_team.network.json'), 'utf8'));
  const manifest = JSON.parse(await readFile(join(output, 'agent-manifest.json'), 'utf8'));
  assert.equal(manifest.networks[0].front_man, front);
  assert.deepEqual(network.tools.map(({ name, tools }) => ({ name, tools })), [
    { name: front, tools: [other] }, { name: other, tools: [] },
  ]);
}

test('CVT-TEST-001: workspaces are unique, isolated under repository scratch space, and cleaned after use', async (t) => {
  const roots = [];
  await t.test('create disposable workspaces', async (t) => {
    for (let i = 0; i < 2; i++) {
      const ws = await workspace(t);
      roots.push(ws.root);
      assert.equal(dirname(ws.root), workspaceRoot);
      assert.equal(dirname(ws.input), ws.root);
      assert.equal(dirname(ws.output), ws.root);
      await assemble(ws.input, 'theora');
      assert.ok((await lstat(join(ws.input, '.theora', 'roles', 'coordinator', 'agent.md'))).isFile());
    }
    assert.notEqual(roots[0], roots[1]);
  });
  for (const root of roots) {
    await assert.rejects(lstat(root), { code: 'ENOENT' });
  }
});

for (const layout of ['theora', 'markdown']) {
  for (const explicit of [false, true]) {
    test(`CVT-CLI/OUT-001: ${layout} ${explicit ? 'explicit' : 'auto'} layout writes three byte snapshots`, async (t) => {
      const ws = await workspace(t);
      await assemble(ws.input, layout);
      // Nested output is created by the adapter, independent of the input basename.
      ws.output = join(ws.output, 'nested');
      success(invoke([ws.input, ws.output, ...(explicit ? ['--layout', layout] : [])]));
      await snapshots(ws.output, layout);
      await frontAndWiring(ws.output, 'coordinator', 'specialist');
      const { network, manifest } = await bundleInput(ws.output);
      const description = `Converted ${layout === 'theora' ? 'Theora' : 'Markdown'} role conversation network.`;
      assert.equal(network.metadata.description, description);
      assert.equal(network.llm_config.temperature, 0.2);
      assert.equal(manifest.networks[0].description, description);
    });
  }

  test(`CVT-FRONT/OUT-001: ${layout} explicit front overrides default/config and preserves all artifact bytes`, async (t) => {
    const ws = await workspace(t);
    await assemble(ws.input, layout);
    success(invoke([ws.input, ws.output, '--front', 'specialist', '--layout', layout]));
    await frontAndWiring(ws.output, 'specialist', 'coordinator');
    const fixture = layout === 'theora' ? 'mini-theora' : 'sample-agents';
    const records = layout === 'theora'
      ? JSON.parse(await readFile(new URL('mini-theora/layout.json', fixtures), 'utf8'))
      : await Promise.all(['coordinator', 'specialist'].map(async name => ({ path: `${name}.md`,
        content: await readFile(new URL(`sample-agents/${name}.md`, fixtures), 'utf8'),
      })));
    const source = new Map(parseRoles(records).roles.map(role => [role.name, role.instructions]));
    for (const name of artifacts) {
      const expected = JSON.parse(await readFile(new URL(`${fixture}/expected/${name}`, fixtures), 'utf8'));
      if (name === 'agent-manifest.json') expected.networks[0].front_man = 'specialist';
      if (name === 'converted_team.network.json') {
        // Frozen fixture suffixes are role-position rules, not source-role rules.
        const rules = expected.tools.map(role => {
          assert.ok(role.instructions.startsWith(source.get(role.name) + '\n\n'));
          return role.instructions.slice(source.get(role.name).length);
        });
        expected.tools.reverse();
        expected.tools[0].tools = ['coordinator'];
        expected.tools[1].tools = [];
        expected.tools.forEach((role, index) => { role.instructions = source.get(role.name) + rules[index]; });
      }
      assert.equal(await readFile(join(ws.output, name), 'utf8'), bytes(expected));
    }
  });
}

// The AW4 CLI audits a repository-shaped tree, not an arbitrary output folder.
// Stage byte-identical generated data at both roots, with unchanged checker
// dependencies/sample/CORS configuration. Never overwrite either real site.
async function publicationTree(root, output) {
  const tree = join(root, 'publication');
  for (const site of ['site-a', 'site-b']) {
    await mkdir(join(tree, site), { recursive: true });
    for (const name of artifacts) await copyFile(join(output, name), join(tree, site, name));
  }
  for (const path of ['tools/check-conformance.mjs', 'site-a/validator-rules.mjs',
    'site-a/samples/test-slydata.network.json', 'site-b/_headers']) {
    await mkdir(dirname(join(tree, path)), { recursive: true });
    await copyFile(new URL(`../../${path}`, import.meta.url), join(tree, path));
  }
  // AW2 imports helpers from the vendored runtime. Copy it unchanged for module
  // resolution only; no boot, Engine, vendor loader or model is run in Node.
  await cp(new URL('../../site-a/runtime/', import.meta.url), join(tree, 'site-a/runtime'), { recursive: true });
  return tree;
}

async function bundleInput(output) {
  const [manifest, network, links] = await Promise.all(artifacts.map(async name =>
    JSON.parse(await readFile(join(output, name), 'utf8'))));
  return { manifest, network, links, networkName: 'converted_team' };
}

function runConformance(tree) {
  const result = spawnSync(process.execPath, [join(tree, 'tools/check-conformance.mjs')],
    { cwd: tree, encoding: 'utf8', timeout: 15_000 });
  assert.equal(result.error, undefined);
  assert.equal(result.signal, null);
  return result;
}

for (const layout of ['theora', 'markdown']) {
  for (const front of ['coordinator', 'specialist']) {
    test(`CVT-VERIFY-001: ${layout} front ${front} generated files pass AW2 and the AW4 CLI`, async (t) => {
      const ws = await workspace(t);
      await assemble(ws.input, layout);
      success(invoke([ws.input, ws.output, '--front', front]));
      const input = await bundleInput(ws.output);
      const shared = validateNetwork(input);
      assert.equal(shared.valid, true, JSON.stringify(shared.checks));
      const tree = await publicationTree(ws.root, ws.output);
      const report = await checkConformance({ root: pathToFileURL(`${tree}/`) });
      assert.equal(report.valid, true, JSON.stringify(report.checks));
      for (const site of ['site-a', 'site-b']) {
        for (const name of artifacts) {
          assert.deepEqual(await readFile(join(tree, site, name)), await readFile(join(ws.output, name)));
        }
        const checks = report.checks.filter(check => check.site === site && check.networkName === 'converted_team');
        assert.deepEqual(checks.filter(check => !check.ruleId.startsWith('publication.'))
          .map(({ site, networkName, ...check }) => check), shared.checks);
        for (const rule of ['runtime.safety', 'runtime.composition']) {
          assert.ok(checks.some(check => check.ruleId === rule && check.status === 'unverified'));
        }
      }
      const result = runConformance(tree);
      assert.equal(result.status, 0, result.stdout);
      assert.match(result.stdout, /Static repository conformance: PASS/);
      for (const site of ['site-a', 'site-b']) {
        assert.match(result.stdout, new RegExp(`\\[pass\\] ${site}/converted_team network.front_man.selected`));
        assert.match(result.stdout, new RegExp(`\\[pass\\] ${site}/converted_team tool.local`));
      }
      assert.match(result.stdout, /Browser behavior,.*remain unverified/);
      assert.doesNotMatch(result.stdout, /\[pass\].*runtime\.(safety|composition)/);
    });
  }
}

test('CVT-VERIFY-001: corrupted generated bundles fail shared rules and CLI publication checks', async (t) => {
  const cases = [
    { name: 'missing front agent', file: 'agent-manifest.json', rule: 'network.front_man.exists', shared: true,
      change: value => { value.networks[0].front_man = 'missing'; } },
    { name: 'dangling local call', file: 'converted_team.network.json', rule: 'tool.local', shared: true,
      change: value => { value.tools[0].tools = ['missing']; } },
    { name: 'stale links network key', file: 'links.json', rule: 'publication.links.network',
      change: value => { value.networks = { stale: {} }; } },
    { name: 'missing generated definition', file: 'converted_team.network.json', rule: 'publication.file' },
  ];
  for (const row of cases) await t.test(row.name, async (t) => {
    const ws = await workspace(t);
    await assemble(ws.input, 'markdown');
    success(invoke([ws.input, ws.output]));
    const tree = await publicationTree(ws.root, ws.output);
    const target = join(tree, 'site-a', row.file);
    if (row.change) {
      const value = JSON.parse(await readFile(target, 'utf8'));
      row.change(value);
      await writeFile(target, bytes(value));
    } else await rm(target);
    if (row.shared) {
      const shared = validateNetwork(await bundleInput(join(tree, 'site-a')));
      assert.equal(shared.valid, false);
      assert.ok(shared.checks.some(check => check.ruleId === row.rule && check.status === 'fail'));
    }
    const report = await checkConformance({ root: pathToFileURL(`${tree}/`) });
    assert.equal(report.valid, false);
    assert.ok(report.checks.some(check => check.site === 'site-a' && check.ruleId === row.rule && check.status === 'fail'));
    const result = runConformance(tree);
    assert.equal(result.status, 1, result.stdout);
    assert.ok(result.stdout.includes(`[fail] site-a${row.shared ? '/converted_team' : ''} ${row.rule} `), result.stdout);
    assert.match(result.stdout, /Static repository conformance: FAIL/);
  });
});

test('CVT-IN-003/FRONT-001: valid config wins over sorted default, explicit front wins over config', async (t) => {
  const ws = await workspace(t);
  await assemble(ws.input, 'theora');
  await put(ws.input, '.theora/config/theora.json', '{"front_man":"specialist"}');
  success(invoke([ws.input, ws.output]));
  await frontAndWiring(ws.output, 'specialist', 'coordinator');
  success(invoke([ws.input, ws.output, '--front', 'coordinator']));
  await snapshots(ws.output, 'theora');
});

test('CVT-IN-002/004: auto prefers exact Theora roles; explicit Markdown reads only its selected files', async (t) => {
  const ws = await workspace(t);
  await assemble(ws.input, 'theora');
  await put(ws.input, 'unselected.md', '---\nname: [malformed]\n---\nIgnored.');
  success(invoke([ws.input, ws.output]));
  await snapshots(ws.output, 'theora');
  await rm(join(ws.input, 'unselected.md'));
  await assemble(ws.input, 'markdown');
  await put(ws.input, '.theora/config/theora.json', 'PRIVATE_CONFIG_NOT_JSON');
  success(invoke([ws.input, ws.output, '--layout', 'markdown']));
  await snapshots(ws.output, 'markdown');
});

test('CVT-IN-001/002: case variants of fixed Theora role paths are never selected', async (t) => {
  const records = JSON.parse(await readFile(new URL('mini-theora/layout.json', fixtures), 'utf8'));
  for (const [exact, variant] of [['.theora/', '.Theora/'], ['/roles/', '/Roles/'], ['/agent.md', '/Agent.md']]) {
    await t.test(variant, async (t) => {
      const ws = await workspace(t);
      await assemble(ws.input, 'markdown');
      for (const { path, content } of records.filter(({ path }) => path.includes('/roles/'))) {
        await put(ws.input, path.replace(exact, variant), content);
      }
      success(invoke([ws.input, ws.output]));
      await snapshots(ws.output, 'markdown');
      success(invoke([ws.input, ws.output, '--layout', 'markdown']));
      await snapshots(ws.output, 'markdown');
      await rm(ws.output, { recursive: true });
      await failure(invoke([ws.input, ws.output, '--layout', 'theora']), ws);
    });
  }
});

test('CVT-IN-001/003: case variants of fixed config paths are ignored with exact Theora roles', async (t) => {
  for (const path of ['.theora/Config/theora.json', '.theora/config/Theora.json']) {
    await t.test(path, async (t) => {
      const ws = await workspace(t);
      await assemble(ws.input, 'theora');
      await rm(join(ws.input, '.theora', 'config'), { recursive: true });
      await put(ws.input, path, 'PRIVATE_CONFIG_NOT_JSON');
      success(invoke([ws.input, ws.output]));
      await snapshots(ws.output, 'theora');
      success(invoke([ws.input, ws.output, '--layout', 'theora']));
      await snapshots(ws.output, 'theora');
    });
  }
});

test('CVT-IN-001/004: case variants of fixed Claude directories do not override root Markdown', async (t) => {
  for (const path of ['.Claude/agents/ignored.md', '.claude/Agents/ignored.md']) {
    await t.test(path, async (t) => {
      const ws = await workspace(t);
      await assemble(ws.input, 'markdown');
      await put(ws.input, path, Buffer.from([0, 255, 0]));
      success(invoke([ws.input, ws.output]));
      await snapshots(ws.output, 'markdown');
      success(invoke([ws.input, ws.output, '--layout', 'markdown']));
      await snapshots(ws.output, 'markdown');
    });
  }
});

test('CVT-IN-004: .claude/agents immediate Markdown takes precedence over root and excludes unrelated files', async (t) => {
  const ws = await workspace(t);
  const agents = join(ws.input, '.claude', 'agents');
  await mkdir(agents, { recursive: true });
  await assemble(agents, 'markdown');
  for (const path of ['README.md', '.claude/agents/nested/ignored.md', '.claude/agents/ignored.MD', '.claude/agents/ignored.txt', '.theora/roles/deeper/nested/agent.md']) {
    await put(ws.input, path, Buffer.from([0, 255, 0]));
  }
  success(invoke([ws.input, ws.output]));
  await snapshots(ws.output, 'markdown');
  success(invoke([ws.input, ws.output, '--layout', 'markdown']));
  await snapshots(ws.output, 'markdown');
});

test('CVT-CLI-001: invalid arguments fail without partial artifacts or raw argument disclosure', async (t) => {
  const ws = await workspace(t);
  await assemble(ws.input, 'markdown');
  const privateValue = 'PRIVATE_ARGUMENT_SENTINEL';
  const base = [ws.input, ws.output];
  for (const args of [[], [ws.input], [...base, privateValue], [...base, `--${privateValue}`],
    [...base, '--front'], [...base, '--layout'], [...base, '--layout', privateValue],
    [...base, '--front', 'coordinator', '--front', 'specialist'],
    [...base, '--layout', 'markdown', '--layout', 'markdown'],
    [...base, '--front', '--layout', 'markdown']]) {
    await failure(invoke(args), ws, [privateValue]);
  }
});

test('CVT-CLI/ERR-001: invalid selected roles and fronts never leave a newly generated partial bundle', async (t) => {
  const cases = [
    ['no roles', [], []],
    ['malformed frontmatter', [{ path: 'bad.md', content: '---\nname: [PRIVATE_SOURCE_SENTINEL]\n---\n# Bad' }], []],
    ['empty selected role', [{ path: 'empty.md', content: ' \n' }], []],
    ['invalid UTF-8 selected role', [{ path: 'invalid.md', content: Buffer.from([0xff]) }], []],
    ['duplicate role names', [{ path: 'one.md', content: '---\nname: duplicate\n---\n# One' }, { path: 'two.md', content: '---\nname: duplicate\n---\n# Two' }], []],
    ['unknown front', [{ path: 'solo.md', content: '# Solo' }], ['--front', 'PRIVATE_SOURCE_SENTINEL']],
    ['padded front', [{ path: 'solo.md', content: '# Solo' }], ['--front', ' solo']],
    ['malformed Theora name', [{ path: '.theora/roles/PRIVATE-SOURCE-SENTINEL/agent.md', content: '# Invalid name' }], []],
  ];
  for (const [label, records, options] of cases) {
    await t.test(label, async (t) => {
      const ws = await workspace(t);
      for (const { path, content } of records) await put(ws.input, path, content);
      await failure(invoke([ws.input, ws.output, ...options]), ws, ['PRIVATE_SOURCE_SENTINEL', 'PRIVATE-SOURCE-SENTINEL']);
    });
  }
});

test('CVT-IN-003/FRONT-001: invalid config fails even with valid explicit override', async (t) => {
  for (const content of ['PRIVATE_CONFIG_SENTINEL', 'null', '[]', '{"front_man":null}', '{"front_man":"PRIVATE_CONFIG_SENTINEL"}']) {
    const ws = await workspace(t);
    await assemble(ws.input, 'theora');
    await put(ws.input, '.theora/config/theora.json', content);
    await failure(invoke([ws.input, ws.output, '--front', 'coordinator']), ws, ['PRIVATE_CONFIG_SENTINEL']);
  }
});

test('CVT-IN-002: explicit layout does not fall back to otherwise valid roles', async (t) => {
  for (const [actual, selected] of [['theora', 'markdown'], ['markdown', 'theora']]) {
    const ws = await workspace(t);
    await assemble(ws.input, actual);
    await failure(invoke([ws.input, ws.output, '--layout', selected]), ws);
  }
});

test('CVT-IN-001: selected role files and directories that are symlinks are not followed', async (t) => {
  const ws = await workspace(t);
  const external = join(ws.root, 'outside-private-name');
  await mkdir(external);
  await assemble(external, 'markdown');
  await put(ws.input, 'solo.md', '# Solo\nReview text.');
  try {
    await symlink(join(external, 'coordinator.md'), join(ws.input, 'linked.md'), 'file');
    await mkdir(join(ws.input, '.claude'));
    await symlink(external, join(ws.input, '.claude', 'agents'), 'dir');
    await symlink(external, join(ws.input, 'linked-directory'), 'dir');
    await mkdir(join(ws.input, '.theora', 'roles'), { recursive: true });
    await put(external, 'agent.md', '# Linked role');
    await symlink(external, join(ws.input, '.theora', 'roles', 'linked'), 'dir');
    await mkdir(join(ws.input, '.theora', 'roles', 'linkedfile'));
    await symlink(join(external, 'agent.md'), join(ws.input, '.theora', 'roles', 'linkedfile', 'agent.md'), 'file');
  } catch (error) {
    if (error.code === 'EPERM' || error.code === 'ENOSYS') return t.skip('Host does not permit symlink creation.');
    throw error;
  }
  success(invoke([ws.input, ws.output]));
  const network = JSON.parse(await readFile(join(ws.output, 'converted_team.network.json'), 'utf8'));
  assert.deepEqual(network.tools.map(({ name }) => name), ['solo']);
  await rm(ws.output, { recursive: true });
  await failure(invoke([ws.input, ws.output, '--layout', 'theora']), ws, [external]);
});

test('CVT-IN-001: symlinked Theora root and config are not followed', async (t) => {
  const ws = await workspace(t);
  const external = join(ws.root, 'outside-private-name');
  await mkdir(external);
  await assemble(external, 'theora');
  await assemble(ws.input, 'markdown');
  try {
    await symlink(join(external, '.theora'), join(ws.input, '.theora'), 'dir');
  } catch (error) {
    if (error.code === 'EPERM' || error.code === 'ENOSYS') return t.skip('Host does not permit symlink creation.');
    throw error;
  }
  success(invoke([ws.input, ws.output]));
  await snapshots(ws.output, 'markdown');
  await rm(join(ws.input, '.theora'));
  await assemble(ws.input, 'theora');
  await rm(join(ws.input, '.theora', 'config', 'theora.json'));
  const config = join(ws.root, 'PRIVATE_CONFIG_SENTINEL.json');
  await writeFile(config, 'PRIVATE_CONFIG_SENTINEL');
  await symlink(config, join(ws.input, '.theora', 'config', 'theora.json'), 'file');
  success(invoke([ws.input, ws.output]));
  await snapshots(ws.output, 'theora');
});

test('CVT-CLI/SEC-003: nonexistent and non-directory inputs fail with sanitized diagnostics', async (t) => {
  const ws = await workspace(t);
  await failure(invoke([join(ws.input, 'PRIVATE_MISSING_SENTINEL'), ws.output]), ws, ['PRIVATE_MISSING_SENTINEL']);
  await put(ws.input, 'PRIVATE_FILE_SENTINEL', 'PRIVATE_CONTENT_SENTINEL');
  await failure(invoke([join(ws.input, 'PRIVATE_FILE_SENTINEL'), ws.output]), ws, ['PRIVATE_FILE_SENTINEL', 'PRIVATE_CONTENT_SENTINEL']);
});

test('CVT-CLI/SEC-003: unreadable selected input fails rather than silently omitting the role', async (t) => {
  if (process.platform === 'win32' || process.getuid?.() === 0) return t.skip('Host permissions cannot enforce mode 000.');
  const ws = await workspace(t);
  await assemble(ws.input, 'markdown');
  const selected = join(ws.input, 'specialist.md');
  await chmod(selected, 0);
  try {
    await failure(invoke([ws.input, ws.output]), ws, ['specialist.md']);
  } finally {
    await chmod(selected, 0o600);
  }
});

test('CVT-CLI/SEC-003: output write failures are nonzero and do not disclose host paths', async (t) => {
  const ws = await workspace(t);
  await assemble(ws.input, 'markdown');
  await writeFile(ws.output, 'PRIVATE_OUTPUT_SENTINEL');
  await failure(invoke([ws.input, join(ws.output, 'PRIVATE_CHILD_SENTINEL')]), { ...ws, output: join(ws.output, 'PRIVATE_CHILD_SENTINEL') }, ['PRIVATE_OUTPUT_SENTINEL', 'PRIVATE_CHILD_SENTINEL']);
  assert.equal(await readFile(ws.output, 'utf8'), 'PRIVATE_OUTPUT_SENTINEL');
});

test('ADK CLI: auto and explicit conversion preserve snapshots, notices, and pass bundle checks', async t => {
  for (const explicit of [false, true]) await t.test(String(explicit), async t => {
    const ws = await workspace(t);
    await assemble(ws.input, 'adk');
    await assemble(ws.input, 'markdown');
    await put(ws.input, 'unreachable.yaml', Buffer.from([0xff]));
    const result = invoke([ws.input, ws.output, ...(explicit ? ['--layout', 'adk'] : [])]);
    success(result);
    assert.match(result.stdout, /Not converted for specialist:.*model.*tools|Not converted for specialist:.*tools.*model/);
    await snapshots(ws.output, 'adk');
    const input = await bundleInput(ws.output);
    assert.deepEqual(input.network.tools.map(agent => [agent.name, agent.tools]),
      [['coordinator', ['specialist']], ['researcher', []], ['specialist', ['researcher']]]);
    assert.equal(validateNetwork(input).valid, true);
    const tree = await publicationTree(ws.root, ws.output);
    const report = await checkConformance({ root: pathToFileURL(`${tree}/`) });
    assert.equal(report.valid, true, JSON.stringify(report.checks));
    const checked = runConformance(tree);
    assert.equal(checked.status, 0, checked.stdout);
    // Theora wins even over the ADK root; explicit ADK remains available.
    await assemble(ws.input, 'theora');
    success(invoke([ws.input, ws.output]));
    await snapshots(ws.output, 'theora');
  });
});

test('ADK CLI: referenced input failures are atomic and diagnostics never echo source values', async t => {
  const root = 'name: root\ninstruction: Answer public questions.\nsub_agents:\n  - config_path: child.yaml\n';
  for (const [label, records, options] of [
    ['missing', [['root_agent.yaml', root]], []],
    ['UTF-8', [['root_agent.yaml', root], ['child.yaml', Buffer.from([0xff])]], []],
    ['unsafe path', [['root_agent.yaml', root.replace('child.yaml', '../PRIVATE_SOURCE_SENTINEL.yaml')]], []],
    ['duplicate', [['root_agent.yaml', root + '  - config_path: child.yaml\n'], ['child.yaml', 'name: child\ninstruction: Reply.']], []],
    ['code', [['root_agent.yaml', root.replace('config_path: child.yaml', 'code: PRIVATE_SOURCE_SENTINEL')]], []],
    ['cycle', [['root_agent.yaml', root.replace('child.yaml', 'root_agent.yaml')]], []],
    ['case-sensitive reference', [['root_agent.yaml', root], ['Child.yaml', 'name: child\ninstruction: Reply.']], []],
    ['front', [['root_agent.yaml', root], ['child.yaml', 'name: child\ninstruction: Reply.']], ['--front', 'child']],
    ['explicit missing root', [['reader.md', '# Reader']], ['--layout', 'adk']],
  ]) await t.test(label, async t => {
    const ws = await workspace(t);
    for (const [path, content] of records) await put(ws.input, path, content);
    await failure(invoke([ws.input, ws.output, ...options]), ws, ['PRIVATE_SOURCE_SENTINEL']);
  });
});

test('ADK CLI: symlinked references and directories are never followed', async t => {
  for (const kind of ['file', 'dir']) await t.test(kind, async t => {
    const ws = await workspace(t);
    const external = join(ws.root, 'external');
    await mkdir(external);
    await put(external, 'child.yaml', 'name: child\ninstruction: Reply.');
    const path = kind === 'file' ? 'child.yaml' : 'nested/child.yaml';
    await put(ws.input, 'root_agent.yaml', `name: root\ninstruction: Answer.\nsub_agents:\n  - config_path: ${path}\n`);
    try { await symlink(kind === 'file' ? join(external, 'child.yaml') : external,
      join(ws.input, kind === 'file' ? 'child.yaml' : 'nested'), kind); }
    catch (error) {
      if (['EPERM', 'ENOSYS'].includes(error.code)) return t.skip('Host does not permit symlink creation.');
      throw error;
    }
    await failure(invoke([ws.input, ws.output]), ws);
  });
});

test('ADK CLI: only reached files must be readable', async t => {
  if (process.platform === 'win32' || process.getuid?.() === 0) return t.skip('Host permissions cannot enforce mode 000.');
  const ws = await workspace(t);
  await put(ws.input, 'root_agent.yaml', 'name: root\ninstruction: Reply.');
  await put(ws.input, 'child.yaml', 'name: child\ninstruction: Reply.');
  const child = join(ws.input, 'child.yaml');
  await chmod(child, 0);
  try {
    success(invoke([ws.input, ws.output]));
    await rm(ws.output, { recursive: true });
    await put(ws.input, 'root_agent.yaml', 'name: root\ninstruction: Reply.\nsub_agents:\n - config_path: child.yaml');
    await failure(invoke([ws.input, ws.output]), ws);
  } finally { await chmod(child, 0o600); }
});

test('ADK CLI: notice names are sanitized and values stay out of artifacts and diagnostics', async t => {
  const ws = await workspace(t);
  await put(ws.input, 'root_agent.yaml', 'name: root\ninstruction: Reply.\ntools: PRIVATE_VALUE_SENTINEL\nmodel: PRIVATE_VALUE_SENTINEL\nghp_abcdefgh: PRIVATE_VALUE_SENTINEL\n/private/key: PRIVATE_VALUE_SENTINEL\n');
  const result = invoke([ws.input, ws.output]);
  success(result);
  assert.match(result.stdout, /model.*tools|tools.*model/);
  assert.match(result.stdout, /2 additional key names withheld/);
  for (const name of artifacts) assert.doesNotMatch(await readFile(join(ws.output, name), 'utf8'), /PRIVATE_VALUE_SENTINEL|ghp_abcdefgh|\/private\/key/);
  assert.doesNotMatch(result.stdout + result.stderr, /PRIVATE_VALUE_SENTINEL|ghp_abcdefgh|\/private\/key/);
});
