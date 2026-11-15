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

async function fixture(t) {
  const scratch = join(repository, '.theora');
  await mkdir(scratch, { recursive: true });
  const root = await mkdtemp(join(scratch, 'conformance-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const site of ['site-a', 'site-b', 'tools']) await mkdir(join(root, site));
  for (const path of ['tools/check-conformance.mjs', 'site-a/validator-rules.mjs', 'site-a/agent-manifest.json',
    'site-a/review_desk.network.json', 'site-a/links.json', 'site-a/actions.js',
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
    const links = site === 'site-a' ? await readJSON(join(repository, site, 'links.json')) : undefined;
    const expected = validateNetwork({ manifest, network, links, networkName: manifest.networks[0].name });
    assert.deepEqual(report.checks.filter(check => check.site === site && !check.ruleId.startsWith('publication.'))
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

test('conformance: artifact and shared-rule failures reach CLI diagnostics and exit 1', async t => {
  const cases = [
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
