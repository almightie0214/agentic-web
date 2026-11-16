import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

const fixtures = new URL('./', import.meta.url);
const readJson = async (path) => JSON.parse(await readFile(new URL(path, fixtures), 'utf8'));

// CVT-IN-001, CVT-IN-003, CVT-TEST-001: inspect data, not a future parser.
test('converter fixtures: virtual Theora files contain two roles and valid config', async () => {
  const files = await readJson('mini-theora/layout.json');
  assert.ok(Array.isArray(files));
  assert.equal(files.length, 3);
  for (const file of files) {
    assert.deepEqual(Object.keys(file).sort(), ['content', 'path']);
    assert.equal(typeof file.path, 'string');
    assert.equal(typeof file.content, 'string');
    assert.ok(file.content.trim());
  }
  assert.deepEqual(files.map(({ path }) => path).sort(), [
    '.theora/config/theora.json',
    '.theora/roles/coordinator/agent.md',
    '.theora/roles/specialist/agent.md',
  ]);
  const config = JSON.parse(files.find(({ path }) => path === '.theora/config/theora.json').content);
  assert.ok(config && typeof config === 'object' && !Array.isArray(config));
  assert.equal(config.front_man, 'coordinator');
});

// CVT-TEST-001: frontmatter and filename/title examples are input data only.
test('converter fixtures: sample agents include coordinator and specialist Markdown', async () => {
  const entries = await readdir(new URL('sample-agents/', fixtures), { withFileTypes: true });
  const markdown = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.md'));
  assert.ok(markdown.length >= 2);
  for (const name of ['coordinator.md', 'specialist.md']) {
    assert.ok(markdown.some((entry) => entry.name === name));
  }
  for (const { name } of markdown) {
    assert.ok((await readFile(new URL(`sample-agents/${name}`, fixtures), 'utf8')).trim());
  }
});

for (const layout of ['mini-theora', 'sample-agents']) {
  // CVT-TEST-001, CVT-NET-004, CVT-MAN-001, CVT-LINK-001, CVT-OUT-001.
  test(`converter fixtures: ${layout} snapshots declare front-to-specialist wiring`, async () => {
    const expected = `${layout}/expected/`;
    const artifacts = ['agent-manifest.json', 'converted_team.network.json', 'links.json'];
    assert.deepEqual((await readdir(new URL(expected, fixtures))).sort(), artifacts);
    const [manifest, network, links] = await Promise.all(artifacts.map((name) => readJson(expected + name)));
    assert.equal(manifest.networks.length, 1);
    assert.equal(manifest.networks[0].name, 'converted_team');
    assert.equal(manifest.networks[0].front_man, 'coordinator');
    assert.equal(manifest.networks[0].hocon, './converted_team.network.json');
    assert.deepEqual(network.tools.map(({ name }) => name), ['coordinator', 'specialist']);
    assert.deepEqual(network.tools[0].tools, ['specialist']);
    assert.deepEqual(network.tools[1].tools, []);
    assert.deepEqual(links, { version: 1, networks: { converted_team: {} } });
    for (const name of artifacts) {
      const text = await readFile(new URL(expected + name, fixtures), 'utf8');
      assert.equal(text, JSON.stringify(JSON.parse(text), null, 2) + '\n');
    }
  });
}
