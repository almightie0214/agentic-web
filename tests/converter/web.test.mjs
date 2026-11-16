import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerHooks } from 'node:module';
import test from 'node:test';
import { parseRoles } from '../../site-a/converter/parse-roles.mjs';
import { emitNetwork } from '../../site-a/converter/emit-network.mjs';
import { emitManifest } from '../../site-a/converter/emit-manifest.mjs';
import { validateNetwork } from '../../site-a/validator-rules.mjs';

const root = new URL('../../', import.meta.url);
const handoffKey = 'agent-review-desk:converter';
const originalFetch = globalThis.fetch;
let mountId = 0;

class Element {
  children = [];
  dataset = {};
  value = '';
  disabled = false;
  hidden = false;
  files = [];
  text = '';
  handlers = new Map();
  set textContent(value) { this.text = String(value); this.children = []; }
  get textContent() { return this.text + this.children.map(child => child.textContent).join('\n'); }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.text = ''; this.children = children; }
  setAttribute(name, value) { this[name] = value; }
  addEventListener(name, handler) { this.handlers.set(name, handler); }
  async fire(name) {
    if (this.disabled) return;
    return this.handlers.get(name)?.({ preventDefault() {} });
  }
}

function storage(initial) {
  const values = new Map(initial === undefined ? [] : [[handoffKey, initial]]);
  const events = [];
  return { values, events,
    getItem(key) { events.push(['get', key]); return values.get(key) ?? null; },
    removeItem(key) { events.push(['remove', key]); values.delete(key); },
    setItem(key, value) { events.push(['set', key]); values.set(key, value); },
  };
}

async function mount(t, page = 'converter', { store = storage(), invalidReport = false } = {}) {
  const html = await readFile(new URL(`site-a/${page === 'converter' ? 'converter' : 'index'}.html`, root), 'utf8');
  const elements = new Map();
  for (const match of html.matchAll(/<[^>]*\bid="([^"]+)"[^>]*>/g)) {
    const node = new Element();
    node.disabled = /\sdisabled(?:\s|>)/.test(match[0]);
    node.hidden = /\shidden(?:\s|>)/.test(match[0]);
    elements.set(`#${match[1]}`, node);
  }
  const samples = [...html.matchAll(/data-(converter-sample|sample)="([^"]+)"[^>]*>([^<]+)/g)].map(match => {
    const node = new Element();
    node.dataset[match[1] === 'converter-sample' ? 'converterSample' : 'sample'] = match[2];
    node.textContent = match[3];
    return node;
  });
  const $ = selector => elements.get(selector);
  const requests = [];
  const navigations = [];
  const bootCalls = [];
  const globals = {
    document: { querySelector: $, querySelectorAll: selector =>
      selector === (page === 'converter' ? '[data-converter-sample]' : '[data-sample]') ? samples : [],
    createElement: () => new Element() },
    window: { sessionStorage: store, location: { assign: url => navigations.push(url) } },
    fetch: async (url, options) => {
      requests.push({ url: String(url), options });
      return new Response(await readFile(url, 'utf8'));
    },
    __converterWebBoot: () => { bootCalls.push('boot'); throw new Error('Chat not available'); },
  };
  const saved = Object.keys(globals).map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]);
  for (const [name, value] of Object.entries(globals)) Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  const entry = new URL(`site-a/${page}.js?converter-web-${mountId++}`, root);
  const hooks = registerHooks({ resolve(specifier, context, nextResolve) {
    if (context.parentURL === entry.href && specifier === './runtime/index.js') {
      return { url: 'data:text/javascript,export async function boot(){return globalThis.__converterWebBoot()}', shortCircuit: true };
    }
    if (invalidReport && context.parentURL === entry.href && specifier === './validator-rules.mjs') {
      return { url: 'data:text/javascript,export function validateNetwork(){return {valid:false,checks:[{status:"fail",ruleId:"network.document",path:"/network",message:"Rejected artifact",hint:"Inspect the artifact"}]}}', shortCircuit: true };
    }
    return nextResolve(specifier, context);
  } });
  t.after(() => {
    hooks.deregister();
    for (const [name, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  });
  await import(entry);
  return { $, html, samples, store, requests, navigations, bootCalls };
}

function bundle(files, options) {
  const parsed = parseRoles(files);
  const { network, frontMan } = emitNetwork(parsed, options);
  return { ...emitManifest(frontMan, parsed.layout), network };
}
const markdown = (path, content) => ({ name: path, arrayBuffer: async () => new TextEncoder().encode(content).buffer });
const fixture = async () => JSON.parse(await readFile(new URL('tests/converter/fixtures/mini-theora/layout.json', root), 'utf8'));

function output($) {
  return Object.fromEntries(['manifest', 'network', 'links'].map(key => [key, JSON.parse($(`#converted-${key}`).value)]));
}

// CVT-WEB-001: real shared conversion and AW2 validation, without a runtime import.
test('converter web: both public samples use shared emitters, format metadata, AW2 reports and CLI-identical downloadable bytes', async t => {
  const { $, samples, requests, bootCalls, html } = await mount(t);
  assert.match(html, /href="\.\/styles.css"/);
  assert.match(html, /href="\.\/index.html"/);
  assert.equal(samples.length, 2);
  assert.equal($('#convert-submit').disabled, true);
  for (const sample of samples) {
    await sample.fire('click');
    const input = output($);
    const layout = sample.dataset.converterSample === 'theora' ? 'theora' : 'markdown';
    const description = `Converted ${layout === 'theora' ? 'Theora' : 'Markdown'} role conversation network.`;
    assert.equal(input.network.metadata.description, description);
    assert.equal(input.manifest.networks[0].description, description);
    const records = layout === 'theora'
      ? JSON.parse(await readFile(new URL('site-a/converter/samples/theora/layout.json', root), 'utf8'))
      : await Promise.all(['coordinator', 'specialist'].map(async name => ({ path: `.claude/agents/${name}.md`,
        content: await readFile(new URL(`site-a/converter/samples/claude-agents/${name}.md`, root), 'utf8'),
      })));
    const scratch = fileURLToPath(new URL('.theora/tmp/converter-web/', root));
    await mkdir(scratch, { recursive: true });
    const work = await mkdtemp(join(scratch, `${layout}-`));
    t.after(() => rm(work, { recursive: true, force: true }));
    const cliInput = join(work, 'input');
    const cliOutput = join(work, 'output');
    for (const { path, content } of records) {
      const target = join(cliInput, path);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, content, 'utf8');
    }
    const cli = spawnSync(process.execPath, [fileURLToPath(new URL('tools/theora2hocon/theora2hocon.mjs', root)), cliInput, cliOutput],
      { encoding: 'utf8', timeout: 15_000 });
    assert.equal(cli.error, undefined);
    assert.equal(cli.signal, null);
    assert.equal(cli.status, 0, cli.stderr);
    assert.equal(validateNetwork(input).valid, true);
    assert.deepEqual(input.network.tools.map(role => [role.name, role.tools]), [['coordinator', ['specialist']], ['specialist', []]]);
    assert.ok(!JSON.stringify(input.network).includes('Read, Bash'), 'ignored source tools never become capabilities');
    assert.match($('#convert-status').textContent, /Static checks passed.*unverified/);
    assert.match($('#converter-report').textContent, /UNVERIFIED · runtime.safety/);
    assert.match($('#converter-report').textContent, /PASS · execution.limit/);
    assert.equal($('#converter-output').hidden, false);
    const links = $('#converter-downloads').children;
    assert.deepEqual(links.map(link => link.download), ['converted_team.network.json', 'agent-manifest.json', 'links.json']);
    for (const [index, key] of ['network', 'manifest', 'links'].entries()) {
      const text = await (await originalFetch(links[index].href)).text();
      assert.equal(text, JSON.stringify(input[key], null, 2) + '\n');
      assert.equal(text, $(`#converted-${key}`).value);
      assert.deepEqual(Buffer.from(text, 'utf8'), await readFile(join(cliOutput, links[index].download)));
    }
  }
  assert.ok(requests.every(item => item.url.includes('/site-a/converter/samples/') && item.options.credentials === 'omit'));
  assert.equal(bootCalls.length, 0);
  assert.deepEqual($('#converter-report').children.map(row => row.dataset.state), validateNetwork(output($)).checks.map(check => check.status));
});

test('converter web: directory roots and direct Markdown files preserve mapping and explicit front selection', async t => {
  const { $, requests, store, navigations } = await mount(t);
  const files = await fixture();
  $('#project-files').files = files.map(({ path, content }) => ({ ...markdown(path, content), webkitRelativePath: `selected-project/${path}` }));
  await $('#project-files').fire('change');
  await $('#convert-form').fire('submit');
  assert.deepEqual(output($), bundle(files));
  $('#convert-front').value = 'specialist';
  await $('#convert-front').fire('input');
  assert.equal($('#converter-output').hidden, true);
  assert.equal($('#open-review').disabled, true);
  await $('#convert-form').fire('submit');
  assert.deepEqual(output($), bundle(files, { front: 'specialist' }));
  await $('#open-review').fire('click');
  assert.deepEqual(JSON.parse(store.values.get(handoffKey)), output($));
  assert.equal(navigations[0], new URL('site-a/index.html', root).href);
  $('#convert-front').value = '';
  await $('#convert-front').fire('input');
  $('#markdown-files').files = [markdown('Guide.md', '# Public guide\nOnly public information.\napi_key=synthetic_secret\n/home/private/note\n')];
  await $('#markdown-files').fire('change');
  await $('#convert-form').fire('submit');
  const role = output($).network.tools[0];
  assert.equal(role.name, 'guide');
  assert.match(role.instructions, /REDACTED_SECRET/);
  assert.match(role.instructions, /REDACTED_LOCAL_PATH/);
  assert.doesNotMatch(JSON.stringify(output($)), /synthetic_secret|\/home\/private/);
  assert.equal(requests.length, 0, 'local conversion and handoff never fetch, infer, or contact peers');
});

// CVT-IN-001 / CVT-OUT-001: adapters preserve BOMs; only the shared parser removes one.
test('converter web: CLI and web acquisition agree on single and repeated UTF-8 BOMs', async t => {
  const scratch = fileURLToPath(new URL('.theora/tmp/converter-web/', root));
  await mkdir(scratch, { recursive: true });
  for (const count of [1, 2]) {
    for (const source of ['direct', 'directory', 'sample']) {
      await t.test(`${source}, ${count} BOMs`, async t => {
        const work = await mkdtemp(join(scratch, 'bom-'));
        t.after(() => rm(work, { recursive: true, force: true }));
        const input = join(work, 'input');
        const out = join(work, 'output');
        const filename = source === 'sample' ? 'specialist.md' : 'reader.md';
        const prefix = source === 'direct' ? '' : '.claude/agents/';
        const body = '---\nname: specialist\n---\n# Public\nReview supplied text.';
        const records = [
          { path: `${prefix}${filename}`, content: '\uFEFF'.repeat(count) + body },
          { path: `${prefix}coordinator.md`, content: '# Coordinator\nDelegate public reviews.' },
        ];
        for (const { path, content } of records) {
          const target = join(input, path);
          await mkdir(dirname(target), { recursive: true });
          await writeFile(target, content, 'utf8');
        }
        const cli = spawnSync(process.execPath, [fileURLToPath(new URL('tools/theora2hocon/theora2hocon.mjs', root)), input, out],
          { encoding: 'utf8', timeout: 15_000 });
        assert.equal(cli.error, undefined);
        assert.equal(cli.signal, null);
        assert.equal(cli.status, 0, cli.stderr);
        const { $, samples } = await mount(t);
        if (source === 'sample') {
          globalThis.fetch = async url => {
            const record = records.find(({ path }) => String(url).endsWith(path.split('/').at(-1)));
            assert.ok(record, 'only the selected sample role is requested');
            return new Response(new TextEncoder().encode(record.content));
          };
          await samples.find(sample => sample.dataset.converterSample === 'claude').fire('click');
        } else {
          const selector = source === 'direct' ? '#markdown-files' : '#project-files';
          $(selector).files = records.map(({ path, content }) => ({ ...markdown(path, content),
            ...(source === 'directory' ? { webkitRelativePath: `selected/${path}` } : {}),
          }));
          await $(selector).fire('change');
          await $('#convert-form').fire('submit');
        }
        const converted = output($);
        assert.deepEqual(converted, bundle(records));
        const role = converted.network.tools.find(role => role.name !== 'coordinator');
        assert.equal(role.name, count === 1 ? 'specialist' : filename.slice(0, -3));
        const expectedBody = count === 1 ? '# Public\nReview supplied text.' : body;
        assert.equal(role.instructions.split('\n\n## Converter-owned output rule\n')[0], expectedBody,
          'BOM-normalized body is unchanged before the converter-owned output rule');
        assert.equal(role.function.description, 'Public');
        for (const [key, name] of [['network', 'converted_team.network.json'], ['manifest', 'agent-manifest.json'], ['links', 'links.json']]) {
          const expected = await readFile(join(out, name));
          assert.deepEqual(Buffer.from($(`#converted-${key}`).value, 'utf8'), expected);
          const download = $('#converter-downloads').children.find(link => link.download === name);
          assert.deepEqual(Buffer.from(await (await originalFetch(download.href)).arrayBuffer()), expected);
        }
      });
    }
  }
});

test('converter web: acquisition reads only layout-selected roles and config, ignoring unrelated binary files', async t => {
  const theora = await fixture();
  const claude = ['coordinator', 'specialist'].map(name => ({ path: `.claude/agents/${name}.md`, content: `# ${name}\nHandle public requests.` }));
  for (const [layout, selected, ignored] of [
    ['theora', theora, ['assets/logo.png', 'README.md', '.claude/agents/broken.md', '.theora/roles/nested/extra/agent.md']],
    ['markdown', claude, ['assets/logo.png', 'README.md', '.theora/config/theora.json', '.claude/agents/nested/broken.md']],
    ['markdown', [{ path: 'guide.md', content: '# Guide\nHandle public requests.' }], ['assets/logo.png', 'nested/ignored.md', 'UPPER.MD']],
  ]) await t.test(`${layout}: ${selected[0].path}`, async t => {
    const { $ } = await mount(t);
    const reads = [];
    $('#project-files').files = [
      ...selected.map(({ path, content }) => ({ ...markdown(path, content), webkitRelativePath: `root/${path}`,
        arrayBuffer: async () => { reads.push(path); return new TextEncoder().encode(content).buffer; } })),
      ...ignored.map(path => ({ webkitRelativePath: `root/${path}`, name: path,
        arrayBuffer: async () => { reads.push(path); return new Uint8Array([0xff]).buffer; } })),
    ];
    await $('#project-files').fire('change');
    await $('#convert-form').fire('submit');
    assert.deepEqual(output($), bundle(selected));
    assert.deepEqual(reads.sort(), selected.map(file => file.path).sort());
    $('#convert-layout').value = layout;
    await $('#convert-layout').fire('change');
    await $('#convert-form').fire('submit');
    assert.deepEqual(output($), bundle(selected));
    assert.deepEqual(new Set(reads), new Set(selected.map(file => file.path)));
  });
  await t.test('layout changes reselect files and reject only selected invalid UTF-8', async t => {
    const { $ } = await mount(t);
    const reads = [];
    let badPath;
    $('#project-files').files = [...theora, ...claude, { path: 'README.md', content: '# Not an agent' }].map(({ path, content }) => ({
      name: path, webkitRelativePath: `root/${path}`, arrayBuffer: async () => {
        reads.push(path);
        return path === badPath ? new Uint8Array([0xff]).buffer : new TextEncoder().encode(content).buffer;
      },
    }));
    await $('#project-files').fire('change');
    await $('#convert-form').fire('submit');
    assert.deepEqual(output($), bundle(theora), 'auto prefers Theora in a mixed project');
    assert.deepEqual(new Set(reads), new Set(theora.map(file => file.path)));
    for (const [layout, selected] of [['markdown', claude], ['theora', theora]]) {
      reads.length = 0;
      $('#convert-layout').value = layout;
      await $('#convert-layout').fire('change');
      await $('#convert-form').fire('submit');
      assert.deepEqual(output($), bundle(selected));
      assert.deepEqual(new Set(reads), new Set(selected.map(file => file.path)));
    }
    for (const path of ['.theora/config/theora.json', '.theora/roles/coordinator/agent.md', '.claude/agents/coordinator.md']) {
      badPath = path;
      const selectedLayout = path.startsWith('.theora/') ? 'theora' : 'markdown';
      $('#convert-layout').value = selectedLayout;
      await $('#convert-layout').fire('change');
      assert.equal($('#convert-submit').disabled, true);
      assert.equal($('#converter-output').hidden, true);
      assert.equal($('#converter-downloads').children.length, 0);
      assert.match($('#convert-status').textContent, /Could not read UTF-8/);
      $('#convert-layout').value = selectedLayout === 'theora' ? 'markdown' : 'theora';
      await $('#convert-layout').fire('change');
      await $('#convert-form').fire('submit');
      assert.deepEqual(output($), bundle(selectedLayout === 'theora' ? claude : theora), 'an invalid unselected role/config must not poison the other layout');
    }
  });
});

test('converter web: errors clear old downloads, sanitize diagnostics and retain static failure verdicts', async t => {
  await t.test('invalid input and acquisition errors', async t => {
    const { $, samples, navigations } = await mount(t);
    await samples[0].fire('click');
    const oldURL = $('#converter-downloads').children[0].href;
    $('#convert-front').value = 'secret_private_front';
    await $('#convert-front').fire('input');
    await $('#convert-form').fire('submit');
    assert.match($('#convert-status').textContent, /CVT-FRONT-001/);
    assert.doesNotMatch($('#convert-status').textContent, /secret_private_front/);
    assert.equal($('#converter-downloads').children.length, 0);
    assert.equal($('#converted-network').value, '');
    await assert.rejects(originalFetch(oldURL), /fetch failed/);
    await $('#open-review').fire('click');
    assert.equal(navigations.length, 0);
    $('#convert-front').value = '';
    $('#project-files').files = [
      { ...markdown('agent.md', '# A role'), webkitRelativePath: 'root/.theora/roles/front/agent.md' },
      { ...markdown('theora.json', '{"front_man": "private_unclosed'), webkitRelativePath: 'root/.theora/config/theora.json' },
    ];
    await $('#project-files').fire('change');
    await $('#convert-form').fire('submit');
    assert.match($('#convert-status').textContent, /CVT-IN-003/);
    assert.doesNotMatch($('#convert-status').textContent, /private_unclosed/);
    $('#markdown-files').files = [{ name: 'broken.md', arrayBuffer: async () => new Uint8Array([0xff]).buffer }];
    await $('#markdown-files').fire('change');
    assert.match($('#convert-status').textContent, /Could not read UTF-8/);
    assert.equal($('#convert-submit').disabled, true);
    globalThis.fetch = async () => new Response('', { status: 404 });
    await samples[1].fire('click');
    assert.match($('#convert-status').textContent, /No artifacts produced/);
  });
  await t.test('AW2 failure is not success', async t => {
    const { $, samples } = await mount(t, 'converter', { invalidReport: true });
    await samples[0].fire('click');
    assert.match($('#convert-status').textContent, /Static checks failed/);
    assert.equal($('#convert-status').dataset.state, 'error');
    assert.match($('#converter-report').textContent, /FAIL · network.document[\s\S]*\/network[\s\S]*Inspect the artifact/);
  });
});

test('converter web: late acquisition cannot replace new input and option changes invalidate outputs', async t => {
  const { $, samples } = await mount(t);
  const pending = Promise.withResolvers();
  globalThis.fetch = async () => pending.promise;
  const loading = samples[1].fire('click');
  const read = Promise.withResolvers();
  $('#markdown-files').files = [{ name: 'fresh.md', arrayBuffer: () => read.promise }];
  const reading = $('#markdown-files').fire('change');
  $('#convert-layout').value = 'markdown';
  const reloading = $('#convert-layout').fire('change');
  read.resolve(new TextEncoder().encode('# Fresh role\nUse public facts.').buffer);
  await Promise.all([reading, reloading]);
  await $('#convert-form').fire('submit');
  assert.equal(output($).network.tools[0].name, 'fresh');
  pending.resolve(new Response(JSON.stringify(await fixture())));
  await loading;
  assert.equal(output($).network.tools[0].name, 'fresh');
  $('#convert-layout').value = 'theora';
  await $('#convert-layout').fire('change');
  assert.equal($('#converter-output').hidden, true);
  await $('#convert-form').fire('submit');
  assert.match($('#convert-status').textContent, /CVT-IN-002/);
  assert.equal($('#converter-downloads').children.length, 0);
  const staleRead = Promise.withResolvers();
  $('#markdown-files').files = [{ name: 'stale.md', arrayBuffer: () => staleRead.promise }];
  const stale = $('#markdown-files').fire('change');
  $('#convert-layout').value = '';
  const staleLayout = $('#convert-layout').fire('change');
  $('#markdown-files').files = [markdown('latest.md', '# Latest role\nUse public facts.')];
  await $('#markdown-files').fire('change');
  await $('#convert-form').fire('submit');
  staleRead.resolve(new TextEncoder().encode('# Stale role').buffer);
  await Promise.all([stale, staleLayout]);
  assert.equal(output($).network.tools[0].name, 'latest');
});

test('converter web: blocked handoff storage offers manual download without navigating', async t => {
  const store = storage();
  store.setItem = () => { throw new Error('Quota exceeded'); };
  const { $, samples, navigations } = await mount(t, 'converter', { store });
  await samples[0].fire('click');
  await $('#open-review').fire('click');
  assert.equal(navigations.length, 0);
  assert.match($('#convert-status').textContent, /Storage may be blocked or full/);
  assert.equal($('#converter-output').hidden, false);
  assert.equal($('#converter-downloads').children.length, 3);
});

test('converter handoff: Review Desk consumes valid data once, checks it without execution and rejects malformed payloads', async t => {
  const input = bundle(await fixture());
  await t.test('valid once', async t => {
    const store = storage(JSON.stringify(input));
    const { $, requests, bootCalls, html } = await mount(t, 'site', { store });
    assert.match(html, /href="\.\/converter.html"/);
    assert.deepEqual(JSON.parse($('#network-json').value), input.network);
    assert.deepEqual(JSON.parse($('#manifest-json').value), input.manifest);
    assert.deepEqual(JSON.parse($('#links-json').value), input.links);
    assert.match($('#review-status').textContent, /[Ss]tatic/);
    assert.match($('#rule-report').textContent, /UNVERIFIED · runtime.safety/);
    assert.equal(store.values.has(handoffKey), false);
    assert.deepEqual(store.events.slice(0, 2), [['get', handoffKey], ['remove', handoffKey]]);
    assert.equal(requests.length, 0);
    assert.equal(bootCalls.length, 1, 'only the normal Review Desk shell boots, not the converted network');
    await t.test('reload has no remaining transfer', async t => {
      const again = await mount(t, 'site', { store });
      assert.equal(again.$('#network-json').value, '');
      assert.equal(again.$('#rule-report').children.length, 0);
    });
  });
  for (const [name, raw] of [
    ['invalid JSON', '{"private_source":'], ['null', 'null'], ['array', '[]'],
    ['missing links', JSON.stringify({ manifest: input.manifest, network: input.network })],
    ['wrong shape', JSON.stringify({ manifest: {}, network: [], links: {} })],
    ['extra context', JSON.stringify({ ...input, baseUrl: 'https://private.example/' })],
    ['null links', JSON.stringify({ ...input, links: null })],
  ]) await t.test(name, async t => {
    const store = storage(raw);
    const { $, requests } = await mount(t, 'site', { store });
    assert.equal(store.values.has(handoffKey), false);
    assert.equal($('#network-json').value, '');
    assert.equal($('#rule-report').children.length, 0);
    assert.equal($('#review-status').dataset.state, 'error');
    assert.doesNotMatch($('#review-status').textContent, /private_source|private.example/);
    assert.equal(requests.length, 0);
  });
  await t.test('valid envelope with invalid nested data is a static failure', async t => {
    const bad = structuredClone(input);
    bad.manifest.networks[0].front_man = { toString: null };
    const { $, requests } = await mount(t, 'site', { store: storage(JSON.stringify(bad)) });
    assert.match($('#rule-report').textContent, /FAIL · manifest.front_man/);
    assert.equal($('#review-status').dataset.state, 'error');
    assert.equal(requests.length, 0);
  });
  await t.test('storage deletion failure prevents consumption', async t => {
    const store = storage(JSON.stringify(input));
    store.removeItem = () => { throw new Error('Denied'); };
    const { $, requests } = await mount(t, 'site', { store });
    assert.equal($('#network-json').value, '');
    assert.equal($('#rule-report').children.length, 0);
    assert.equal($('#review-status').dataset.state, 'error');
    assert.equal(requests.length, 0);
  });
  await t.test('storage unavailable does not block the desk', async t => {
    const { $, bootCalls } = await mount(t, 'site', { store: { getItem() { throw new Error('Denied'); } } });
    assert.equal($('#network-json').value, '');
    assert.equal(bootCalls.length, 1);
  });
});

