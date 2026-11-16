import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFile, cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { checkConformance } from '../tools/check-conformance.mjs';
import { validateNetwork } from '../site-a/validator-rules.mjs';

const repository = fileURLToPath(new URL('../', import.meta.url));
const readJSON = async path => JSON.parse(await readFile(path, 'utf8'));
const writeJSON = (path, value) => writeFile(path, JSON.stringify(value));
const slydataSample = 'samples/test-slydata.network.json';

async function fixture(t) {
  const scratch = join(repository, '.theora');
  await mkdir(scratch, { recursive: true });
  const root = await mkdtemp(join(scratch, 'conformance-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const site of ['site-a', 'site-b', 'tools', 'site-a/samples']) await mkdir(join(root, site));
  for (const path of ['tools/check-conformance.mjs', 'site-a/validator-rules.mjs', 'site-a/agent-manifest.json',
    'site-a/review_desk.network.json', 'site-a/links.json', 'site-a/actions.js', `site-a/${slydataSample}`,
    'site-b/agent-manifest.json', 'site-b/spec_scout.network.json', 'site-b/_headers']) {
    await copyFile(join(repository, path), join(root, path));
  }
  // Copy the real AW2 module's dependencies without changing them. No vendor
  // loader is run or mocked; only the publication artifacts are mutated.
  await cp(join(repository, 'site-a/runtime'), join(root, 'site-a/runtime'), { recursive: true });
  return {
    root,
    async edit(path, mutate) {
      const file = join(root, path);
      const value = await readJSON(file);
      mutate(value);
      await writeJSON(file, value);
    },
    run() {
      const result = spawnSync(process.execPath, [join(root, 'tools/check-conformance.mjs')],
        { cwd: root, encoding: 'utf8', timeout: 15_000 });
      assert.equal(result.error, undefined);
      assert.equal(result.signal, null);
      return result;
    },
  };
}

test('conformance: actual artifacts preserve shared AW2 reports and runtime uncertainty', async t => {
  t.mock.method(globalThis, 'fetch', () => { throw new Error('Static CLI must not fetch.'); });
  const report = await checkConformance();
  assert.equal(report.valid, true);
  for (const site of ['site-a', 'site-b']) {
    const manifest = await readJSON(join(repository, site, 'agent-manifest.json'));
    const network = await readJSON(join(repository, site, manifest.networks[0].hocon));
    assert.equal(network.llm_config.temperature, 0.2);
    const links = site === 'site-a' ? await readJSON(join(repository, site, 'links.json')) : undefined;
    const expected = validateNetwork({ manifest, network, links, networkName: manifest.networks[0].name });
    assert.deepEqual(report.checks.filter(check => check.site === site && !check.sample && !check.ruleId.startsWith('publication.'))
      .map(({ site, networkName, ...check }) => check), expected.checks);
    assert.ok(report.checks.some(check => check.site === site && check.ruleId === 'runtime.safety'
      && check.status === 'unverified'));
  }
  // The real root CLI is independent of the invoking working directory.
  const result = spawnSync(process.execPath, [join(repository, 'tools/check-conformance.mjs')],
    { cwd: join(repository, 'site-b'), encoding: 'utf8', timeout: 15_000 });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Static repository conformance: PASS/);
  assert.match(result.stdout, /exact-name loader refusal.*remain unverified/);
  assert.match(result.stdout, /duplicate-agent and wrong explicit peer-name refusal before any model call in a real browser/);
  assert.ok(report.checks.some(check => check.ruleId === 'publication.cors' && check.status === 'pass'));
  assert.ok(report.checks.some(check => check.ruleId === 'publication.private_context' && check.status === 'pass'));
  assert.doesNotMatch(result.stdout, /\[pass\].*runtime\.(safety|composition)/);
});

test('conformance: sly_data sample shares static rules without claiming runtime injection', async t => {
  t.mock.method(globalThis, 'fetch', () => { throw new Error('Static sample checks must not fetch.'); });
  const input = await readJSON(join(repository, 'site-a', slydataSample));
  assert.equal(input.manifest.networks[0].name, 'test_slydata');
  assert.equal(input.manifest.networks[0].front_man, 'context_probe');
  assert.deepEqual(input.network.sly_data, {
    private_sentinel: 'AW4_PRIVATE_SENTINEL_NOT_A_SECRET',
    public_sentinel: 'AW4_PUBLIC_SENTINEL_NOT_A_SECRET',
  });
  const front = input.network.tools.find(agent => agent.name === 'context_probe');
  assert.deepEqual(front.allow.to_downstream.sly_data, ['public_sentinel']);
  assert.deepEqual(front.allow.to_upstream.sly_data, []);
  const expected = validateNetwork(input);
  assert.equal(expected.valid, true);
  const report = await checkConformance();
  assert.equal(report.valid, true);
  const checks = report.checks.filter(check => check.sample === slydataSample);
  assert.ok(checks.length > 0);
  assert.ok(checks.every(check => check.site === 'site-a' && check.path.startsWith(`/${slydataSample}`)));
  assert.deepEqual(checks.filter(check => !check.ruleId.startsWith('publication.'))
    .map(({ site, sample, networkName, path, ...check }) => ({ ...check, path: path.slice(slydataSample.length + 1) })),
  expected.checks);
  assert.ok(checks.some(check => check.ruleId === 'publication.file' && check.status === 'pass'));
  assert.ok(checks.some(check => check.ruleId === 'publication.private_context' && check.status === 'warning'
    && check.path === `/${slydataSample}/network/tools/0/allow/to_downstream/sly_data`));
  assert.ok(checks.some(check => check.ruleId === 'publication.private_context' && check.status === 'pass'
    && check.path === `/${slydataSample}/network/tools/0/allow/to_upstream/sly_data`));
  assert.ok(checks.some(check => check.ruleId === 'publication.private_context' && check.status === 'warning'
    && check.path === `/${slydataSample}/network/sly_data`
    && /Published sly_data is public JSON, not invocation context or evidence of injection/.test(check.message)));
  for (const rule of ['runtime.safety', 'runtime.composition']) {
    assert.ok(checks.some(check => check.ruleId === rule && check.status === 'unverified'));
    assert.ok(checks.filter(check => check.ruleId === rule).every(check => check.status === 'unverified'));
  }
  const result = spawnSync(process.execPath, [join(repository, 'tools/check-conformance.mjs')],
    { cwd: repository, encoding: 'utf8', timeout: 15_000 });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /site-a\/sample:samples\/test-slydata.network.json publication.private_context/);
  for (const sentinel of Object.values(input.network.sly_data)) {
    assert.ok(!JSON.stringify(report).includes(sentinel), 'Reports must not print sentinel values.');
    assert.ok(!result.stdout.includes(sentinel), 'CLI must not print sentinel values.');
  }
});

test('conformance: artifact and shared-rule failures reach CLI diagnostics and exit 1', async t => {
  const cases = [
    { name: 'missing sly_data sample', async change(f) {
      await rm(join(f.root, 'site-a', slydataSample));
    }, pattern: /\[fail\] site-a\/sample:samples\/test-slydata.network.json publication.file \/samples\/test-slydata.network.json/ },
    { name: 'invalid sly_data sample JSON', async change(f) {
      await writeFile(join(f.root, 'site-a', slydataSample), '{broken');
    }, pattern: /\[fail\] site-a\/sample:samples\/test-slydata.network.json publication.file \/samples\/test-slydata.network.json/ },
    { name: 'non-object sample network', async change(f) {
      await f.edit(`site-a/${slydataSample}`, doc => { doc.network = null; });
    }, pattern: /\[fail\] site-a\/sample:samples\/test-slydata.network.json network.document \/samples\/test-slydata.network.json\/network/ },
    { name: 'sample front man missing', async change(f) {
      await f.edit(`site-a/${slydataSample}`, doc => { delete doc.manifest.networks[0].front_man; });
    }, pattern: /\[fail\] site-a\/sample:samples\/test-slydata.network.json manifest.front_man \/samples\/test-slydata.network.json\/manifest\/networks\/0\/front_man/ },
    { name: 'sample duplicate agent', async change(f) {
      await f.edit(`site-a/${slydataSample}`, doc => { doc.network.tools.push(structuredClone(doc.network.tools[0])); });
    }, pattern: /\[fail\] site-a\/sample:samples\/test-slydata.network.json agent.name \/samples\/test-slydata.network.json\/network\/tools\/\d+\/name/ },
    { name: 'sample invalid schema', async change(f) {
      await f.edit(`site-a/${slydataSample}`, doc => { doc.network.tools[0].function.parameters = { type: 'invalid-type' }; });
    }, pattern: /\[fail\] site-a\/sample:samples\/test-slydata.network.json agent.parameters \/samples\/test-slydata.network.json\/network\/tools\/0\/function\/parameters\/type/ },
    { name: 'sample unsupported schema', async change(f) {
      await f.edit(`site-a/${slydataSample}`, doc => { doc.network.tools[0].function.parameters = { $schema: 'https://schema.invalid/custom' }; });
    }, pattern: /\[unverified\] site-a\/sample:samples\/test-slydata.network.json agent.parameters \/samples\/test-slydata.network.json\/network\/tools\/0\/function\/parameters/ },
    { name: 'sample unresolved include', async change(f) {
      await f.edit(`site-a/${slydataSample}`, doc => { doc.network.include = 'private.conf'; });
    }, pattern: /\[fail\] site-a\/sample:samples\/test-slydata.network.json network.resolved \/samples\/test-slydata.network.json\/network\/include/ },
    { name: 'sample wildcard disclosure', async change(f) {
      await f.edit(`site-a/${slydataSample}`, doc => { doc.network.tools[0].allow.to_downstream.sly_data = ['*']; });
    }, pattern: /\[fail\] site-a\/sample:samples\/test-slydata.network.json publication.private_context \/samples\/test-slydata.network.json\/network\/tools\/0\/allow\/to_downstream\/sly_data/ },
    { name: 'sample malformed allow', async change(f) {
      await f.edit(`site-a/${slydataSample}`, doc => { doc.network.tools[0].allow = false; });
    }, pattern: /\[fail\] site-a\/sample:samples\/test-slydata.network.json publication.private_context \/samples\/test-slydata.network.json\/network\/tools\/0\/allow/ },
    { name: 'missing definition', async change(f) { await rm(join(f.root, 'site-b/spec_scout.network.json')); }, pattern: /\[fail\] site-b publication.file/ },
    { name: 'invalid manifest JSON', async change(f) { await writeFile(join(f.root, 'site-a/agent-manifest.json'), '{broken'); }, pattern: /\[fail\] site-a publication.file \/manifest/ },
    { name: 'invalid definition JSON', async change(f) { await writeFile(join(f.root, 'site-b/spec_scout.network.json'), 'include "private.conf"'); }, pattern: /\[fail\] site-b publication.file/ },
    { name: 'invalid links JSON', async change(f) { await writeFile(join(f.root, 'site-a/links.json'), '{'); }, pattern: /\[fail\] site-a publication.file \/links/ },
    { name: 'second manifest entry', async change(f) {
      await f.edit('site-b/agent-manifest.json', doc => doc.networks.push({ name: 'another', front_man: 'missing', hocon: './spec_scout.network.json' }));
    }, pattern: /\[fail\] site-b\/another network.front_man.exists/ },
    { name: 'duplicate agent', async change(f) {
      await f.edit('site-a/review_desk.network.json', doc => { doc.tools[1].name = doc.tools[0].name; });
    }, pattern: /\[fail\] site-a\/review_desk agent.name \/network\/tools\/1\/name/ },
    { name: 'undefined local reference', async change(f) {
      await f.edit('site-b/spec_scout.network.json', doc => { doc.tools[0].tools = ['missing_agent']; });
    }, pattern: /\[fail\] site-b\/spec_scout tool.local/ },
    { name: 'unsupported schema is blocking, not a runtime unverified observation', async change(f) {
      await f.edit('site-b/spec_scout.network.json', doc => { doc.tools[0].function.parameters.$schema = 'https://schema.invalid/custom'; });
    }, pattern: /\[unverified\] site-b\/spec_scout agent.parameters/ },
    { name: 'stale link network key', async change(f) {
      await f.edit('site-a/links.json', doc => { doc.networks.stale = doc.networks.review_desk; delete doc.networks.review_desk; });
    }, pattern: /\[fail\] site-a publication.links.network \/links\/networks\/stale/ },
    { name: 'undeclared link slot', async change(f) {
      await f.edit('site-a/links.json', doc => { doc.networks.review_desk.stale = doc.networks.review_desk.spec_scout; });
    }, pattern: /\[fail\] site-a\/review_desk publication.links.slot .*\/stale/ },
    { name: 'wrong explicit peer name in local wiring, not a loader execution test', async change(f) {
      await f.edit('site-a/links.json', doc => { doc.networks.review_desk.spec_scout = 'https://spec-scout.invalid/Spec_Scout'; });
    }, pattern: /\[fail\] site-a\/review_desk publication.links.target/ },
    { name: 'duplicate manifest name', async change(f) {
      await f.edit('site-b/agent-manifest.json', doc => { doc.networks.push({ ...doc.networks[0] }); });
    }, pattern: /\[fail\] site-b publication.name \/manifest\/networks\/1\/name/ },
    { name: 'missing action module', async change(f) { await rm(join(f.root, 'site-a/actions.js')); }, pattern: /\[fail\] site-a publication.file \/manifest\/actions\/module/ },
    { name: 'non-object links', async change(f) { await writeJSON(join(f.root, 'site-a/links.json'), []); }, pattern: /\[fail\] site-a publication.links/ },
    { name: 'malformed definition reference cannot break diagnostics', async change(f) {
      await f.edit('site-b/agent-manifest.json', doc => { doc.networks[0].hocon = { toString: null }; });
    }, pattern: /\[fail\] site-b publication.file/ },
    { name: 'malformed published name cannot break diagnostics', async change(f) {
      await f.edit('site-b/agent-manifest.json', doc => { doc.networks[0].name = { toString: null }; });
    }, pattern: /manifest.name/ },
    { name: 'empty manifest networks', async change(f) {
      await f.edit('site-b/agent-manifest.json', doc => { doc.networks = []; });
    }, pattern: /\[fail\] site-b manifest.networks/ },
    { name: 'null manifest entry', async change(f) {
      await f.edit('site-b/agent-manifest.json', doc => { doc.networks = [null]; });
    }, pattern: /manifest.name/ },
  ];
  for (const row of cases) await t.test(row.name, async t => {
    const f = await fixture(t);
    await row.change(f);
    const result = f.run();
    assert.equal(result.status, 1, result.stdout);
    assert.match(result.stdout, row.pattern);
    assert.match(result.stdout, /Static repository conformance: FAIL/);
    assert.match(result.stdout, /remain unverified/);
  });
});

test('conformance: private-context declarations are audited without claiming injection or filtering', async t => {
  for (const row of [
    { name: 'omitted', status: 'pass' },
    { name: 'explicit deny', allow: { to_downstream: { sly_data: [] }, to_upstream: { sly_data: null } }, status: 'pass' },
    { name: 'named exception', allow: { to_downstream: { sly_data: ['public_sentinel'] } }, status: 'warning' },
    { name: 'wildcard', allow: { to_downstream: { sly_data: ['*'] } }, status: 'fail' },
    { name: 'string not array', allow: { to_downstream: { sly_data: 'public_sentinel' } }, status: 'fail' },
    { name: 'duplicate field', allow: { to_upstream: { sly_data: ['sentinel', 'sentinel'] } }, status: 'fail' },
    { name: 'blank field', allow: { to_upstream: { sly_data: [' '] } }, status: 'fail' },
    { name: 'non-string field', allow: { to_upstream: { sly_data: [{}] } }, status: 'fail' },
    { name: 'malformed direction', allow: { to_upstream: [] }, status: 'fail' },
    { name: 'malformed allow', allow: false, status: 'fail' },
  ]) await t.test(row.name, async t => {
    const f = await fixture(t);
    await f.edit('site-b/spec_scout.network.json', doc => {
      if (row.allow !== undefined) doc.tools[0].allow = row.allow;
      doc.sly_data = { private_sentinel: 'DO_NOT_PRINT_SENTINEL_VALUE' };
    });
    const result = f.run();
    assert.equal(result.status, row.status === 'fail' ? 1 : 0, result.stdout);
    assert.match(result.stdout, new RegExp(`\\[${row.status}\\] site-b/spec_scout publication.private_context /network/tools/0/allow`));
    assert.match(result.stdout, /Published sly_data is public JSON, not invocation context or evidence of injection/);
    assert.doesNotMatch(result.stdout, /DO_NOT_PRINT_SENTINEL_VALUE/);
    assert.match(result.stdout, /\[unverified\].*runtime.safety/);
  });
});

test('conformance: CORS audit covers actual public artifacts and conflicting matching rules', async t => {
  for (const row of [
    { name: 'missing file', source: null, ok: false, rule: 'publication.file' },
    { name: 'comment only', source: '# Access-Control-Allow-Origin: *', ok: false },
    { name: 'wrong origin', source: '/*\n  Access-Control-Allow-Origin: https://other.invalid', ok: false },
    { name: 'wrong scope', source: '/private/*\n  Access-Control-Allow-Origin: *', ok: false },
    { name: 'manifest only', source: '/agent-manifest.json\n  Access-Control-Allow-Origin: *', ok: false },
    { name: 'duplicate header', source: '/*\n  Access-Control-Allow-Origin: *\n  access-control-allow-origin: *', ok: false },
    { name: 'overlapping conflict', source: '/*\n  Access-Control-Allow-Origin: *\n/spec_scout.network.json\n  Access-Control-Allow-Origin: https://other.invalid', ok: false },
    { name: 'removal', source: '/*\n  Access-Control-Allow-Origin: *\n/spec_scout.network.json\n  ! Access-Control-Allow-Origin', ok: false },
    { name: 'malformed', source: '/*\n  Access-Control-Allow-Origin *', ok: false },
    { name: 'orphan header', source: '  Access-Control-Allow-Origin: *', ok: false },
    { name: 'unsupported URL rule', source: 'https://peer.invalid/*\n  Access-Control-Allow-Origin: *', ok: false },
    { name: 'case insensitive with CRLF', source: '/*\r\n  access-control-allow-origin: *\r\n  ! X-Frame-Options', ok: true },
    { name: 'separate exact rules', source: '/agent-manifest.json\n  Access-Control-Allow-Origin: *\n/spec_scout.network.json\n  Access-Control-Allow-Origin: *', ok: true },
    { name: 'unrelated private rule', source: '/*\n  Access-Control-Allow-Origin: *\n/private/*\n  Access-Control-Allow-Origin: https://other.invalid', ok: true },
  ]) await t.test(row.name, async t => {
    const f = await fixture(t);
    if (row.source === null) await rm(join(f.root, 'site-b/_headers'));
    else await writeFile(join(f.root, 'site-b/_headers'), row.source);
    const result = f.run();
    assert.equal(result.status, row.ok ? 0 : 1, result.stdout);
    assert.match(result.stdout, new RegExp(`\\[${row.ok ? 'pass' : 'fail'}\\] site-b ${row.rule ?? 'publication.cors'} /_headers`));
    assert.match(result.stdout, /live HTTPS\/CORS.*remain unverified/);
  });
  // A nested definition path comes from the manifest, not a fixed filename list.
  const f = await fixture(t);
  await mkdir(join(f.root, 'site-b/definitions'));
  await copyFile(join(f.root, 'site-b/spec_scout.network.json'), join(f.root, 'site-b/definitions/public.json'));
  await f.edit('site-b/agent-manifest.json', doc => { doc.networks[0].hocon = './definitions/public.json'; });
  await writeJSON(join(f.root, 'site-b/links.json'), { version: 1, networks: {} });
  await writeFile(join(f.root, 'site-b/_headers'), '/agent-manifest.json\n  Access-Control-Allow-Origin: *\n/definitions/:file\n  Access-Control-Allow-Origin: *');
  const missingLinks = f.run();
  assert.equal(missingLinks.status, 1, missingLinks.stdout);
  assert.match(missingLinks.stdout, /\[pass\] site-b publication.cors \/_headers\/definitions\/public.json/);
  assert.match(missingLinks.stdout, /\[fail\] site-b publication.cors \/_headers\/links.json/);
});

test('conformance: AW2 composition uncertainty and limit warnings remain declaration-only', async t => {
  const f = await fixture(t);
  await f.edit('site-a/review_desk.network.json', doc => { doc.tools[1].tools = ['review_coordinator']; });
  const legalRecursion = f.run();
  assert.equal(legalRecursion.status, 0, legalRecursion.stdout);
  assert.match(legalRecursion.stdout, /\[unverified\].*runtime.composition/);
  assert.match(legalRecursion.stdout, /\[warning\].*execution.limit/);
  assert.doesNotMatch(legalRecursion.stdout, /\[pass\].*runtime\.(composition|safety)/);
  await f.edit('site-a/review_desk.network.json', doc => {
    doc.max_steps = 3;
    doc.max_execution_seconds = 1.5;
  });
  const declared = f.run();
  assert.equal(declared.status, 0, declared.stdout);
  assert.match(declared.stdout, /\[pass\] site-a\/review_desk execution.limit/);
  assert.match(declared.stdout, /not proof of enforcement/);
  for (const [key, value] of [['max_steps', 0], ['max_steps', 1.5], ['max_execution_seconds', -1]]) {
    await f.edit('site-a/review_desk.network.json', doc => { doc.max_steps = 3; doc.max_execution_seconds = 1.5; doc[key] = value; });
    const invalid = f.run();
    assert.equal(invalid.status, 1, invalid.stdout);
    assert.match(invalid.stdout, new RegExp(`\\[fail\\] site-a/review_desk execution.limit /network/${key}`));
  }
});

test('conformance: definition references stay inside each independent publication root', async t => {
  for (const target of ['../site-a/review_desk.network.json', '/site-b/spec_scout.network.json',
    'https://example.invalid/network.json', './%2e%2e/site-a/review_desk.network.json',
    './escape/review_desk.network.json', './']) {
    await t.test(target, async t => {
      const f = await fixture(t);
      if (target === './escape/review_desk.network.json') {
        await symlink(join(f.root, 'site-a'), join(f.root, 'site-b/escape'), 'junction');
      }
      await f.edit('site-b/agent-manifest.json', doc => { doc.networks[0].hocon = target; });
      const result = f.run();
      assert.equal(result.status, 1);
      assert.match(result.stdout, /\[fail\] site-b publication.file \/manifest\/networks\/0\/hocon/);
    });
  }
});

test('conformance: optional links may be absent but not malformed or dangling', async t => {
  const f = await fixture(t);
  assert.equal(f.run().status, 0, 'Site B has no links.json');
  await symlink(join(f.root, 'missing-directory'), join(f.root, 'site-b/links.json'), 'junction');
  const report = await checkConformance({ root: pathToFileURL(`${f.root}/`) });
  assert.equal(report.valid, false);
  assert.ok(report.checks.some(check => check.site === 'site-b' && check.ruleId === 'publication.file'
    && check.path === '/links' && check.status === 'fail'));
});
