import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { registerHooks } from 'node:module';
import test from 'node:test';
import { fixtures } from './fixtures.mjs';
import { TraceBus } from '../site-a/runtime/trace.js';
import { AgentNetwork } from '../site-a/runtime/kernel.js';

const root = new URL('../', import.meta.url);
let mountId = 0;

// Minimal DOM boundary: handlers and rendered text come from the real site module.
class Element extends EventTarget {
  constructor() {
    super();
    this.children = [];
    this.dataset = {};
    this.value = '';
    this.disabled = false;
    this.hidden = false;
    this.text = '';
    this.handlers = new Map();
  }
  set textContent(value) { this.text = String(value); this.children = []; }
  get textContent() { return this.text + this.children.map(child => child.textContent).join('\n'); }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.text = ''; this.children = nodes; }
  setAttribute(name, value) { this[name] = value; }
  addEventListener(name, handler) {
    super.addEventListener(name, handler);
    this.handlers.set(name, handler);
  }
  async fire(name) {
    if (name === 'click' && this.disabled) return;
    return this.handlers.get(name)?.({ preventDefault() {} });
  }
  focus() { this.focused = true; }
}

async function mount(t, { fail = false, config = fixtures.valid, deferBoot } = {}) {
  const html = await readFile(new URL('site-a/index.html', root), 'utf8');
  const elements = new Map([...html.matchAll(/id="([^"]+)"/g)].map(match => [`#${match[1]}`, new Element()]));
  for (const match of html.matchAll(/id="([^"]+)"[^>]*>([^<]*)/g)) elements.get(`#${match[1]}`).textContent = match[2];
  const samples = [...html.matchAll(/data-sample="([^"]+)"[^>]*>([^<]+)/g)].map(match => {
    const element = new Element();
    element.dataset.sample = match[1];
    element.textContent = match[2];
    return element;
  });
  const $ = selector => elements.get(selector);
  $('#agent-app').hidden = true;
  $('#audit-peer').disabled = true;
  const chat = new Element();
  const send = new Element();
  const newChat = new Element();
  $('#agent-app').querySelector = selector => ({ '#ns-input': chat, '#ns-send': send, '#ns-newchat': newChat })[selector] ?? null;
  const trace = new TraceBus();
  const input = structuredClone(config);
  const runtime = { engine: { top: {
    base: 'https://desk.localhost/nested/site-a', manifest: input.manifest,
    network: new AgentNetwork(input.network, input.manifest.networks[0].name),
  } }, trace, actions: { register() {} } };
  const requests = [];
  const entered = Promise.withResolvers();
  const saved = new Map(['document', 'window', 'fetch', '__deskBoot'].map(name =>
    [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  for (const [name, value] of Object.entries({
    document: { querySelector: $, querySelectorAll: selector => selector === '[data-sample]' ? samples : [], createElement: () => new Element() },
    window: { confirm: () => true },
    __deskBoot: async () => {
      entered.resolve();
      if (deferBoot) await deferBoot;
      if (fail) throw new Error('Runtime unavailable');
      return runtime;
    },
    fetch: async (url, options) => {
      requests.push({ url: String(url), options });
      const data = await readFile(url, 'utf8');
      return new Response(data);
    },
  })) Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  const entry = new URL(`site-a/site.js?desk-ui-${mountId++}`, root);
  const hooks = registerHooks({
    resolve(specifier, context, nextResolve) {
      if (context.parentURL === entry.href && specifier === './runtime/index.js') {
        return { url: 'data:text/javascript,export async function boot() { return globalThis.__deskBoot(); }', shortCircuit: true };
      }
      return nextResolve(specifier, context);
    },
  });
  t.after(() => {
    hooks.deregister();
    for (const [name, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  });
  const ready = import(entry);
  if (!deferBoot) await ready;
  else await entered.promise;
  const paste = value => {
    for (const [key, id] of Object.entries({ manifest: 'manifest-json', network: 'network-json', links: 'links-json',
      baseUrl: 'review-base', networkName: 'network-name', activePeerChain: 'peer-chain' })) {
      $(`#${id}`).value = value[key] === undefined ? '' : ['baseUrl', 'networkName'].includes(key) ? value[key] : JSON.stringify(value[key]);
    }
  };
  const failureRows = () => $('#rule-report').children.filter(item => item.dataset.state === 'fail');
  return { $, samples, trace, runtime, requests, chat, send, newChat, paste, failureRows, ready, html };
}

test('desk UI: key-free samples and paste retain rule statuses, paths, hints and invalidate edited reports', async t => {
  const { $, samples, requests, paste, failureRows, html } = await mount(t);
  assert.match(html, /<link rel="stylesheet" href="\.\/styles.css">/);
  assert.equal(samples.length, 4);
  for (const sample of samples) {
    await sample.fire('click');
    assert.equal(failureRows().length > 0, sample.dataset.sample !== 'valid');
    const report = $('#rule-report').textContent;
    assert.match(report, /UNVERIFIED · runtime.safety/);
    assert.match(report, /WARNING · execution.limit/);
    assert.match(report, /\/network/);
    if (sample.dataset.sample !== 'valid') assert.match(report, /Minimal fix \/ next step:/);
    if (sample.dataset.sample === 'bad-cycle') assert.match(report, /FAIL · peer.composition/);
    if (sample.dataset.sample === 'bad-frontman') assert.match(report, /\/manifest\/networks\/0\/front_man/);
    if (sample.dataset.sample === 'bad-schema') assert.match(report, /\/network\/tools\/1\/function\/parameters\/type/);
  }
  assert.ok(requests.every(request => request.url.includes('/site-a/samples/') && request.options.credentials === 'omit'));
  const before = requests.length;
  paste(fixtures.valid);
  await $('#validate-form').fire('submit');
  assert.equal(failureRows().length, 0);
  assert.match($('#review-status').textContent, /Static checks passed/);
  assert.match($('#review-graph').textContent, /review_entry → artifact_reader/);
  assert.equal(requests.length, before, 'pasting never fetches or calls inference');
  $('#manifest-json').value = '{ broken';
  await $('#manifest-json').fire('input');
  assert.equal($('#rule-report').children.length, 0);
  await $('#validate-form').fire('submit');
  assert.match($('#rule-report').textContent, /ERROR · input.json[\s\S]*\/manifest[\s\S]*Invalid JSON[\s\S]*Correct the JSON syntax/);
  assert.match($('#review-status').textContent, /No rule verdict/);
  assert.equal(failureRows().length, 0);
  const invalidText = { toString: null };
  const malformedName = structuredClone(fixtures.valid);
  malformedName.manifest.networks[0].name = invalidText;
  const malformedGraph = structuredClone(fixtures.valid);
  malformedGraph.network.tools[1].name = invalidText;
  malformedGraph.network.tools[0].tools = ['peer', { url: invalidText }];
  malformedGraph.network.link_slots = { peer: {} };
  malformedGraph.network.links = { peer: invalidText };
  const cases = [
    { input: { manifest: null, network: [] }, rule: 'network.document', graph: '(missing network name)' },
    { input: { manifest: { networks: [{ name: invalidText, front_man: 'front', hocon: './network.json' }] }, network: [] },
      rule: 'manifest.name', graph: 'Manifest → {"toString":null} → front agent: front' },
    { input: { manifest: { networks: [{ name: invalidText, front_man: 'front', hocon: './network.json' }] },
      network: [], links: { networks: {} } }, rule: 'manifest.name', graph: 'Manifest → {"toString":null}' },
    { input: { manifest: { networks: [{ name: 'review', front_man: [invalidText], hocon: invalidText }],
      peer_policy: { mode: invalidText }, allowed_peers: [invalidText], llm_router: { base_url: invalidText } }, network: [], links: { networks: {} } },
      rule: 'manifest.front_man', graph: ['front agent: [{"toString":null}]', 'Definition: {"toString":null}',
        'peer policy: {"toString":null}', 'allowed peers: [{"toString":null}]', 'Router declaration: {"toString":null}'] },
    { input: malformedName, rule: 'manifest.name', graph: 'Manifest → {"toString":null} → front agent: review_entry' },
    { input: malformedGraph, rule: 'agent.name', graph: 'peer → {"toString":null} · MCP: {"toString":null}' },
  ];
  for (const { input, rule, graph } of cases) {
    paste(input);
    await $('#validate-form').fire('submit');
    assert.ok(failureRows().length > 0, 'valid JSON with wrong shape is a rule failure, not a parser error');
    assert.ok($('#rule-report').textContent.includes(`FAIL · ${rule}`));
    if (input === malformedName) {
      const nameFailure = failureRows().find(row => row.textContent.includes('FAIL · manifest.name'));
      assert.match(nameFailure.textContent, /\/manifest\/networks\/0\/name/);
      assert.match(nameFailure.textContent, /Minimal fix \/ next step: Supply the published network's name\./);
    }
    assert.match($('#rule-report').textContent, /Minimal fix \/ next step:/);
    assert.match($('#review-status').textContent, /Static review is not ready/);
    assert.equal($('#review-status').dataset.state, 'error');
    for (const text of [graph].flat()) {
      assert.ok($('#review-graph').textContent.includes(text), 'the graph safely preserves malformed JSON field values');
    }
  }
  assert.ok($('#review-graph').textContent.includes('{"toString":null} → (no calls declared)'));
});

test('desk UI: editor test run requires current checks and a click, renders full answers, cancels and excludes chat', async t => {
  const { $, runtime, trace, chat, send, newChat, paste, samples } = await mount(t);
  const calls = [];
  let pending;
  runtime.engine.runEditor = (input, message, options) => {
    calls.push({ input, message, options });
    pending = Promise.withResolvers();
    options.signal.addEventListener('abort', () => pending.reject(options.signal.reason), { once: true });
    return pending.promise;
  };
  $('#test-run-message').value = 'Delegate this request.';
  await $('#test-run-message').fire('input');
  assert.equal($('#test-run-start').disabled, true);
  await samples[1].fire('click');
  assert.equal($('#test-run-start').disabled, true, 'failed checks cannot run');
  await $('#test-run-form').fire('submit');
  assert.equal(calls.length, 0);
  paste(fixtures.valid);
  await $('#validate-form').fire('submit');
  assert.equal(calls.length, 0, 'checking never executes');
  assert.equal($('#test-run-start').disabled, false);
  await $('#network-json').fire('input');
  assert.equal($('#test-run-start').disabled, true, 'edits invalidate permission to run');
  await $('#test-run-form').fire('submit');
  assert.equal(calls.length, 0);
  await $('#validate-form').fire('submit');
  const chatRun = trace.start('run');
  assert.equal($('#test-run-start').disabled, true, 'chat and editor runs cannot overlap');
  await $('#test-run-form').fire('submit');
  assert.equal(calls.length, 0);
  trace.end(chatRun);
  await Promise.resolve();
  runtime.engine.running = true;
  await $('#test-run-form').fire('submit');
  assert.equal(calls.length, 0, 'engine busy state also blocks start');
  runtime.engine.running = false;
  const running = $('#test-run-form').fire('submit');
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].input, fixtures.valid);
  assert.equal(calls[0].message, 'Delegate this request.');
  assert.ok(calls[0].options.signal instanceof AbortSignal);
  for (const control of [chat, send, newChat, $('#test-run-start')]) assert.equal(control.disabled, true);
  assert.equal($('#test-run-stop').disabled, false);
  const answer = 'Full answer.\n\n<literal markup>\nFinal paragraph.';
  pending.resolve({ text: answer });
  await running;
  assert.equal($('#test-run-answer').textContent, answer);
  assert.match($('#test-run-status').textContent, /completed/);
  for (const control of [chat, send, newChat, $('#test-run-start')]) assert.equal(control.disabled, false);
  assert.equal($('#test-run-stop').disabled, true);
  const cancelled = $('#test-run-form').fire('submit');
  await $('#test-run-stop').fire('click');
  await cancelled;
  assert.equal(calls[1].options.signal.aborted, true);
  assert.match($('#test-run-answer').textContent, /cancelled/);
  assert.equal(send.disabled, false);
  const failed = $('#test-run-form').fire('submit');
  pending.reject(new Error('Configure your provider API key.'));
  await failed;
  assert.match($('#test-run-answer').textContent, /Configure your provider API key/);
  assert.equal($('#test-run-status').dataset.state, 'error');
});

test('desk UI: editor displays complete structured runtime answers and display errors', async t => {
  const { $, runtime, trace, paste } = await mount(t);
  const { Engine } = await import('../site-a/runtime/engine.js');
  const router = 'https://display-router.invalid/v1';
  const base = 'https://desk.invalid';
  const manifest = { networks: [{ name: 'desk', hocon: './desk.json' }], llm_router: { base_url: router, byok_router: router } };
  const engine = new Engine({ originUrl: base, trace, byokKey: 'display-test-key', modelOverride: 'display-model' });
  engine.top = { ...engine._compileDefinition({ tools: [{ name: 'desk', instructions: 'Answer.', tools: [] }] },
    manifest, manifest.networks[0], { base, isTop: true }), base, manifest };
  runtime.engine = engine;
  paste(fixtures.valid);
  await $('#validate-form').fire('submit');
  $('#test-run-message').value = 'Show the complete answer.';
  await $('#test-run-message').fire('input');
  const report = { kind: 'report', markdown: 'Actual structured answer.\n\nSecond paragraph.' };
  const html = { kind: 'html', html: '<img src=x onerror="alert(1)">Literal untrusted answer.' };
  const cases = [
    { raw: JSON.stringify({ version: 1, components: [report] }), text: '', components: [report] },
    { raw: 'Introductory prose.\n```cruse-ui\n' + JSON.stringify({ version: 1, components: [report, html] }) + '\n```',
      text: 'Introductory prose.', components: [report, html] },
    { raw: 'Remaining answer.\n```cruse-ui\n' + JSON.stringify({ version: 1, components: [report, { kind: 'confirm' }] }) + '\n```',
      text: 'Remaining answer.', components: [report], issue: 'Invalid confirm component.' },
  ];
  const requests = [];
  for (const scenario of cases) {
    globalThis.fetch = async (url, options) => {
      requests.push(url);
      assert.equal(url, router + '/chat/completions');
      assert.equal(options.headers.Authorization, 'Bearer display-test-key');
      return new Response(`data: ${JSON.stringify({ choices: [{ delta: { content: scenario.raw }, finish_reason: 'stop' }] })}\n\ndata: [DONE]\n\n`,
        { headers: { 'Content-Type': 'text/event-stream' } });
    };
    await $('#test-run-form').fire('submit');
    const output = $('#test-run-answer');
    if (scenario.text) assert.ok(output.children.some(child => child.textContent === scenario.text));
    const structured = output.children.find(child => child.textContent.startsWith('{'));
    assert.ok(structured, 'the parsed presentation must remain visible even without prose');
    const displayed = JSON.parse(structured.textContent);
    assert.equal(displayed.version, 1);
    assert.deepEqual(displayed.components.map(({ id, ...component }) => component), scenario.components);
    assert.ok(output.children.some(child => child.textContent.includes('read-only')));
    if (scenario.issue) {
      assert.match($('#test-run-status').textContent, /display errors/);
      assert.equal($('#test-run-status').dataset.state, 'error');
      assert.ok(output.textContent.includes(scenario.issue));
    } else {
      assert.match($('#test-run-status').textContent, /completed/);
      assert.equal($('#test-run-status').dataset.state, '');
    }
  }
  assert.equal(requests.length, cases.length);
  assert.equal(trace.events.filter(event => event.kind === 'agent_result').length, cases.length,
    'each screen result must come through the real runner and response parser');
});

test('desk UI: downloads preserve checked editor bytes and release stale artifacts', async t => {
  const { $, paste } = await mount(t);
  paste(fixtures.valid);
  $('#manifest-json').value = '\n' + JSON.stringify(fixtures.valid.manifest, null, 4) + '\n\n';
  await $('#validate-form').fire('submit');
  const links = $('#review-downloads').children;
  assert.deepEqual(links.map(link => link.download), ['artifact_review.network.json', 'agent-manifest.json', 'links.json']);
  for (const [index, id] of ['network-json', 'manifest-json', 'links-json'].entries()) {
    const text = await (await import('node:buffer')).resolveObjectURL(links[index].href).text();
    assert.equal(text, $(`#${id}`).value);
  }
  const old = links[0].href;
  await $('#network-json').fire('input');
  assert.equal($('#review-downloads').children.length, 0);
  assert.equal((await import('node:buffer')).resolveObjectURL(old), undefined);
  $('#links-json').value = '';
  await $('#validate-form').fire('submit');
  assert.equal($('#review-downloads').children.length, 2, 'links are optional');
});

test('desk UI: workflow navigation has the same five destinations and live section anchors', async t => {
  const { html } = await mount(t);
  const converter = await readFile(new URL('site-a/converter.html', root), 'utf8');
  const links = source => [...source.matchAll(/<nav[^>]*>([\s\S]*?)<\/nav>/g)][0][1]
    .match(/<a\b[^>]*>[\s\S]*?<\/a>/g).map(link => ({ href: link.match(/href="([^"]+)"/)[1], text: link.match(/>([^<]+)</)[1] }));
  const destination = (link, documentURL) => {
    const url = new URL(link.href, documentURL);
    url.pathname = url.pathname.replace(/\/index\.html$/, '/');
    return { href: url.href, text: link.text };
  };
  const deskURL = 'https://desk.invalid/nested/';
  const converterURL = 'https://desk.invalid/nested/converter.html';
  assert.deepEqual(links(html).map(link => destination(link, deskURL)),
    links(converter).map(link => destination(link, converterURL)));
  assert.deepEqual(links(html).map(link => link.text), ['Import', 'Check', 'Ask the spec', 'Test run', 'Download']);
  for (const link of links(html).slice(1)) {
    assert.ok(link.href.startsWith('#'), 'desk steps must stay in the current document at directory and explicit index URLs');
    assert.ok(html.includes(`id="${link.href.slice(1)}"`));
  }
});

test('desk UI: pending chat boot and stale sample loads cannot replace the current report', async t => {
  const loaded = Promise.withResolvers();
  const { $, samples, paste, ready } = await mount(t, { deferBoot: loaded.promise });
  assert.equal($('#agent-app').hidden, true);
  paste(fixtures.valid);
  await $('#validate-form').fire('submit');
  assert.match($('#review-status').textContent, /Static checks passed/);
  globalThis.fetch = async () => { throw new TypeError('Failed to fetch'); };
  $('#audit-url').value = 'https://unavailable.localhost/subpath/';
  await $('#audit-form').fire('submit');
  loaded.resolve();
  await ready;
  assert.equal($('#agent-app').hidden, false);
  assert.match($('#rule-report').textContent, /ERROR · acquisition.fetch/);
  assert.doesNotMatch($('#rule-report').textContent, /FAIL ·/);
  const response = Promise.withResolvers();
  globalThis.fetch = async () => response.promise;
  const sampling = samples[0].fire('click');
  $('#network-json').value = '{}';
  await $('#network-json').fire('input');
  response.resolve(new Response(JSON.stringify(fixtures.valid)));
  await sampling;
  assert.equal($('#rule-report').children.length, 0);
  assert.match($('#review-status').textContent, /Inputs changed/);
  globalThis.fetch = async () => new Response('', { status: 404 });
  await samples[0].fire('click');
  assert.match($('#review-status').textContent, /sample could not be loaded[\s\S]*not a rule violation/);
});

test('desk UI: unavailable chat does not block samples, pasted checks or URL audits', async t => {
  const { $, samples, paste, failureRows } = await mount(t, { fail: true });
  assert.equal($('#agent-app').hidden, true);
  assert.match($('#site-status').textContent, /could not be loaded/);
  await samples[1].fire('click');
  assert.ok(failureRows().length > 0);
  paste(fixtures.valid);
  await $('#validate-form').fire('submit');
  assert.match($('#review-status').textContent, /Static checks passed/);
  globalThis.fetch = async url => new Response(JSON.stringify(String(url).endsWith('agent-manifest.json')
    ? fixtures.valid.manifest : String(url).endsWith('links.json') ? fixtures.valid.links : fixtures.valid.network));
  $('#audit-url').value = 'https://public.localhost/agentic-web/';
  await $('#audit-form').fire('submit');
  assert.match($('#review-status').textContent, /Readiness: public JSON retrieved/);
});

test('desk UI: URL audit separates acquisition errors from rules and ignores stale results', async t => {
  const { $, requests } = await mount(t);
  globalThis.fetch = async (url, options) => {
    requests.push({ url: String(url), options });
    return new Response(JSON.stringify(String(url).endsWith('agent-manifest.json')
      ? fixtures.valid.manifest : String(url).endsWith('links.json') ? fixtures.valid.links : fixtures.valid.network));
  };
  $('#audit-url').value = 'https://public.localhost/agentic-web';
  await $('#audit-form').fire('submit');
  assert.deepEqual(requests.map(item => item.url), [
    'https://public.localhost/agentic-web/agent-manifest.json',
    'https://public.localhost/agentic-web/artifact_review.network.json',
    'https://public.localhost/agentic-web/links.json',
  ]);
  assert.ok(requests.every(({ options }) => options.credentials === 'omit' && options.method === 'GET'));
  assert.match($('#review-status').textContent, /Readiness: public JSON retrieved/);
  assert.match($('#review-graph').textContent, /artifact_review/);
  globalThis.fetch = async url => new Response(JSON.stringify(String(url).endsWith('agent-manifest.json')
    ? fixtures['bad-schema'].manifest : String(url).endsWith('links.json') ? fixtures['bad-schema'].links : fixtures['bad-schema'].network));
  await $('#audit-form').fire('submit');
  assert.match($('#review-status').textContent, /Readiness: blocked by reported rule violations/);
  assert.match($('#rule-report').textContent, /FAIL · agent.parameters/);
  assert.doesNotMatch($('#rule-report').textContent, /acquisition\./);
  globalThis.fetch = async () => { throw new TypeError('Failed to fetch'); };
  await $('#audit-form').fire('submit');
  assert.match($('#rule-report').textContent, /ERROR · acquisition.fetch[\s\S]*\/manifest[\s\S]*cause is unknown/);
  assert.doesNotMatch($('#rule-report').textContent, /FAIL ·/);
  assert.match($('#review-status').textContent, /does not establish a rule violation or a CORS cause/);
  globalThis.fetch = async () => new Response('{');
  await $('#audit-form').fire('submit');
  assert.match($('#rule-report').textContent, /acquisition.json/);
  const pending = Promise.withResolvers();
  globalThis.fetch = async () => pending.promise;
  const audit = $('#audit-form').fire('submit');
  $('#audit-url').value = 'https://different.localhost/';
  await $('#audit-url').fire('input');
  pending.resolve(new Response('{}', { status: 404 }));
  await audit;
  assert.equal($('#rule-report').children.length, 0);
  assert.match($('#review-status').textContent, /URL changed/);
});

test('desk UI: presets and explanation drafts never invoke peers or bypass runtime consent', async t => {
  const { $, paste, failureRows, chat, requests } = await mount(t);
  assert.equal($('#audit-peer').disabled, true);
  await $('#audit-this').fire('click');
  assert.equal($('#audit-url').value, new URL('site-a/', root).href);
  await $('#audit-noncors').fire('click');
  assert.equal($('#audit-url').value, 'https://example.com/');
  assert.equal(requests.length, 0, 'presets only populate destinations');
  paste(fixtures['bad-frontman']);
  await $('#validate-form').fire('submit');
  const actions = failureRows()[0].children.find(child => child.className === 'desk-actions');
  const [explain, scout] = actions.children;
  assert.equal(scout.disabled, true);
  await explain.fire('click');
  assert.match(chat.value, /conformance_reviewer[\s\S]*finding[\s\S]*manifest.front_man[\s\S]*\/manifest\/networks\/0\/front_man/);
  assert.equal(chat.focused, true);
  assert.match($('#draft-status').textContent, /not sent/);
  assert.equal(requests.length, 0);
  const original = chat.value;
  window.confirm = () => false;
  await explain.fire('click');
  assert.equal(chat.value, original, 'an existing draft is preserved when replacement is declined');
  chat.disabled = true;
  await explain.fire('click');
  assert.match($('#draft-status').textContent, /unavailable or busy/);
});

test('desk UI: runtime graph uses current-run spans, actual decisions and effective links without claiming security', async t => {
  const config = structuredClone(fixtures.valid);
  config.network.link_slots = { spec_scout: {} };
  config.network.links = { spec_scout: 'https://replace-me.example/spec_scout' };
  config.network.tools[1].tools = ['spec_scout'];
  const { $, trace, runtime, paste, failureRows, chat, requests } = await mount(t, { config });
  assert.equal($('#audit-peer').disabled, true, 'placeholder URLs are not executable presets');
  assert.match($('#runtime-config').textContent, /spec_scout → https:\/\/replace-me.example\/spec_scout/);
  assert.match($('#trust-state').textContent, /Not run/);
  trace.start('compile', { network: 'unrelated' });
  assert.equal($('#runtime-events').children.length, 0);
  const run = trace.start('run', { input: 'not displayed' });
  const agent = trace.start('agent', { parent: run, agent: 'review_entry' });
  const model = trace.start('model_call', { parent: agent, routerHost: 'router.localhost', model: 'scripted-model', mock: true });
  trace.end(model);
  const peer = trace.start('remote_fetch', { parent: agent, peerOrigin: 'scout.localhost' });
  trace.end(peer, { network: 'spec_scout' });
  trace.note('consent', { parent: agent, peerOrigin: 'denied.localhost', decision: 'decline', source: 'decline', requestPayload: 'not displayed' });
  trace.end(run);
  assert.match($('#runtime-events').textContent, new RegExp(`${run} → ${agent}: agent review_entry`));
  assert.match($('#runtime-events').textContent, /consent denied.localhost — decline/);
  assert.doesNotMatch($('#runtime-events').textContent, /not displayed/);
  assert.match($('#runtime-events').textContent, /router.localhost \/ scripted-model \/ mock/);
  assert.match($('#trust-state').textContent, /1 peer-fetch spans, 0 peer-call spans, 1 explicit consent-decision events/);
  assert.match($('#trust-state').textContent, /not proof[\s\S]*unverified/);
  for (const source of ['prompt_allow', 'prompt_always', 'remembered_always', 'headless_default']) {
    trace.note('consent', { parent: agent, peerOrigin: 'scout.localhost', decision: 'allow', source });
  }
  const trust = $('#trust-state').textContent;
  assert.match(trust, /5 explicit consent-decision events/);
  for (const label of ['Allow once', 'Always allow now', 'Remembered always allow', 'Decline', 'No UI hook default allow']) {
    assert.ok(trust.includes(label + ': 1'), label);
  }
  assert.doesNotMatch(trust, /Consent without an event/);
  trace.start('run');
  assert.doesNotMatch($('#runtime-events').textContent, /review_entry|denied.localhost/);
  assert.match($('#trust-state').textContent, /0 peer-fetch spans/);
  runtime.engine.top.network.setLink('spec_scout', 'relative/spec_scout');
  trace.note('link', { reference: 'spec_scout', target: 'relative/spec_scout' });
  assert.equal($('#audit-peer').disabled, true, 'relative named bindings are not executable runtime targets');
  runtime.engine.top.network.setLink('spec_scout', 'https://scout.localhost/subpath/spec_scout');
  trace.note('link', { reference: 'spec_scout', target: 'https://scout.localhost/subpath/spec_scout' });
  assert.equal($('#audit-peer').disabled, false);
  await $('#audit-peer').fire('click');
  assert.equal($('#audit-url').value, 'https://scout.localhost/subpath/');
  assert.equal($('#network-name').value, 'spec_scout');
  paste(fixtures['bad-schema']);
  await $('#validate-form').fire('submit');
  const actions = failureRows()[0].children.find(child => child.className === 'desk-actions');
  assert.equal(actions.children[1].disabled, false);
  await actions.children[1].fire('click');
  assert.match(chat.value, /Spec Scout at https:\/\/scout.localhost\/subpath\/spec_scout[\s\S]*normal peer policy and consent flow/);
  assert.equal(requests.length, 0, 'drafting and event display do not contact peers');
});
