// Node 24 + an installed Microsoft Edge; no npm packages or external services.
// Run: node tools/browser-check.mjs (optional EDGE_PATH selects the executable).
// Only served manifest router/peer origins and links bindings are localized.
// HTML, scripts, styles and network definitions are served from this candidate.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { access, mkdir, mkdtemp, readFile, realpath, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const root = fileURLToPath(new URL('../', import.meta.url));
const timeout = 30_000;
const model = 'csp-check-model';
const sentinel = 'csp-check-not-a-real-key';
const peerText = 'Spec Scout loopback answer: published network names must match exactly.';
const finalText = 'CSP browser check complete: local validation and peer reply received.';
const editorText = 'Fictional Cedar Museum route: Courtyard, Cedar Gallery, Window Bench; CEDAR-27; 25 minutes.';
const probeSource = `
window.__cspProbe = { loaded: true, inlineRan: false, evalRan: false, evalBlocked: false };
const inline = document.createElement('script');
inline.textContent = 'window.__cspProbe.inlineRan = true';
document.head.append(inline);
try { eval('window.__cspProbe.evalRan = true'); }
catch (error) { window.__cspProbe.evalBlocked = error instanceof EvalError; }
`;

async function edgeExecutable() {
  const candidates = process.env.EDGE_PATH ? [process.env.EDGE_PATH] : process.platform === 'win32'
    ? [process.env['ProgramFiles(x86)'], process.env.ProgramFiles, process.env.LOCALAPPDATA]
      .filter(Boolean).map(base => path.join(base, 'Microsoft/Edge/Application/msedge.exe'))
    : process.platform === 'darwin'
      ? ['/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge']
      : ['/usr/bin/microsoft-edge', '/usr/bin/microsoft-edge-stable', '/opt/microsoft/msedge/msedge'];
  for (const candidate of candidates) {
    try { await access(candidate); return candidate; } catch { /* try next installed path */ }
  }
  throw new Error('설치된 Edge를 찾지 못했습니다. 기존 실행 파일을 EDGE_PATH로 지정하세요.');
}

class CDP {
  constructor(socket) {
    this.socket = socket;
    this.seq = 0;
    this.pending = new Map();
    this.listeners = new Set();
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        clearTimeout(pending.timer);
        if (message.error) pending.reject(new Error(JSON.stringify(message.error)));
        else pending.resolve(message.result);
      } else {
        for (const listener of this.listeners) listener(message);
      }
    });
    socket.addEventListener('close', () => {
      for (const pending of this.pending.values()) {
        clearTimeout(pending.timer);
        pending.reject(new Error('Edge CDP 연결이 닫혔습니다.'));
      }
      this.pending.clear();
    });
  }
  async send(method, params = {}, sessionId) {
    const id = ++this.seq;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP 시간 초과: ${method}`));
      }, timeout);
      this.pending.set(id, { resolve, reject, timer });
      this.socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  }
}

async function waitFor(check, label) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const result = await check();
    if (result) return result;
    await delay(50);
  }
  throw new Error(`흐름 시간 초과: ${label}`);
}

async function listen(handler) {
  const server = createServer((req, res) => {
    Promise.resolve(handler(req, res)).catch(error => {
      console.error('로컬 서버 오류:', error.message);
      if (!res.headersSent) res.writeHead(500);
      res.end();
    });
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return server;
}
const originOf = server => `http://127.0.0.1:${server.address().port}`;
const cors = { 'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' };
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.md': 'text/plain', '.svg': 'image/svg+xml' };

async function main() {
  const executable = await edgeExecutable();
  await mkdir(path.join(root, '.theora'), { recursive: true });
  const workspace = await mkdtemp(path.join(root, '.theora/browser-check-'));
  const servers = [];
  let child;
  let cdp;
  const report = { node: process.version, revision: 'working-tree', pages: [],
    modelRequests: 0, peerFetches: [], blockedExternal: [], protocolErrors: [], candidateFiles: {} };
  try {
    report.candidateFiles['tools/browser-check.mjs'] = createHash('sha256')
      .update(await readFile(fileURLToPath(import.meta.url))).digest('hex');
    const sample = JSON.parse(await readFile(path.join(root, 'site-a/samples/valid.network.json'), 'utf8'));
    const modelCalls = [];
    const router = await listen(async (req, res) => {
      if (req.method === 'OPTIONS') { res.writeHead(204, cors); res.end(); return; }
      if (req.url === '/v1/models' && req.method === 'GET') {
        res.writeHead(200, { ...cors, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ data: [{ id: model }] })); return;
      }
      assert.equal(req.url, '/v1/chat/completions');
      assert.equal(req.method, 'POST');
      assert.equal(req.headers.authorization, `Bearer ${sentinel}`);
      let body = '';
      for await (const chunk of req) body += chunk;
      const request = JSON.parse(body);
      modelCalls.push(request);
      report.modelRequests++;
      assert.equal(request.model, model);
      assert.equal(request.stream, true);
      const names = (request.tools || []).map(tool => tool.function.name);
      const called = new Set(request.messages.filter(message => message.role === 'tool').map(message => message.name));
      let name;
      let args;
      // Exercise the real local action as well as the cross-origin peer path.
      if (names.includes('conformance_reviewer')) {
        name = ['conformance_reviewer', 'spec_scout'].find(tool => names.includes(tool) && !called.has(tool));
        args = { request: 'Check the valid sample, then explain exact peer network naming.' };
      } else if (names.includes('website_validate_network') && !called.has('website_validate_network')) {
        name = 'website_validate_network';
        args = { manifest: JSON.stringify(sample.manifest), network: JSON.stringify(sample.network) };
      } else if (names.includes('specialist') || names.includes('researcher')) {
        name = ['specialist', 'researcher'].find(tool => names.includes(tool) && !called.has(tool));
        args = { inquiry: 'Ask the researcher for the fictional Cedar Museum route and exact route code.' };
      }
      const editor = names.includes('researcher') || request.messages[0]?.content.includes('fictional');
      const content = editor ? editorText : names.includes('conformance_reviewer') ? `## Result\n\n${finalText}`
        : names.includes('website_validate_network') ? 'The local validation receipt was received.' : peerText;
      const delta = name ? { tool_calls: [{ index: 0, id: `call_${modelCalls.length}`, type: 'function',
        function: { name, arguments: JSON.stringify(args) } }] } : { content };
      res.writeHead(200, { ...cors, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store' });
      res.end(`data: ${JSON.stringify({ model, choices: [{ index: 0, delta,
        finish_reason: name ? 'tool_calls' : 'stop' }] })}\n\ndata: [DONE]\n\n`);
    });
    servers.push(router);
    const routerUrl = `${originOf(router)}/v1`;
    let peerOrigin;
    let aOrigin;
    let consentAllowed = false;
    const originalLinks = JSON.parse(await readFile(path.join(root, 'site-a/links.json'), 'utf8'));
    const publishedPeer = new URL(originalLinks.networks.review_desk.spec_scout);
    const serveSite = async (site, req, res) => {
      const url = new URL(req.url, 'http://localhost');
      if (req.method === 'OPTIONS') { res.writeHead(204, cors); res.end(); return; }
      assert.equal(req.method, 'GET');
      const pathname = decodeURIComponent(url.pathname);
      if (site === 'site-b' && req.headers.origin === aOrigin) {
        assert.equal(consentAllowed, true, '피어 접촉이 Allow보다 먼저 발생했습니다.');
        assert.equal(req.headers.authorization, undefined);
        assert.equal(req.headers.cookie, undefined);
        report.peerFetches.push(pathname);
      }
      if (pathname === '/__csp-probe.js') {
        res.writeHead(200, { ...cors, 'Content-Type': 'text/javascript' });
        res.end(probeSource); return;
      }
      const siteRoot = await realpath(path.join(root, site));
      let filename = path.resolve(siteRoot, `.${pathname === '/' ? '/index.html' : pathname}`);
      const inside = file => file.startsWith(siteRoot + path.sep);
      if (!inside(filename)) { res.writeHead(403, cors); res.end(); return; }
      try { filename = await realpath(filename); }
      catch (error) {
        if (error.code !== 'ENOENT') throw error;
        res.writeHead(404, cors); res.end('Not found'); return;
      }
      assert.ok(inside(filename), '서빙 루트 밖 링크는 허용하지 않습니다.');
      let bytes = await readFile(filename);
      report.candidateFiles[path.relative(root, filename).replaceAll(path.sep, '/')] =
        createHash('sha256').update(bytes).digest('hex');
      if (pathname === '/agent-manifest.json') {
        const manifest = JSON.parse(bytes);
        manifest.llm_router = { ...manifest.llm_router, base_url: routerUrl, byok_router: routerUrl };
        manifest.allowed_peers = (manifest.allowed_peers || []).map(value =>
          value === publishedPeer.origin ? peerOrigin : value);
        bytes = JSON.stringify(manifest);
      } else if (site === 'site-a' && pathname === '/links.json') {
        const links = structuredClone(originalLinks);
        links.networks.review_desk.spec_scout = `${peerOrigin}${publishedPeer.pathname}`;
        bytes = JSON.stringify(links);
      }
      res.writeHead(200, { ...cors, 'Content-Type': mime[path.extname(filename)] || 'application/octet-stream',
        'Cache-Control': 'no-store' });
      res.end(bytes);
    };
    const b = await listen((req, res) => serveSite('site-b', req, res)); servers.push(b);
    peerOrigin = originOf(b);
    const peerBase = `${peerOrigin}${publishedPeer.pathname}`;
    const a = await listen((req, res) => serveSite('site-a', req, res)); servers.push(a);
    aOrigin = originOf(a);
    const allowedOrigins = new Set([aOrigin, peerOrigin, originOf(router)]);
    const downloadPath = path.join(workspace, 'downloads');
    await mkdir(downloadPath);
    child = spawn(executable, ['--headless=new', '--remote-debugging-port=0',
      `--user-data-dir=${path.join(workspace, 'profile')}`, '--no-first-run', '--no-default-browser-check',
      '--disable-background-networking', '--disable-component-update', '--disable-sync',
      '--disable-extensions', '--disable-features=msEdgeSidebarV2', '--window-size=1440,1200',
      '--proxy-server=http://127.0.0.1:9', '--proxy-bypass-list=127.0.0.1;localhost', 'about:blank'],
    { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    let launchError;
    child.on('error', error => { launchError = error; });
    child.stderr.on('data', data => { stderr = (stderr + data).slice(-16000); });
    const endpoint = await waitFor(() => {
      if (launchError) throw launchError;
      if (child.exitCode !== null) throw new Error(`Edge 종료 ${child.exitCode}: ${stderr}`);
      return stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/)?.[1];
    }, 'Edge CDP 시작');
    const socket = new WebSocket(endpoint);
    await once(socket, 'open');
    cdp = new CDP(socket);
    report.browser = await cdp.send('Browser.getVersion');
    await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath, eventsEnabled: true });
    const downloads = new Map();
    cdp.listeners.add(event => {
      if (event.method === 'Browser.downloadWillBegin') downloads.set(event.params.guid, { ...event.params });
      if (event.method === 'Browser.downloadProgress') Object.assign(downloads.get(event.params.guid) || {}, event.params);
    });

    async function openPage(url, label) {
      const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
      const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
      const send = (method, params) => cdp.send(method, params, sessionId);
      const page = { label, url, flows: [], csp: [], securityLog: [], cspIssues: [], securityEvents: [], exceptions: [], expectedViolations: 0 };
      report.pages.push(page);
      let probing = false;
      cdp.listeners.add(event => {
        if (event.sessionId !== sessionId) return;
        if (event.method === 'Fetch.requestPaused') {
          const request = event.params.request;
          const local = allowedOrigins.has(new URL(request.url).origin);
          if (!local) report.blockedExternal.push(request.url);
          send(local ? 'Fetch.continueRequest' : 'Fetch.failRequest', local
            ? { requestId: event.params.requestId } : { requestId: event.params.requestId, errorReason: 'BlockedByClient' })
            .catch(error => report.protocolErrors.push(error.message));
        }
        if (event.method === 'Log.entryAdded' && event.params.entry.source === 'security') {
          page.securityLog.push({ probing, ...event.params.entry });
        }
        if (event.method.startsWith('Security.')) page.securityEvents.push(event.method);
        if (event.method === 'Audits.issueAdded' && event.params.issue.code === 'ContentSecurityPolicyIssue') {
          page.cspIssues.push({ probing, ...event.params.issue.details.contentSecurityPolicyIssueDetails });
        }
        if (event.method === 'Runtime.exceptionThrown') page.exceptions.push(event.params.exceptionDetails.text);
      });
      for (const domain of ['Page', 'Runtime', 'Log', 'Security', 'Audits']) await send(`${domain}.enable`);
      await send('Network.enable');
      await send('Network.setCacheDisabled', { cacheDisabled: true });
      await send('Fetch.enable', { patterns: [{ urlPattern: 'http*', requestStage: 'Request' }] });
      await send('Page.addScriptToEvaluateOnNewDocument', { source: `
        window.__cspViolations = [];
        document.addEventListener('securitypolicyviolation', event => {
          window.__cspViolations.push({ directive: event.effectiveDirective,
            blocked: event.blockedURI, disposition: event.disposition, source: event.sourceFile });
        });` });
      const evaluate = async expression => {
        const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true,
          // CDP defaults to bypassing CSP for eval. Never use that default here.
          allowUnsafeEvalBlockedByCSP: false });
        if (result.exceptionDetails) throw new Error(`${label}: ${JSON.stringify(result.exceptionDetails)}`);
        return result.result.value;
      };
      const until = (expression, description) => waitFor(() => evaluate(expression), `${label}: ${description}`);
      await send('Page.navigate', { url });
      await until('document.readyState === "complete"', '페이지 로드');
      return { page, evaluate, until,
        async probe() {
          probing = true;
          await evaluate(`(() => { const script = document.createElement('script');
            script.src = '/__csp-probe.js'; document.head.append(script); })()`);
          await until('window.__cspProbe?.loaded', '동일 출처 탐침 script 로드');
          const probe = await evaluate('window.__cspProbe');
          assert.deepEqual(probe, { loaded: true, inlineRan: false, evalRan: false, evalBlocked: true });
          await until('window.__cspViolations.length >= 2', 'CSP 탐침 위반');
          page.csp = await evaluate('window.__cspViolations');
          assert.equal(page.csp.length, 2, `${label}: 예상 밖 CSP 위반`);
          assert.deepEqual(new Set(page.csp.map(event => event.blocked)), new Set(['inline', 'eval']));
          assert.ok(page.csp.every(event => event.directive.startsWith('script-src') && event.disposition === 'enforce'
            && event.source === new URL('/__csp-probe.js', url).href));
          page.expectedViolations = 2;
          // Log is a second independent observation surface; do not dismiss other
          // security messages merely because they arrived during the probe.
          await until('window.__cspViolations.length === 2', '위반 수');
          const inlineLog = entry => /Executing inline script violates|Refused to execute inline script/i.test(entry.text);
          const evalLog = entry => /Evaluating a string as JavaScript violates|Refused to evaluate a string as JavaScript/i.test(entry.text);
          assert.ok(page.securityLog.some(entry => entry.probing && inlineLog(entry)), `${label}: inline Log 없음`);
          // Edge does not emit a Log entry for a caught EvalError. Audits and
          // securitypolicyviolation still report the enforced eval violation.
          assert.ok(page.cspIssues.some(issue => issue.probing && issue.contentSecurityPolicyViolationType === 'kEvalViolation'), `${label}: eval CDP issue 없음`);
          assert.ok(page.cspIssues.some(issue => issue.probing && issue.contentSecurityPolicyViolationType === 'kInlineViolation'), `${label}: inline CDP issue 없음`);
          assert.ok(page.cspIssues.every(issue => issue.probing && !issue.isReportOnly
            && ['kEvalViolation', 'kInlineViolation'].includes(issue.contentSecurityPolicyViolationType)
            && issue.sourceCodeLocation?.url === new URL('/__csp-probe.js', url).href), `${label}: 예상 밖 CDP CSP issue`);
          const unexpected = page.securityLog.filter(entry => !entry.probing || (!inlineLog(entry) && !evalLog(entry)));
          assert.deepEqual(unexpected, [], `${label}: 예상 밖 Security/Log 메시지`);
          assert.deepEqual(page.exceptions, [], `${label}: 처리되지 않은 페이지 오류`);
        } };
    }

    const desk = await openPage(aOrigin + '/', 'Site A');
    const booted = page => page.until(`window.__nsweb && !document.querySelector('#agent-app').hidden
      && document.querySelector('#ns-send') && document.querySelector('#ns-input').getBoundingClientRect().width > 0`, '부팅·채팅 렌더');
    await booted(desk);
    assert.equal(report.modelRequests, 0, '키 없는 부팅에서 모델 요청이 발생했습니다.');
    await desk.evaluate(`document.querySelector('[data-sample="valid"]').click()`);
    await desk.until(`document.querySelectorAll('#rule-report .desk-check').length > 0
      && document.querySelector('#review-status').textContent.includes('passed')`, '키 없는 정상 샘플 검사');
    async function checkSameDocumentStages(page) {
      await page.evaluate('window.__workflowDocument = document');
      const snapshot = `(() => ({
        inputs: Object.fromEntries(['manifest-json', 'network-json', 'links-json', 'review-base', 'network-name', 'peer-chain', 'test-run-message']
          .map(id => [id, document.getElementById(id).value])),
        downloads: Array.from(document.querySelectorAll('#review-downloads a'), link => [link.download, link.href]),
        report: document.querySelector('#rule-report').textContent,
        reviewStatus: document.querySelector('#review-status').textContent,
        answer: document.querySelector('#test-run-answer').textContent,
        runStatus: document.querySelector('#test-run-status').textContent,
        graph: document.querySelector('#runtime-events').textContent
      }))()`;
      const before = await page.evaluate(snapshot);
      assert.ok(before.inputs['network-json'].length > 0);
      assert.equal(before.downloads.length, 3);
      assert.ok(before.downloads.every(([, href]) => href.startsWith('blob:')));
      for (const [hash, label] of [['#test-run', 'Test run'], ['#download', 'Download']]) {
        await page.evaluate(`Array.from(document.querySelectorAll('nav[aria-label="Team workflow"] a'))
          .find(link => new URL(link.href).hash === ${JSON.stringify(hash)}).click()`);
        await page.until(`location.hash === ${JSON.stringify(hash)}
          && document.querySelector('nav a[aria-current="location"]')?.textContent === ${JSON.stringify(label)}`, `${label} 단계 이동`);
        assert.equal(await page.evaluate('window.__workflowDocument === document'), true, `${label}: 새 document가 로드됐습니다.`);
        assert.equal(await page.evaluate('location.pathname'), '/', `${label}: 디렉터리 URL을 떠났습니다.`);
        assert.deepEqual(await page.evaluate(snapshot), before, `${label}: 현재 입력·다운로드·실행 결과가 바뀌었습니다.`);
      }
    }
    await checkSameDocumentStages(desk);
    await desk.evaluate(`document.querySelector('#audit-this').click(); document.querySelector('#audit-form').requestSubmit()`);
    await desk.until(`document.querySelector('#review-status').textContent.includes('public JSON retrieved and static checks passed')`, '자기 URL 감사');
    assert.equal(report.modelRequests, 0);
    assert.equal(report.peerFetches.length, 0);
    // Use the same settings controls a visitor uses, including Apply + reload.
    await desk.evaluate(`(() => {
      document.querySelector('.ns-settings').open = true;
      document.querySelector('.ns-settings-advanced').open = true;
      for (const [id, value] of ${JSON.stringify([['ns-key', sentinel], ['ns-model', model], ['ns-router', routerUrl]])}) {
        const input = document.getElementById(id); input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
      document.querySelector('#ns-apply').click();
    })()`);
    await desk.until(`window.__nsweb?.engine.byokKey === ${JSON.stringify(sentinel)}`, 'BYOK 설정 적용·재부팅');
    await booted(desk);
    assert.equal(await desk.evaluate('window.__nsweb.engine.top.llm.baseUrl'), routerUrl);
    assert.equal(await desk.evaluate(`window.__nsweb.engine.top.network.getLink('spec_scout')`), peerBase);
    await desk.evaluate(`document.querySelector('#ns-input').value = 'Validate the sample and ask Spec Scout about exact network naming.';
      document.querySelector('#ns-send').click()`);
    await desk.until(`document.querySelector('.ns-consent-actions [data-d="allow"]')`, '피어 동의 카드');
    assert.equal(report.peerFetches.length, 0, '동의 전 피어 fetch');
    consentAllowed = true;
    await desk.evaluate(`document.querySelector('.ns-consent-actions [data-d="allow"]').click()`);
    await desk.until(`document.querySelector('#ns-msgs').textContent.includes(${JSON.stringify(finalText)})
      && document.querySelector('.ns-inputbar').dataset.turnActive === 'false'`, '피어 답·최종 채팅 렌더');
    const events = await desk.evaluate('window.__nsweb.trace.events');
    for (const kind of ['run', 'remote_fetch', 'remote_call']) {
      assert.ok(events.some(event => event.kind === kind && event.phase === 'end' && event.status === 'ok'), `${kind} 성공 없음`);
    }
    assert.ok(events.some(event => event.kind === 'agent_result' && event.text?.includes(peerText)), '실제 피어 세션 답 없음');
    const actionResult = modelCalls.flatMap(call => call.messages).find(message => message.role === 'tool' && message.name === 'website_validate_network');
    assert.ok(actionResult && JSON.parse(actionResult.content).status === 'succeeded', '로컬 action 영수증 실패');
    assert.ok(report.peerFetches.includes('/agent-manifest.json'));
    assert.ok(report.peerFetches.includes('/spec_scout.network.json'));
    desk.page.flows.push('boot/render', 'key-free sample validation', 'self URL audit', 'BYOK apply/reload',
      'local website action receipt', 'Allow before peer manifest/definition fetch', 'peer reply and final chat render');
    await desk.evaluate(`document.querySelector('[data-sample="valid"]').click()`);
    await desk.until(`document.querySelector('#review-status').textContent.startsWith('Sample: Valid sample.')
      && document.querySelector('#review-status').textContent.includes('Static checks passed')`, '디렉터리 URL 샘플 재검사');
    await desk.evaluate(`document.querySelector('#test-run-message').value = 'Inspect this public sample.';
      document.querySelector('#test-run-message').dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelector('#test-run-start').click()`);
    await desk.until(`document.querySelector('#test-run-answer').textContent === ${JSON.stringify(peerText)}
      && document.querySelector('#test-run-status').textContent.startsWith('Test run completed.')
      && !window.__nsweb.engine.running`, '디렉터리 URL 시험 실행 결과');
    await checkSameDocumentStages(desk);
    desk.page.flows.push('directory URL: Test run/Download preserve document, checked bytes, blob links and completed editor answer/graph');
    await desk.probe();

    const converter = await openPage(aOrigin + '/converter.html', 'Site A converter');
    const workflow = ['Import', 'Check', 'Ask the spec', 'Test run', 'Download'];
    for (const page of [desk, converter]) {
      assert.deepEqual(await page.evaluate(`Array.from(document.querySelectorAll('nav[aria-label="Team workflow"] a'), link => link.textContent)`), workflow);
      const destinations = await page.evaluate(`Array.from(document.querySelectorAll('nav[aria-label="Team workflow"] a'), link => {
        const target = new URL(link.href); return { origin: target.origin, path: target.pathname, hash: target.hash };
      })`);
      assert.ok(destinations.every(target => target.origin === aOrigin));
      assert.deepEqual(destinations.map(target => target.hash), ['', '#review-tools', '#chat-heading', '#test-run', '#download']);
      assert.equal(destinations[0].path, '/converter.html');
      assert.ok(destinations.slice(1).every(target => ['/', '/index.html'].includes(target.path)));
      for (const { hash } of destinations.slice(1)) {
        assert.equal(await desk.evaluate(`!!document.getElementById(${JSON.stringify(hash.slice(1))})`), true, `${hash}: 대상 구역 없음`);
      }
    }
    for (const layout of ['claude', 'adk', 'theora']) {
      await converter.evaluate(`document.querySelector('[data-converter-sample="${layout}"]').click()`);
      await converter.until(`!document.querySelector('#converter-output').hidden
        && document.querySelector('#convert-status').textContent.startsWith('Static checks passed')`, `${layout} 변환·검사`);
      const artifacts = await converter.evaluate(`Object.fromEntries(['network', 'manifest', 'links'].map(key =>
        [key, document.querySelector('#converted-' + key).value]))`);
      if (layout === 'adk') {
        assert.deepEqual(JSON.parse(artifacts.network).tools.map(agent => [agent.name, agent.tools]),
          [['coordinator', ['specialist']], ['researcher', []], ['specialist', ['researcher']]]);
        const notices = await converter.evaluate(`document.querySelector('#converter-notices').textContent`);
        assert.match(notices, /model/);
        assert.match(notices, /tools/);
      }
      for (const [key, filename] of [['network', 'converted_team.network.json'], ['manifest', 'agent-manifest.json'], ['links', 'links.json']]) {
        const before = downloads.size;
        await converter.evaluate(`document.querySelector('a[download="${filename}"]').click()`);
        const completed = await waitFor(() => [...downloads.values()].slice(before).find(item => item.state === 'completed'), `${layout}: ${filename} 다운로드`);
        assert.equal(completed.suggestedFilename, filename);
        assert.equal(await readFile(path.join(downloadPath, filename), 'utf8'), artifacts[key]);
        await rm(path.join(downloadPath, filename));
      }
      converter.page.flows.push(`${layout}: conversion/static validation, 3 completed byte-identical downloads`);
    }
    await converter.probe();

    const editor = await openPage(aOrigin + '/converter.html', 'ADK same-tab test run');
    await editor.evaluate(`document.querySelector('[data-converter-sample="adk"]').click()`);
    await editor.until(`!document.querySelector('#converter-output').hidden
      && !document.querySelector('#open-review').disabled`, 'ADK 변환');
    const transferred = await editor.evaluate(`Object.fromEntries(['network', 'manifest', 'links'].map(key =>
      [key, document.querySelector('#converted-' + key).value]))`);
    const beforeImport = report.modelRequests;
    await editor.evaluate(`document.querySelector('#open-review').click()`);
    await booted(editor);
    await editor.until(`document.querySelector('#review-status').textContent.includes('Converted artifacts received')`, '같은 탭 정적 검사');
    assert.equal(report.modelRequests, beforeImport, '넘겨받기만으로 모델이 실행됐습니다.');
    const checked = await editor.evaluate(`Object.fromEntries(['network', 'manifest', 'links'].map(key =>
      [key, document.querySelector('#' + key + '-json').value]))`);
    for (const key of ['network', 'manifest', 'links']) assert.deepEqual(JSON.parse(checked[key]), JSON.parse(transferred[key]));
    for (const [key, filename] of [['network', 'converted_team.network.json'], ['manifest', 'agent-manifest.json'], ['links', 'links.json']]) {
      const before = downloads.size;
      await editor.evaluate(`document.querySelector('#review-downloads a[download="${filename}"]').click()`);
      const completed = await waitFor(() => [...downloads.values()].slice(before).find(item => item.state === 'completed'), `Review Desk: ${filename} 다운로드`);
      assert.equal(completed.suggestedFilename, filename);
      assert.equal(await readFile(path.join(downloadPath, filename), 'utf8'), checked[key]);
      await rm(path.join(downloadPath, filename));
    }
    await editor.evaluate(`Array.from(document.querySelectorAll('nav[aria-label="Team workflow"] a'))
      .find(link => new URL(link.href).hash === '#test-run').click()`);
    await editor.until(`document.querySelector('nav a[aria-current="location"]')?.textContent === 'Test run'`, '현재 단계 표시');
    // The rest of this flow uses the same controls and imported artifacts as a visitor.
    await editor.evaluate(`document.querySelector('#test-run-message').value = 'What is the fictional Cedar Museum route and exact route code?';
      document.querySelector('#test-run-message').dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelector('#test-run-start').click()`);
    await editor.until(`document.querySelector('#test-run-answer').textContent.includes(${JSON.stringify(editorText)})
      && !window.__nsweb.engine.running`, '시험 답 렌더');
    const editorEvents = await editor.evaluate('window.__nsweb.trace.events');
    assert.ok(editorEvents.some(event => event.kind === 'run' && event.phase === 'end' && event.status === 'ok'));
    for (const agent of ['coordinator', 'specialist', 'researcher']) {
      assert.ok(editorEvents.some(event => event.kind === 'agent' && event.agent === agent
        && event.origin === 'editor' && event.phase === 'end' && event.status === 'ok'), `${agent}: editor 성공 span 없음`);
      assert.ok(editorEvents.some(event => event.kind === 'agent_result' && event.agent === agent
        && event.text === editorText), `${agent}: 답 없음`);
    }
    for (const tool of ['specialist', 'researcher']) {
      assert.ok(editorEvents.some(event => event.kind === 'tool' && event.tool === tool
        && event.phase === 'end' && event.status === 'ok'), `${tool}: 위임 성공 없음`);
      assert.ok(modelCalls.flatMap(call => call.messages).some(message => message.role === 'tool'
        && message.name === tool && JSON.parse(message.content).text === editorText), `${tool}: 답의 tool 결과 반환 없음`);
    }
    const editorGraph = await editor.evaluate(`document.querySelector('#runtime-events').textContent`);
    assert.match(editorGraph, /run \[editor\]/, '화면 run 행에 editor 출처 표지가 없습니다.');
    assert.match(editorGraph, /remote_call \[[^\]]+ → editor\]/, '화면 피어 행에 editor 목적지 표지가 없습니다.');
    assert.match(editorGraph, /agent \[editor\] researcher/, '화면 에이전트 행에 editor 출처 표지가 없습니다.');
    editor.page.flows.push('ADK conversion → same-tab Review Desk handoff without execution',
      'explicit test run, coordinator → specialist → researcher success, full answer and graph render');
    await editor.probe();
    const scout = await openPage(peerOrigin + '/', 'Site B');
    await booted(scout);
    scout.page.flows.push('boot/render');
    await scout.probe();
    assert.deepEqual(report.blockedExternal, [], '외부 요청이 시도되었습니다.');
    assert.deepEqual(report.protocolErrors, []);
    report.unexpectedViolations = report.pages.reduce((sum, page) => sum + page.csp.length - page.expectedViolations, 0);
    assert.equal(report.unexpectedViolations, 0);
    console.log(JSON.stringify({ status: 'PASS', ...report }, null, 2));
  } catch (error) {
    console.error(JSON.stringify({ status: 'FAIL', error: error.stack, ...report }, null, 2));
    throw error;
  } finally {
    if (cdp) {
      try { await cdp.send('Browser.close'); } catch { /* child shutdown below */ }
      cdp.socket.close();
    }
    if (child && child.exitCode === null) {
      const exited = once(child, 'exit');
      child.kill();
      await Promise.race([exited, delay(5000)]);
    }
    await Promise.all(servers.map(server => new Promise(resolve => {
      server.closeAllConnections(); server.close(resolve);
    })));
    await rm(workspace, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
  }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
