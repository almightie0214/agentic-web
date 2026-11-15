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
  $('#agent-app').querySelector = selector => selector === '#ns-input' ? chat : null;
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
  return { $, samples, trace, runtime, requests, chat, paste, failureRows, ready, html };
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
  paste({ manifest: null, network: [] });
  await $('#validate-form').fire('submit');
  assert.ok(failureRows().length > 0, 'valid JSON with wrong shape is a rule failure, not a parser error');
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
  trace.note('consent', { parent: agent, peerOrigin: 'denied.localhost', decision: 'declined', requestPayload: 'not displayed' });
  trace.end(run);
  assert.match($('#runtime-events').textContent, new RegExp(`${run} → ${agent}: agent review_entry`));
  assert.match($('#runtime-events').textContent, /consent denied.localhost — declined/);
  assert.doesNotMatch($('#runtime-events').textContent, /not displayed/);
  assert.match($('#runtime-events').textContent, /router.localhost \/ scripted-model \/ mock/);
  assert.match($('#trust-state').textContent, /1 peer-fetch spans, 0 peer-call spans, 1 explicit consent-decision events/);
  assert.match($('#trust-state').textContent, /not proof[\s\S]*unverified/);
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
