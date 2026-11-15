import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { AgentNetwork, validateNetwork } from '../site-b/runtime/kernel.js';
import { manifestAllowsPeer } from '../site-a/runtime/engine.js';

const siteA = new URL('../site-a/', import.meta.url);
const siteB = new URL('../site-b/', import.meta.url);
const readJSON = async url => JSON.parse(await readFile(url, 'utf8'));

test('peer: Site A maps review_desk to the reserved Spec Scout network URL', async () => {
  const links = await readJSON(new URL('links.json', siteA));
  assert.deepEqual(links, {
    version: 1,
    networks: {
      review_desk: { spec_scout: 'https://spec-scout.invalid/spec_scout' },
    },
  });
  const manifestA = await readJSON(new URL('agent-manifest.json', siteA));
  const manifestB = await readJSON(new URL('agent-manifest.json', siteB));
  assert.deepEqual(Object.keys(links.networks), manifestA.networks.map(entry => entry.name));
  // Deployment URL changes must update links.json and allowed_peers together.
  const peerOrigins = [...new Set(Object.values(links.networks)
    .flatMap(bindings => Object.values(bindings)).map(target => new URL(target).origin))];
  assert.deepEqual(manifestA.allowed_peers, peerOrigins);
  assert.deepEqual(manifestA.peer_policy, { mode: 'closed' });
  const peer = new URL(links.networks.review_desk.spec_scout);
  assert.equal(peer.pathname.split('/').pop(), manifestB.networks[0].name);
  // B deploys at root; peer site bases in general may also contain a path prefix.
  assert.equal(new URL('./agent-manifest.json', peer).href,
    'https://spec-scout.invalid/agent-manifest.json');
});

test('peer: Site A closed policy permits only the declared Spec Scout origin', async () => {
  const manifest = await readJSON(new URL('agent-manifest.json', siteA));
  for (const [target, allowed] of [
    ['https://spec-scout.invalid/spec_scout', true],
    ['https://spec-scout.invalid/agents/spec_scout', true],
    ['https://other.invalid/spec_scout', false],
    ['https://spec-scout.invalid.attacker.invalid/spec_scout', false],
    ['http://spec-scout.invalid/spec_scout', false],
    ['https://spec-scout.invalid:8443/spec_scout', false],
  ]) {
    assert.equal(manifestAllowsPeer(target, manifest), allowed, target);
  }
});

// The published name is the exact final URL segment used by the spec_scout link.
test('peer: Site B publishes the exact spec_scout network name', async () => {
  const manifest = await readJSON(new URL('agent-manifest.json', siteB));
  assert.equal(manifest.brand, 'Spec Scout');
  assert.equal(manifest.networks.length, 1);
  const [entry] = manifest.networks;
  assert.equal(entry.name, 'spec_scout');
  assert.equal(entry.front_man, 'spec_scout');
  assert.equal(entry.hocon, './spec_scout.network.json');
  assert.ok(entry.description.trim());
  assert.deepEqual(manifest.llm_router, {
    base_url: 'https://api.otari.ai/api/v1', mock: false,
    byok_router: 'https://api.otari.ai/api/v1',
  });
  assert.equal(manifest.deployment.mode, 'static');
  assert.equal(manifest.peer_policy.mode, 'closed');
  assert.deepEqual(manifest.allowed_peers, []);
  assert.equal(manifest.actions, undefined, 'Spec Scout must not publish site actions');
  assert.equal(manifest.coded_tools, undefined, 'the peer needs no publisher executable code');
});

test('peer: Site B manifest resolves to the informational one-agent network', async () => {
  const manifest = await readJSON(new URL('agent-manifest.json', siteB));
  const [entry] = manifest.networks;
  const config = await readJSON(new URL(entry.hocon, siteB));
  assert.deepEqual(config.tools.map(agent => agent.name), ['spec_scout']);
  const [scout] = config.tools;
  assert.deepEqual(scout.tools, []);
  assert.equal(scout.class, undefined);
  assert.equal(scout.toolbox, undefined);
  assert.ok(scout.instructions.trim());
  const network = new AgentNetwork(config, entry.name);
  assert.equal(network.findFrontMan(), entry.front_man);
  assert.deepEqual(validateNetwork(network), { errors: [], warnings: [], externals: [], mcps: [] });
});
