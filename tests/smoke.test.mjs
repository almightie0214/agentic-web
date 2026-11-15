import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);

async function readJSON(path) {
  return JSON.parse(await readFile(new URL(path, root), 'utf8'));
}

test('smoke: merge gate and npm test use the test file glob', async () => {
  const [gate, packageJSON] = await Promise.all([
    readJSON('theora.gate.json'),
    readJSON('package.json'),
  ]);

  assert.deepEqual(gate, {
    commands: [['node', '--test', 'tests/**/*.test.mjs']],
    timeout: '5m',
  });
  assert.equal(packageJSON.scripts.test, 'node --test "tests/**/*.test.mjs"');
});

test('smoke: Site A runtime entry point and license are present', async () => {
  for (const path of ['site-a/runtime/index.js', 'site-a/runtime/LICENSE.txt']) {
    const file = await stat(new URL(path, root));
    assert.ok(file.isFile(), `${path} must be a regular file`);
    assert.ok(file.size > 0, `${path} must not be empty`);
  }
});
