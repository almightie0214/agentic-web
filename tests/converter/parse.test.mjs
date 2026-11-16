import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { parseRoles } from '../../site-a/converter/parse-roles.mjs';

const fixtures = new URL('./fixtures/', import.meta.url);
const file = (path, content = '# Public role\n\nReview supplied text.') => ({ path, content });
const md = (content, path = 'reader.md') => [file(path, content)];
const fm = (metadata, body = '# Public title\n\nReview text.') => `---\n${metadata}\n---\n${body}`;
const theora = (name, content) => file(`.theora/roles/${name}/agent.md`, content);
const config = (content) => file('.theora/config/theora.json', content);
const role = (files, options) => parseRoles(files, options).roles[0];
function rejects(files, rule, options) {
  assert.throws(() => parseRoles(files, options), (error) => {
    assert.ok(error instanceof Error);
    assert.match(error.message, new RegExp(`^${rule}:`));
    return true;
  });
}

// The task explicitly requires an import prohibition assertion (CVT-CORE-001).
test('CVT-CORE-001: shared parser has no node imports and loads as a browser-portable module', async () => {
  const source = await readFile(new URL('../../site-a/converter/parse-roles.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /\b(?:from\s*|import\s*(?:\(\s*)?)["']node:/);
  const portable = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
  assert.deepEqual(portable.parseRoles(md('# Public')), parseRoles(md('# Public')));
});

for (const layout of ['mini-theora', 'sample-agents']) {
  test(`CVT-IR-001: ${layout} fixture yields sanitized roles matching publication snapshots`, async () => {
    const files = layout === 'mini-theora'
      ? JSON.parse(await readFile(new URL('mini-theora/layout.json', fixtures), 'utf8'))
      : await Promise.all((await readdir(new URL('sample-agents/', fixtures))).filter((name) => name.endsWith('.md'))
        .map(async (name) => file(name, await readFile(new URL(`sample-agents/${name}`, fixtures), 'utf8'))));
    const snapshot = JSON.parse(await readFile(new URL(`${layout}/expected/converted_team.network.json`, fixtures), 'utf8'));
    const expected = snapshot.tools.map(({ name, function: fn, instructions }) => ({ name, description: fn.description, instructions }));
    const frozen = Object.freeze(files.map((entry) => Object.freeze(entry)));
    const parsed = parseRoles(frozen, Object.freeze({}));
    assert.deepEqual(parsed, { roles: expected, configFront: layout === 'mini-theora' ? 'coordinator' : undefined });
    assert.deepEqual(parseRoles([...files].reverse()), parsed);
    assert.deepEqual(parseRoles(files), parsed);
  });
}

test('CVT-IN-002/003: exact Theora selection wins mixed input and keeps the entire body', () => {
  const body = fm('name: ignored\ndescription: ignored', '# Directory role\nKeep ${literal} and docs/guide.md.');
  const files = [theora('Zulu', body), theora('alpha'), file('root.md', fm('name: [')),
    file('.theora/roles/nested/more/agent.md', ''), file('.theora/roles/ignored/readme.md', '')];
  const parsed = parseRoles(files);
  assert.deepEqual(parsed.roles.map(({ name }) => name), ['Zulu', 'alpha']);
  assert.equal(parsed.roles[0].instructions, body);
  assert.equal(parsed.roles[0].description, 'Directory role');
  rejects([theora('reader')], 'CVT-IN-002', { layout: 'markdown' });
  rejects(md('# Reader'), 'CVT-IN-002', { layout: 'theora' });
  rejects([file('.theora/roles/reader/readme.md')], 'CVT-IN-002');
  rejects([file('.theora/roles/reader/agent.md\n')], 'CVT-IN-002');
  rejects([file('reader.md\n')], 'CVT-IN-002');
  assert.equal(role([file('reader.md'), file('.claude/agents/ignored.md\n', '')]).name, 'reader');
});

test('CVT-IN-004: Claude agents directory excludes root and nested Markdown', () => {
  const files = [file('README.md', ''), file('.claude/agents/reader.md', '# Claude reader'),
    file('.claude/agents/nested/ignored.md', ''), file('.claude/agents/upper.MD', ''),
    config('not JSON'), theora('other', '')];
  assert.deepEqual(parseRoles(files, { layout: 'markdown' }), {
    roles: [{ name: 'reader', description: 'Claude reader', instructions: '# Claude reader' }], configFront: undefined,
  });
  assert.equal(role([file('reader.md'), file('nested/ignored.md', ''), file('upper.MD', ''), config('invalid')]).name, 'reader');
});

test('CVT-IN-001: normalize BOM and line endings without changing internal Markdown', () => {
  const content = '\uFEFF---\r\nname: Reader\rdescription: "Read carefully."\r\n---\r\n\r\n# Heading\r\n\r\n  Keep **formatting**.\r\n```js\r\n${literal}\r\n```\r\n';
  assert.deepEqual(role(md(content)), {
    name: 'Reader', description: 'Read carefully.',
    instructions: '# Heading\n\n  Keep **formatting**.\n```js\n${literal}\n```',
  });
  assert.equal(role(md('# Public\n\n---\nname: not_metadata\n---')).instructions, '# Public\n\n---\nname: not_metadata\n---');
});

for (const [label, metadata, expectedName, expectedDescription] of [
  ['plain and comments', 'name: writer # ignored\ndescription: Review [text] at https://example.test/#part # comment', 'writer', 'Review [text] at https://example.test/#part'],
  ['single quoted', "name: 'writer'\ndescription: 'Review the author''s text.'", 'writer', "Review the author's text."],
  ['double quoted', 'name: "writer"\ndescription: "Review\\nwith \\"care\\"."', 'writer', 'Review with "care".'],
  ['literal', 'name: |-\n  writer\ndescription: |\n  Review carefully.\n\n  Quote evidence.', 'writer', 'Review carefully. Quote evidence.'],
  ['folded', 'name: >\n  writer\ndescription: >-\n  Review\n  carefully.\n\n  Quote evidence.', 'writer', 'Review carefully. Quote evidence.'],
]) {
  test(`CVT-MD-001: ${label} name/description strings and body extraction`, () => {
    const body = '# Actual instructions\n\nKeep the body, not metadata.';
    assert.deepEqual(role(md(fm(metadata + '\ntools:\n  - Bash\nmodel: !ignored\npermissionMode: bypassPermissions\ncolor: red', body))), {
      name: expectedName, description: expectedDescription, instructions: body,
    });
  });
}

test('CVT-MD-001: ignored nested metadata cannot override names or instructions', () => {
  assert.deepEqual(role(md(fm('tools:\n  name: impostor\n  description: hidden\n  nested: [!unsupported]\n# comment\nname: reader\n\ndescription: Read carefully.\n  # comment'))), {
    name: 'reader', description: 'Read carefully.', instructions: '# Public title\n\nReview text.',
  });
});

for (const metadata of [
  'name:', 'description: null', 'description: ~', 'description: true', 'description: FALSE',
  'description: 42', 'description: -1.5e+3', 'description: 0xFE', 'description: .inf',
  'description: []', 'description: {}', 'description: !tag hello', 'description: &anchor hello',
  'description: *alias', 'description: "unterminated', "description: 'bad'quotes'", 'description: ""',
  "description: '  '", 'description: |+\n  unsupported', 'description: >2\n  unsupported',
  'description: |', 'description: |\n one space', 'description: |\n\tbad indent',
  'description: plain\n  multiline unsupported', 'description: value: mapping', 'name: - list',
  'name: reader\nname: reader', 'description: first\ndescription: second', 'name reader', '"name": reader',
]) {
  test(`CVT-MD-001: reject unsupported recognized frontmatter ${JSON.stringify(metadata)}`, () => {
    rejects(md(fm(metadata)), 'CVT-MD-001');
  });
}

test('CVT-MD-001: opening delimiter requires a closing delimiter', () => {
  rejects(md('---\nname: reader\n# Public'), 'CVT-MD-001');
  assert.equal(role(md('--- \nname: body text\n# Public')).description, 'Public');
});

for (const [path, body, name, description] of [
  ['Research Lead.md', '# Not the identity\nReview.', 'research_lead', 'Not the identity'],
  ['coordinator.md', 'First summary   line.\nNext line.', 'coordinator', 'First summary line.'],
  ['!!!.md', '# Title Fallback ###\nReview.', 'title_fallback', 'Title Fallback'],
  ['reader.md', '```md\n# Wrong\n``\n~~~\n# Still wrong\n````\n###### Correct ###\nReview.', 'reader', 'Correct'],
  ['reader.md', '~~~~\n# Wrong\n~~~\n# Still wrong\n~~~~\n# Correct', 'reader', 'Correct'],
  ['reader.md', 'Setext title\n============', 'reader', 'Setext title'],
  ['reader.md', '```\n```', 'reader', 'Role reader.'],
  ['reader.md', '# ###\nReview supplied text.', 'reader', 'Role reader.'],
]) {
  test(`CVT-ROLE-001/002: filename/title/summary fallback ${JSON.stringify([path, body])}`, () => {
    assert.deepEqual(role(md(body, path)), { name, description, instructions: body });
  });
}

test('CVT-ROLE-001: names are validated without rewriting, case folding collisions, or truncation', () => {
  for (const name of ['1reader', 'has-dash', 'has space', 'a'.repeat(61), 'sk-abcdefgh', 'ghp_abcdefgh', '/private', '']) {
    rejects(md(fm(`name: ${JSON.stringify(name)}`)), name === '' ? 'CVT-MD-001' : 'CVT-ROLE-001');
    if (name && !name.includes('/')) rejects([theora(name)], 'CVT-ROLE-001');
  }
  rejects(md('# No valid ASCII title', '123.md'), 'CVT-ROLE-001');
  rejects(md('No heading', '!!!.md'), 'CVT-ROLE-001');
  rejects([file('reader.md'), file('Reader.md')], 'CVT-ROLE-001');
  rejects([file('first.md', fm('name: reader')), file('second.md', fm('name: Reader'))], 'CVT-ROLE-001');
  assert.equal(role(md(fm(`name: ${'A'.repeat(60)}`))).name, 'A'.repeat(60));
  assert.equal(role([theora('Mixed_Case')]).name, 'Mixed_Case');
  rejects([theora('reader\n')], 'CVT-ROLE-001');
});

const secretLines = [
  'api_key = synthetic-value', '"access-token": "synthetic-value"', "authToken: synthetic-value",
  'secret: synthetic-value', 'password = synthetic-value', 'passwd: synthetic-value',
  'Authorization: synthetic-value', 'Use Bearer synthetic-value', 'sk-abcdefgh',
  'ghp_abcdefgh', 'gho_abcdefgh', 'ghu_abcdefgh', 'ghs_abcdefgh', 'ghr_abcdefgh',
  'github_pat_abcdefgh', 'AKIA1234567890ABCDEF',
];
const pathLines = [
  'Read /home/example/work', 'Read //host/share', 'Read ~/private', '[notes](../private.md)',
  'Read ./private', 'Read `C:\\work\\notes`', 'Read D:/work/notes', 'Read \\\\host\\share',
  'Read .theora/roles/reader/agent.md', 'Read .claude/agents/reader.md',
  'Read .ssh/key', 'Read .codex/config', 'Read .env', 'Read .env.local',
  '<./private>', '"/private"', "'/private'", '[/private]',
];

test('CVT-SEC-001/002: remove whole secret/path lines before deriving descriptions', () => {
  const body = [...secretLines, ...pathLines, '# Public title', 'Keep docs/guide.md, https://example.test/path and .environment.',
    '```text', 'api-key: synthetic-in-code', '```'].join('\n');
  const parsed = role(md(body));
  assert.equal(parsed.description, 'Public title');
  assert.equal(parsed.instructions, [
    ...secretLines.map(() => '[REDACTED_SECRET]'), ...pathLines.map(() => '[REDACTED_LOCAL_PATH]'),
    '# Public title', 'Keep docs/guide.md, https://example.test/path and .environment.',
    '```text', '[REDACTED_SECRET]', '```',
  ].join('\n'));
});

test('CVT-SEC-001: PEM labels must match and unmatched blocks remove through EOF', () => {
  const body = '# Public\n-----BEGIN RSA PRIVATE KEY-----\nhidden\n-----END EC PRIVATE KEY-----\nstill hidden\n-----END RSA PRIVATE KEY-----\nKeep text.';
  assert.equal(role(md(body)).instructions, '# Public\n[REDACTED_SECRET]\nKeep text.');
  assert.equal(role(md('# Public\n-----BEGIN PRIVATE KEY-----\nhidden')).instructions, '# Public\n[REDACTED_SECRET]');
  assert.equal(role(md('# Public\n-----BEGIN PRIVATE KEY----------END PRIVATE KEY-----\nKeep text.')).instructions, '# Public\n[REDACTED_SECRET]\nKeep text.');
});

test('CVT-SEC-001/002: sanitized metadata descriptions fall back or retain only public text', () => {
  for (const description of ['api_key: synthetic', '/home/example/private', '-----BEGIN PRIVATE KEY-----']) {
    assert.equal(role(md(fm(`description: ${JSON.stringify(description)}`))).description, 'Public title');
  }
  assert.equal(role(md(fm('description: |\n  api_key: synthetic\n  Public summary.\n  Read ./private'))).description,
    '[REDACTED_SECRET] Public summary. [REDACTED_LOCAL_PATH]');
});

test('CVT-ROLE-002: empty and redaction-only bodies fail instead of creating substitute agents', () => {
  for (const body of ['', ' \n\t', 'api_key: synthetic', '/private', '-----BEGIN PRIVATE KEY-----\nhidden',
    '[REDACTED_SECRET]\n[REDACTED_LOCAL_PATH]']) rejects(md(body), 'CVT-ROLE-002');
  rejects(md(fm('name: reader', '')), 'CVT-ROLE-002');
});

test('CVT-IN-003/IR-001: validate config candidate exactly, ignore unrelated config fields', () => {
  assert.equal(parseRoles([theora('alpha'), theora('zulu'), config('{"front_man":"zulu","api_key":"ignored"}')]).configFront, 'zulu');
  assert.equal(parseRoles([theora('alpha'), config('{}')]).configFront, undefined);
  assert.equal(parseRoles([theora('alpha')]).configFront, undefined);
  for (const text of ['not JSON', '{"front_man":', 'null', '[]', '1', '"text"', '{"front_man":"unknown"}',
    '{"front_man":"Alpha"}', '{"front_man":null}', '{"front_man":false}', '{"front_man":" alpha"}', '{"front_man":""}',
    '{"front_man":"ghp_abcdefgh"}', JSON.stringify({ front_man: 'alpha\n' })]) {
    assert.throws(() => parseRoles([theora('alpha'), config(text)]), /^Error: CVT-(?:IN-003|ROLE-001):/);
  }
});

test('CVT-IN-001/002: invalid records, paths, duplicates, layout, and no selected roles fail closed', () => {
  for (const files of [null, {}, [null], ['text'], [[]], [{}], [{ path: 'reader.md', content: 1 }],
    [{ path: 1, content: 'text' }], Array(1)]) rejects(files, 'CVT-IN-001');
  for (const path of ['/absolute', 'C:drive.md', 'a\\b.md', '', 'a//b.md', './reader.md', 'a/../reader.md', 'a/./b.md', 'a/', 'bad\0path']) {
    rejects([file('reader.md'), file(path)], 'CVT-IN-001');
  }
  rejects([file('reader.md'), file('reader.md')], 'CVT-IN-001');
  rejects(md('# Public\0hidden'), 'CVT-IN-001');
  rejects([theora('reader'), config('{}\0')], 'CVT-IN-003');
  assert.equal(role([file('reader.md'), file('unrelated.txt', '\0')]).name, 'reader');
  for (const options of [null, [], { layout: '' }, { layout: 'unknown' }]) rejects(md('# Public'), 'CVT-IN-002', options);
  for (const files of [[], [file('readme.MD')], [file('nested/reader.md')], [config('{}')]]) rejects(files, 'CVT-IN-002');
});

test('CVT-SEC-003: errors never echo source paths, invalid names, config excerpts, or body secrets', () => {
  const sentinel = 'DO_NOT_DISCLOSE_123';
  for (const files of [
    [file(`/${sentinel}.md`)], md(fm(`name: "${sentinel}-invalid"`)),
    [theora('reader'), config(`{"${sentinel}": broken`)],
    md(fm(`description: [${sentinel}]`)), md(`api_key: ${sentinel}`),
  ]) {
    assert.throws(() => parseRoles(files), (error) => {
      assert.match(error.message, /^CVT-/);
      assert.ok(!String(error).includes(sentinel));
      assert.equal(error.cause, undefined);
      return true;
    });
  }
});
