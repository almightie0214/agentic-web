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
    'site-b/agent-manifest.json', 'site-b/spec_scout.network.json']) {
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
