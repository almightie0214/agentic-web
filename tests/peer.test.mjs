import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { AgentNetwork, validateNetwork } from '../site-b/runtime/kernel.js';
import { Engine, manifestAllowsPeer } from '../site-a/runtime/engine.js';
import { buildToolTable, dispatchToolCall } from '../site-a/runtime/runner.js';

const siteA = new URL('../site-a/', import.meta.url);
const siteB = new URL('../site-b/', import.meta.url);
const readJSON = async url => JSON.parse(await readFile(url, 'utf8'));

test('peer: Site A maps review_desk to the public Spec Scout network URL', async () => {
  const links = await readJSON(new URL('links.json', siteA));
  assert.deepEqual(links, {
    version: 1,
    networks: {
      review_desk: { spec_scout: 'https://spec-scout.pages.dev/spec_scout' },
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
    `${peer.origin}/agent-manifest.json`);
});

test('peer: Site B configures public artifact CORS for Cloudflare Pages (not live response evidence)', async () => {
  const headers = await readFile(new URL('_headers', siteB), 'utf8');
  // Cover the public static bundle, not just the HTML entry page.
  assert.match(headers, /^\/\*\r?\n[ \t]+Access-Control-Allow-Origin:[ \t]*\*[ \t]*$/m);
  assert.doesNotMatch(headers, /Access-Control-Allow-Credentials:[ \t]*true/i);
});

test('peer: Site B publishes a script-free top-level 404 page to disable the Pages SPA fallback (not live response evidence)', async () => {
  const html = await readFile(new URL('404.html', siteB), 'utf8');
  assert.match(html, /<!doctype html>/i);
  assert.match(html, /<html\s+lang="en">/i);
  assert.match(html, /<h1>[^<]+<\/h1>/i);
  assert.doesNotMatch(html, /<script\b|\bon\w+\s*=|javascript:/i);
});

test('peer: Site A Pages artifact preserves separate publication roots (not activation evidence)', async () => {
  const workflow = await readFile(new URL('../.github/workflows/pages.yml', import.meta.url), 'utf8');
  // Missing workflow or uploading the repository root would break the two-host handoff.
  assert.match(workflow, /uses: actions\/upload-pages-artifact@[^\r\n]+\r?\n[ \t]+with:\r?\n[ \t]+path: site-a[ \t]*(?:\r?\n|$)/);
});

test('peer: Site A closed policy permits only the declared Spec Scout origin', async () => {
  const manifest = await readJSON(new URL('agent-manifest.json', siteA));
  const links = await readJSON(new URL('links.json', siteA));
  const peer = new URL(links.networks.review_desk.spec_scout);
  for (const [target, allowed] of [
    [peer.href, true],
    [`${peer.origin}/agents/spec_scout`, true],
    ['https://other.invalid/spec_scout', false],
    [`https://${peer.hostname}.attacker.invalid/spec_scout`, false],
    [`http://${peer.hostname}/spec_scout`, false],
    [`https://${peer.hostname}:8443/spec_scout`, false],
  ]) {
    assert.equal(manifestAllowsPeer(target, manifest), allowed, target);
  }
});

test('peer: coordinator resolves the symbolic Spec Scout tool before consent-gated local execution', async t => {
  const base = 'https://review-desk.invalid/desk';
  const manifestA = await readJSON(new URL('agent-manifest.json', siteA));
  const configA = await readJSON(new URL('review_desk.network.json', siteA));
  const links = await readJSON(new URL('links.json', siteA));
  const target = links.networks.review_desk.spec_scout;
  const peer = new URL(target);
  const peerBase = peer.origin;
  const manifestB = await readJSON(new URL('agent-manifest.json', siteB));
  const configB = await readJSON(new URL('spec_scout.network.json', siteB));
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });

  for (const scenario of ['allow', 'decline', 'missing exact network']) {
    await t.test(scenario, async () => {
      const requests = [];
      const events = [];
      globalThis.fetch = async url => {
        url = new URL(url).href;
        requests.push(url);
        if (url.startsWith(`${peerBase}/`)) events.push('peer fetch');
        const published = new Map([
          [`${base}/review_desk.network.json`, configA],
          [`${base}/links.json`, links],
          [`${peerBase}/agent-manifest.json`, scenario === 'missing exact network'
            ? { ...manifestB, networks: [{ ...manifestB.networks[0], name: 'other' }] } : manifestB],
          [`${peerBase}/spec_scout.network.json`, configB],
          [`${peerBase}/links.json`, null],
        ]);
        assert.ok(published.has(url), `unexpected fetch: ${url}`);
        const data = published.get(url);
        return new Response(JSON.stringify(data), { status: data === null ? 404 : 200 });
      };
      const engine = new Engine({ originUrl: base });
      const compiled = await engine._compile(base, manifestA, manifestA.networks[0], { isTop: true });
      engine.top = { ...compiled, base, manifest: manifestA };
      const { network } = compiled;
      assert.equal(network.findFrontMan(), manifestA.networks[0].front_man);
      assert.deepEqual(validateNetwork(network).errors, []);
      const chain = [`${base}::${network.name}`];
      const ctx = engine._makeCtx({ ...engine.top, isTop: true, chain, slyData: {} });
      const { toolByName, toolSchemas } = await buildToolTable(ctx,
        network.getAgentSpec(network.findFrontMan()), chain);
      assert.equal(toolByName.get('conformance_reviewer').kind, 'agent');
      const entry = toolByName.get('spec_scout');
      assert.deepEqual(entry, { kind: 'link', reference: 'spec_scout' });
      assert.ok(toolSchemas.some(tool => tool.function.name === 'spec_scout'));
      assert.equal(network.getLink(entry.reference), target);
      assert.deepEqual(events, [], 'advertising the symbolic tool must not contact B');
      const question = 'What does section 3.2 require for peer loading?';
      engine.onConsent = async info => {
        assert.deepEqual(events, [], 'consent must precede any peer fetch');
        assert.equal(info.peerOrigin, peer.host);
        assert.equal(info.requestText, question);
        events.push('consent');
        return scenario === 'decline' ? 'decline' : 'allow';
      };
      const resolveRemote = ctx.resolveRemote;
      let modelCalls = 0;
      ctx.resolveRemote = async (url, ...args) => {
        assert.equal(url, target, 'links.json must resolve to <B root>/spec_scout');
        assert.equal(manifestAllowsPeer(url, manifestA), true);
        const session = await resolveRemote(url, ...args);
        assert.equal(session.base, peerBase);
        assert.equal(session.network.name, manifestB.networks[0].name);
        assert.equal(session.llm.baseUrl, engine.top.llm.baseUrl);
        // Only model inference is scripted; peer loading, validation and execution
        // use the published artifacts and the real browser-runtime path.
        session.llm.chat = async ({ messages, tools }) => {
          modelCalls++;
          assert.equal(messages[0].content, configB.tools[0].instructions);
          assert.equal(messages.at(-1).content, question);
          assert.deepEqual(tools, [], 'B has no site actions or further peers');
          return { content: 'Scripted Spec Scout answer.', toolCalls: [] };
        };
        return session;
      };
      const invoke = () => dispatchToolCall(ctx, entry, { request: question }, null, chain);
      if (scenario === 'missing exact network') {
        await assert.rejects(invoke(), /No published network named 'spec_scout'/);
        assert.equal(modelCalls, 0);
      } else if (scenario === 'decline') {
        assert.ok((await invoke()).includes(`user declined to contact ${peer.host}`));
        assert.equal(modelCalls, 0);
      } else {
        assert.equal((await invoke()).text, 'Scripted Spec Scout answer.');
        assert.equal(modelCalls, 1);
      }
      assert.equal(events[0], 'consent');
      assert.deepEqual(requests.filter(url => url.startsWith(`${peerBase}/`)),
        scenario === 'decline' ? [] : scenario === 'missing exact network'
          ? [`${peerBase}/agent-manifest.json`]
          : [`${peerBase}/agent-manifest.json`, `${peerBase}/spec_scout.network.json`, `${peerBase}/links.json`]);
    });
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

test('peer: Site B embeds authoring excerpts with their source sections and version', async () => {
  const { source, excerpts } = await readJSON(new URL('spec-excerpts.json', siteB));
  const config = await readJSON(new URL('spec_scout.network.json', siteB));
  const instructions = config.tools.find(agent => agent.name === 'spec_scout').instructions;
  const citation = [
    'SOURCE FOR ALL EXCERPTS',
    `Title: ${source.title}`,
    `Version: ${source.version}`,
    `Date: ${source.date}`,
    `Author: ${source.author}`,
    `Repository: ${source.repository}`,
    `Commit: ${source.commit}`,
    `Path: ${source.path}`,
    `Source URL: ${source.url}`,
    `License: ${source.license}`,
  ].join('\n');
  assert.ok(instructions.includes(citation), 'embedded source citation must match the authoring source');
  assert.ok(excerpts.length > 0, 'the authoring source must supply evidence');
  for (const excerpt of excerpts) {
    const block = `[${excerpt.id}] ${excerpt.topic} — Section ${excerpt.section}\n${excerpt.text}`;
    assert.ok(instructions.includes(block), `${excerpt.id}: preserve the quotation with its source section`);
  }
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
