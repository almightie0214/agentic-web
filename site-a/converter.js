import { parseRoles } from './converter/parse-roles.mjs';
import { emitNetwork } from './converter/emit-network.mjs';
import { emitManifest } from './converter/emit-manifest.mjs';
import { validateNetwork } from './validator-rules.mjs';

const $ = selector => document.querySelector(selector);
let files;
let localFiles;
let acquisition = 0;
let result;
const downloads = [];

function status(message, error = false) {
  $('#convert-status').textContent = message;
  $('#convert-status').dataset.state = error ? 'error' : '';
}

function invalidate() {
  result = undefined;
  for (const url of downloads.splice(0)) URL.revokeObjectURL(url);
  $('#converter-downloads').replaceChildren();
  $('#converter-report').replaceChildren();
  $('#converter-output').hidden = true;
  $('#open-review').disabled = true;
  for (const key of ['network', 'manifest', 'links']) $(`#converted-${key}`).value = '';
}

function element(tag, text) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  return node;
}

function convert() {
  invalidate();
  if (!files) return;
  try {
    const layout = $('#convert-layout').value;
    const front = $('#convert-front').value;
    const parsed = parseRoles(files, layout ? { layout } : {});
    const { network, frontMan } = emitNetwork(parsed, front === '' ? {} : { front });
    const { manifest, links } = emitManifest(frontMan);
    const input = { manifest, network, links };
    const report = validateNetwork(input);
    for (const check of report.checks) {
      const row = element('article');
      row.className = 'desk-check';
      row.dataset.state = check.status;
      row.append(element('h3', `${check.status.toUpperCase()} · ${check.ruleId}`),
        element('code', check.path), element('p', check.message));
      if (check.hint) row.append(element('p', `Next step: ${check.hint}`));
      $('#converter-report').append(row);
    }
    for (const [key, filename] of [['network', 'converted_team.network.json'], ['manifest', 'agent-manifest.json'], ['links', 'links.json']]) {
      const text = JSON.stringify(input[key], null, 2) + '\n';
      $(`#converted-${key}`).value = text;
      const url = URL.createObjectURL(new Blob([text], { type: 'application/json;charset=utf-8' }));
      downloads.push(url);
      const link = element('a', `Download ${filename}`);
      link.href = url;
      link.download = filename;
      $('#converter-downloads').append(link);
    }
    result = input;
    $('#converter-output').hidden = false;
    $('#open-review').disabled = false;
    status(report.valid ? 'Static checks passed; warnings may remain. Inspect all artifacts. Runtime behavior is unverified.'
      : 'Static checks failed. Inspect the findings; these artifacts are not conformant.', !report.valid);
  } catch (error) {
    invalidate();
    const rule = typeof error?.message === 'string' ? error.message.match(/^CVT-[A-Z]+-\d{3}:/)?.[0] : undefined;
    status(`${rule ?? 'Conversion error:'} No artifacts produced. Check layout, role names, front selection, and supported input structure. Source text is not shown in diagnostics.`, true);
  }
}

async function acquire(load, sample = false) {
  const token = ++acquisition;
  invalidate();
  files = undefined;
  $('#convert-submit').disabled = true;
  $('#source-status').textContent = 'Reading input…';
  status('Reading local input or the selected public sample…');
  try {
    const loaded = await load();
    if (token !== acquisition) return;
    files = loaded;
    $('#source-status').textContent = `${files.length} input files loaded. Paths are relative to the selected root.`;
    $('#convert-submit').disabled = false;
    status('Input ready. Select Convert and check.');
    if (sample) convert();
  } catch {
    if (token !== acquisition) return;
    $('#source-status').textContent = 'Input unavailable.';
    status('Could not read UTF-8 input. Reselect files or retry the sample. No artifacts produced.', true);
  }
}

async function readLocalFiles() {
  const entries = localFiles.map(file => ({ file,
    path: file.webkitRelativePath ? file.webkitRelativePath.split('/').slice(1).join('/') : file.name,
  }));
  const theoraRole = /^\.theora\/roles\/[^/]+\/agent\.md(?![\s\S])/;
  const claudeRole = /^\.claude\/agents\/[^/]+\.md(?![\s\S])/;
  const layout = $('#convert-layout').value || (entries.some(({ path }) => theoraRole.test(path)) ? 'theora' : 'markdown');
  const markdownRole = entries.some(({ path }) => claudeRole.test(path)) ? claudeRole : /^[^/]+\.md(?![\s\S])/;
  return Promise.all(entries.map(async ({ file, path }) => {
    const selected = layout === 'theora'
      ? theoraRole.test(path) || path === '.theora/config/theora.json' : markdownRole.test(path);
    // Preserve every path for the shared parser's path/duplicate validation, without reading unrelated bytes.
    return { path, content: selected ? new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer()) : '' };
  }));
}

for (const id of ['project-files', 'markdown-files']) {
  $(`#${id}`).addEventListener('change', () => {
    localFiles = Array.from($(`#${id}`).files);
    $(id === 'project-files' ? '#markdown-files' : '#project-files').value = '';
    return acquire(readLocalFiles);
  });
}

for (const button of document.querySelectorAll('[data-converter-sample]')) {
  button.addEventListener('click', () => {
    $('#project-files').value = '';
    $('#markdown-files').value = '';
    localFiles = undefined;
    return acquire(async () => {
      const get = async path => {
        const response = await fetch(new URL(`./converter/samples/${path}`, import.meta.url), { credentials: 'omit' });
        if (!response.ok) throw new Error('Sample unavailable');
        return response;
      };
      if (button.dataset.converterSample === 'theora') return (await get('theora/layout.json')).json();
      return Promise.all(['coordinator', 'specialist'].map(async name => ({
        path: `.claude/agents/${name}.md`, content: await (await get(`claude-agents/${name}.md`)).text(),
      })));
    }, true);
  });
}

for (const [id, event] of [['convert-layout', 'change'], ['convert-front', 'input']]) {
  $(`#${id}`).addEventListener(event, () => {
    if (id === 'convert-layout' && localFiles) return acquire(readLocalFiles);
    invalidate();
    status('Options changed. Convert again for current artifacts.');
  });
}
$('#convert-form').addEventListener('submit', event => {
  event.preventDefault();
  convert();
});
$('#open-review').addEventListener('click', () => {
  if (!result) return;
  try {
    window.sessionStorage.setItem('agent-review-desk:converter', JSON.stringify(result));
    window.location.assign(new URL('./index.html', import.meta.url).href);
  } catch {
    status('Review Desk transfer unavailable. Storage may be blocked or full. Download the artifacts and paste them into Review Desk instead.', true);
  }
});
