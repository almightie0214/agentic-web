import assert from 'node:assert/strict';
import test from 'node:test';
import { auditUrl } from '../site-a/audit.js';
import { validateNetwork } from '../site-a/validator-rules.mjs';
import { fixtures } from './fixtures.mjs';

function publication(input = fixtures.valid) {
  const documents = new Map([
    [new URL('agent-manifest.json', input.baseUrl).href, input.manifest],
    [new URL(input.manifest.networks[0].hocon, input.baseUrl).href, input.network],
    [new URL('links.json', input.baseUrl).href, input.links],
  ]);
  const calls = [];
  const overrides = new Map();
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    if (overrides.has(url)) return overrides.get(url)();
    assert.ok(documents.has(url), `Unexpected request: ${url}`);
    return new Response(JSON.stringify(documents.get(url)), { status: 200 });
  };
  return { documents, calls, overrides, fetchImpl };
}

const base = fixtures.valid.baseUrl;
const manifestUrl = new URL('agent-manifest.json', base).href;
const networkUrl = new URL(fixtures.valid.manifest.networks[0].hocon, base).href;
const linksUrl = new URL('links.json', base).href;

test('audit: bases and manifest URLs preserve deployment subpaths and use public GETs only', async () => {
  for (const url of [base, base.slice(0, -1), manifestUrl, `${manifestUrl}?revision=2#display`]) {
    const site = publication();
    if (url.includes('?')) site.documents.set(`${manifestUrl}?revision=2`, fixtures.valid.manifest);
    const controller = new AbortController();
    const result = await auditUrl(url, { fetchImpl: site.fetchImpl, signal: controller.signal });
    assert.equal(result.baseUrl, base);
    assert.equal(result.manifestUrl, url.includes('?') ? `${manifestUrl}?revision=2` : manifestUrl);
    assert.deepEqual(site.calls.map(call => call.url), [result.manifestUrl, networkUrl, linksUrl]);
    for (const { options } of site.calls) {
      assert.deepEqual(options, { method: 'GET', mode: 'cors', credentials: 'omit', cache: 'no-store', signal: controller.signal });
    }
    assert.deepEqual(result.errors, []);
    assert.equal(result.readiness.status, 'static-ready');
    assert.equal(result.readiness.runtime, 'unverified');
    assert.match(result.readiness.summary, /static checks passed.*Runtime.*unverified/);
    for (const artifact of ['manifest', 'network', 'links']) {
      assert.equal(result.artifacts[artifact].status, 'loaded');
      assert.deepEqual(result.artifacts[artifact].data, fixtures.valid[artifact]);
    }
  }
  const site = publication({ ...fixtures.valid, baseUrl: 'http://localhost:8080/nested/site/' });
  const local = await auditUrl('http://localhost:8080/nested/site', { fetchImpl: site.fetchImpl });
  assert.equal(local.baseUrl, 'http://localhost:8080/nested/site/');
  assert.equal(local.readiness.status, 'static-ready');
});

test('audit: fetched fixture reports exactly reuse deterministic rules and keep violations separate from retrieval', async () => {
  for (const [id, input] of Object.entries(fixtures)) {
    const before = structuredClone(input);
    const site = publication(input);
    const result = await auditUrl(input.baseUrl, { fetchImpl: site.fetchImpl });
    assert.deepEqual(result.input, input);
    assert.deepEqual(result.report, validateNetwork(input));
    assert.deepEqual(result.errors, []);
    assert.equal(result.readiness.status, id === 'valid' ? 'static-ready' : 'blocked');
    assert.equal(result.readiness.runtime, 'unverified');
    assert.deepEqual(input, before);
    assert.equal(site.calls.length, 3, 'do not follow peer references or call an LLM');
  }
});

test('audit: resolves declared definitions against the site base and selects only an exact requested network', async () => {
  for (const hocon of ['./definitions/review.json', '../published/review.json', '/shared/review.json', 'https://cdn.example.test/review.json']) {
    const input = structuredClone(fixtures.valid);
    input.manifest.networks[0].hocon = hocon;
    const site = publication(input);
    const result = await auditUrl(manifestUrl, { fetchImpl: site.fetchImpl });
    assert.equal(result.artifacts.network.url, new URL(hocon, base).href);
    assert.deepEqual(result.report, validateNetwork(input));
    assert.equal(result.baseUrl, base, 'a definition on a CDN does not replace publication identity');
  }
  const input = structuredClone(fixtures.valid);
  input.manifest.networks.unshift({ name: 'another', front_man: 'other', hocon: './another.json' });
  const site = publication();
  site.documents.set(manifestUrl, input.manifest);
  const result = await auditUrl(base, { fetchImpl: site.fetchImpl, networkName: 'artifact_review' });
  assert.deepEqual(result.report, validateNetwork({ ...input, networkName: 'artifact_review' }));
  assert.equal(result.readiness.status, 'static-ready');
  site.calls.length = 0;
  const missing = await auditUrl(base, { fetchImpl: site.fetchImpl, networkName: 'absent' });
  assert.equal(missing.readiness.status, 'blocked');
  assert.deepEqual(missing.errors, []);
  assert.ok(missing.report.checks.some(check => check.ruleId === 'manifest.selection' && check.status === 'fail'));
  assert.deepEqual(site.calls.map(call => call.url), [manifestUrl, linksUrl]);
});

test('audit: published links are passed to rules without traversing or invoking peers', async () => {
  const input = structuredClone(fixtures.valid);
  input.network.link_slots = { scout: {} };
  input.network.tools[1].tools = ['scout'];
  input.links.networks.artifact_review.scout = 'https://peer.example.test/agents/scout';
  const site = publication(input);
  const result = await auditUrl(base, { fetchImpl: site.fetchImpl });
  assert.deepEqual(result.report, validateNetwork(input));
  assert.equal(result.report.valid, true);
  assert.equal(site.calls.length, 3);
  input.links.networks.artifact_review.scout = new URL('artifact_review', base).href;
  const self = publication(input);
  const cycle = await auditUrl(base, { fetchImpl: self.fetchImpl });
  assert.equal(cycle.readiness.status, 'blocked');
  assert.ok(cycle.report.checks.some(check => check.ruleId === 'peer.composition' && check.status === 'fail'));
});

test('audit: fetch, HTTP, body-read, JSON, and cancellation failures never become rule violations or a certain CORS cause', async () => {
  const cases = [
    { kind: 'fetch', response() { throw new TypeError('Failed to fetch'); } },
    { kind: 'http', response: () => new Response('not found', { status: 404 }) },
    { kind: 'http', response: () => new Response('unavailable', { status: 503 }) },
    { kind: 'json', response: () => new Response('<html>static host fallback</html>') },
    { kind: 'json', response: () => new Response('{ "unfinished":') },
    { kind: 'fetch', response: () => ({ ok: true, status: 200, text: async () => { throw new Error('stream disconnected'); } }) },
    { kind: 'aborted', response() { throw new DOMException('Cancelled', 'AbortError'); }, abort: true },
  ];
  for (const artifact of ['manifest', 'network', 'links']) {
    const url = { manifest: manifestUrl, network: networkUrl, links: linksUrl }[artifact];
    for (const row of cases) {
      const site = publication();
      site.overrides.set(url, row.response);
      const controller = new AbortController();
      if (row.abort) controller.abort();
      const result = await auditUrl(base, { fetchImpl: site.fetchImpl, signal: controller.signal });
      assert.equal(result.readiness.status, 'incomplete', `${artifact}: ${row.kind}`);
      assert.equal(result.report, null, 'unavailable input must not produce fabricated rule failures');
      assert.equal(result.errors.length, 1);
      assert.equal(result.errors[0].artifact, artifact);
      assert.equal(result.errors[0].url, url);
      assert.equal(result.errors[0].kind, row.kind);
      assert.ok(result.errors[0].hint);
      assert.equal(result.artifacts[artifact].status, 'failed');
      if (row.kind === 'http') assert.ok([404, 503].includes(result.errors[0].httpStatus));
      if (row.kind === 'fetch') assert.doesNotMatch(result.errors[0].message, /caused by CORS|CORS blocked/i);
      assert.match(result.readiness.summary, /does not establish a rule violation or a CORS cause/);
      assert.equal(site.calls.length, artifact === 'manifest' ? 1 : 3);
    }
  }
});

test('audit: invalid manifest structure and unsafe definition references are reported without spurious fetch failures', async () => {
  for (const manifest of [null, [], {}, { networks: [] }, { networks: [null] }, { networks: [{ name: 'broken' }] }]) {
    const site = publication();
    site.documents.set(manifestUrl, manifest);
    const result = await auditUrl(base, { fetchImpl: site.fetchImpl });
    assert.equal(result.readiness.status, 'blocked');
    assert.deepEqual(result.errors, []);
    assert.equal(result.report.valid, false);
    assert.ok(result.report.checks.some(check => check.status === 'fail'));
    assert.ok(result.report.checks.every(check => check.ruleId.startsWith('manifest.')));
    assert.deepEqual(site.calls.map(call => call.url), [manifestUrl, linksUrl]);
  }
  for (const hocon of [null, 42, '', ' ', 'file:///private/network.json', 'javascript:alert(1)', 'https://name:secret@host.test/definition.json', 'https://[invalid']) {
    const site = publication();
    const manifest = structuredClone(fixtures.valid.manifest);
    manifest.networks[0].hocon = hocon;
    site.documents.set(manifestUrl, manifest);
    const result = await auditUrl(base, { fetchImpl: site.fetchImpl });
    assert.equal(result.readiness.status, 'blocked', String(hocon));
    assert.deepEqual(result.errors, []);
    assert.ok(result.report.checks.some(check => check.path === '/manifest/networks/0/hocon' && check.status === 'fail'));
    assert.equal(site.calls.length, 2);
  }
});

test('audit: invalid audit targets are rejected before network contact', async () => {
  for (const value of [undefined, null, 42, '', 'not a URL', '/relative/', 'file:///site/', 'ftp://host.test/site/', 'http://public.example.test/site/', 'https://user:secret@host.test/site/']) {
    const site = publication();
    const result = await auditUrl(value, { fetchImpl: site.fetchImpl });
    assert.equal(result.readiness.status, 'incomplete');
    assert.equal(result.errors[0].kind, 'input');
    assert.equal(result.report, null);
    assert.equal(site.calls.length, 0);
  }
});

test('audit: unknown schema dialects remain unverified rather than static-ready or invalid', async () => {
  const input = structuredClone(fixtures.valid);
  input.network.tools[1].function.parameters = { $schema: 'https://schemas.example.test/custom' };
  const site = publication(input);
  const result = await auditUrl(base, { fetchImpl: site.fetchImpl });
  assert.deepEqual(result.report, validateNetwork(input));
  assert.deepEqual(result.errors, []);
  assert.equal(result.report.checks.some(check => check.status === 'fail'), false);
  assert.equal(result.readiness.status, 'incomplete');
  assert.match(result.readiness.summary, /static conformance remains unverified/);
});
