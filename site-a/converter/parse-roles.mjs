// Pure, shared CVT parser. Acquisition and final front selection belong to adapters/emitters.
// Strict end assertions avoid JavaScript's $ accepting a final newline in paths/names.
const rolePath = /^\.theora\/roles\/([^/]+)\/agent\.md(?![\s\S])/;
const configPath = '.theora/config/theora.json';
const namePattern = /^[A-Za-z][A-Za-z0-9_]{0,59}(?![\s\S])/;
const secretPatterns = [
  /\b(?:api[_-]?key|access[_-]?token|auth[_-]?token|secret|password|passwd)\b\s*["']?\s*[:=]/i,
  /\bauthorization\s*[:=]|\bbearer\s+\S+/i,
  /\b(?:sk-[A-Za-z0-9_-]{8,}|gh[pousr]_[A-Za-z0-9_]{8,}|github_pat_[A-Za-z0-9_]{8,}|AKIA[A-Z0-9]{16})\b/,
];
const tokenBoundary = /[\s`'"()\[\]<>]+/;

// Never attach source values or a native JSON error (which can contain excerpts).
function fail(rule, index) {
  throw new Error(`${rule}: invalid converter input${index === undefined ? '' : ` (record ${index})`}.`);
}

function normalize(content) {
  return content.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
}

function isLocalToken(token) {
  return /^(?:\/|~\/|\.\.?\/|[A-Za-z]:[\\/]|\\\\|\.(?:theora|claude|ssh|codex)\/)/.test(token)
    || /^\.env(?:\.|$)/.test(token);
}

function sanitize(text) {
  const result = [];
  let pemLabel;
  for (const line of text.split('\n')) {
    if (pemLabel !== undefined) {
      if (line.includes(`-----END ${pemLabel}PRIVATE KEY-----`)) pemLabel = undefined;
      continue;
    }
    const begin = line.match(/-----BEGIN (.*?)PRIVATE KEY-----/);
    if (begin) {
      result.push('[REDACTED_SECRET]');
      if (!line.slice(begin.index + begin[0].length).includes(`-----END ${begin[1]}PRIVATE KEY-----`)) {
        pemLabel = begin[1];
      }
    } else if (secretPatterns.some((pattern) => pattern.test(line))) {
      result.push('[REDACTED_SECRET]');
    } else if (line.split(tokenBoundary).some(isLocalToken)) {
      result.push('[REDACTED_LOCAL_PATH]');
    } else {
      result.push(line);
    }
  }
  return result.join('\n');
}

function hasText(text) {
  return text.replace(/\[REDACTED_(?:SECRET|LOCAL_PATH)\]/g, '').trim().length > 0;
}

function validateName(name, index) {
  if (typeof name !== 'string' || !namePattern.test(name) || sanitize(name) !== name) {
    fail('CVT-ROLE-001', index);
  }
}

// Titles in fenced code are not role titles (CVT-ROLE-002).
function firstHeading(body) {
  let fence;
  for (const line of body.split('\n')) {
    if (fence) {
      const closing = line.match(/^(`+|~+)\s*$/);
      if (closing && closing[1][0] === fence[0] && closing[1].length >= fence.length) fence = undefined;
      continue;
    }
    const opening = line.match(/^(`{3,}|~{3,})/);
    if (opening) {
      fence = opening[1];
      continue;
    }
    const heading = line.match(/^#{1,6} (.*)$/);
    if (heading) {
      return heading[1].replace(/(?:^|\s+)#+\s*$/, '').trim();
    }
  }
}

function bodyDescription(body) {
  return firstHeading(body) ?? body.split('\n').find((line) => hasText(line) && !/^(`{3,}|~{3,})/.test(line));
}

function slug(value) {
  return value.replace(/[A-Z]/g, (letter) => letter.toLowerCase()).replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '');
}

function scalar(raw, index, rule, allowEmpty = false) {
  const value = raw.trim();
  let parsed;
  if (value.startsWith('"')) {
    const quoted = value.match(/^"((?:[^"\\]|\\.)*)"(?:\s+#.*)?$/);
    if (!quoted) fail(rule, index);
    // YAML double-quoted escapes, with no multiline scalar continuation.
    const escapes = { '0': '\0', a: '\x07', b: '\b', t: '\t', n: '\n', v: '\v', f: '\f', r: '\r', e: '\x1b', ' ': ' ', '"': '"', '/': '/', '\\': '\\', N: '\u0085', _: '\u00a0', L: '\u2028', P: '\u2029' };
    parsed = quoted[1].replace(/\\(x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|U[0-9a-fA-F]{8}|.)/g, (_, escape) => {
      if (Object.hasOwn(escapes, escape)) return escapes[escape];
      if (/^[xuU]/.test(escape) && escape.length > 1) {
        const code = Number.parseInt(escape.slice(1), 16);
        if (code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff)) return String.fromCodePoint(code);
      }
      fail(rule, index);
    });
  } else if (value.startsWith("'")) {
    const quoted = value.match(/^'((?:[^']|'')*)'(?:\s+#.*)?$/);
    if (!quoted) fail(rule, index);
    parsed = quoted[1].replace(/''/g, "'");
  } else {
    parsed = value.replace(/(?:^|\s+)#.*$/, '').trim();
    // This is a string-only YAML subset, not an implicit-type YAML reader.
    if (/^(?:null|~|true|false)$/i.test(parsed)
      || /^[+-]?(?:\.(?:inf|nan)|0[xob][0-9a-f_]+|(?:[0-9][0-9_]*(?:\.[0-9_]*)?|\.[0-9_]+)(?:e[+-]?[0-9]+)?|[0-9]+(?::[0-9]+)+)$/i.test(parsed)
      || /^[\[\]{},!&*|>@`%#]/.test(parsed) || /:\s/.test(parsed)
      || /^[-?:](?:\s|$)/.test(parsed)) fail(rule, index);
  }
  if (typeof parsed !== 'string' || (!parsed.trim() && (!allowEmpty || !/^["']/.test(value))) || parsed.includes('\0')) fail(rule, index);
  return parsed;
}

function ignorable(line) {
  return !line.trim() || /^ *#/.test(line);
}

function indentation(line, rule, index) {
  if (/^ *\t/.test(line)) fail(rule, index);
  return line.length - line.trimStart().length;
}

// Both formats use this selected-key YAML reader. Unknown fields are recorded by
// name, but their values (including nested unsupported YAML) are never evaluated.
function yamlMapping(lines, fields, rule, index, baseIndent = 0) {
  const values = Object.create(null);
  const keys = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (ignorable(line)) continue;
    if (indentation(line, rule, index) !== baseIndent) fail(rule, index);
    const entry = line.slice(baseIndent).match(/^("(?:[^"\\]|\\.)*"|'(?:[^']|'')*'|[^\s"'][^:]*?)\s*:(?:\s(.*)|$)/);
    if (!entry || /^(?:---|\.\.\.)(?:\s|$)/.test(line.trim())) fail(rule, index);
    const quotedKey = /^["']/.test(entry[1]);
    const key = quotedKey ? scalar(entry[1], index, rule, true) : entry[1].trim();
    if (quotedKey && Object.hasOwn(fields, key)) fail(rule, index);
    if (keys.includes(key)) fail(rule, index);
    keys.push(key);
    const continuation = [];
    while (i + 1 < lines.length && (ignorable(lines[i + 1]) || indentation(lines[i + 1], rule, index) > baseIndent
      || ((fields[key] === 'references' || !Object.hasOwn(fields, key))
        && indentation(lines[i + 1], rule, index) === baseIndent && /^-(?: |$)/.test(lines[i + 1].slice(baseIndent))))) {
      continuation.push(lines[++i]);
    }
    if (!Object.hasOwn(fields, key)) continue;
    const raw = entry[2] ?? '';
    const style = raw.replace(/(?:^|\s+)#.*$/, '').trim();
    if (fields[key] === 'references') {
      if (style) fail(rule, index);
      const entries = continuation.filter((part) => !ignorable(part));
      if (!entries.length) fail(rule, index);
      const indent = indentation(entries[0], rule, index);
      const references = [];
      for (let j = 0; j < entries.length; j++) {
        const item = entries[j];
        if (indentation(item, rule, index) !== indent || !/^-(?: |$)/.test(item.slice(indent))) fail(rule, index);
        const mappingLines = item.slice(indent + 1).trim() ? [' '.repeat(indent + 2) + item.slice(indent + 2)] : [];
        while (j + 1 < entries.length && indentation(entries[j + 1], rule, index) > indent) mappingLines.push(entries[++j]);
        if (!mappingLines.length) fail(rule, index);
        const mapping = yamlMapping(mappingLines, { config_path: 'string' }, rule, index, indentation(mappingLines[0], rule, index));
        if (mapping.keys.length !== 1 || mapping.keys[0] !== 'config_path') fail(rule, index);
        references.push(mapping.values.config_path);
      }
      values[key] = references;
    } else if (/^[|>]-?$/.test(style)) {
      // The first content line owns indentation; extra indentation is content.
      const contentLines = continuation.filter((part) => !new RegExp(`^ {0,${baseIndent}}#`).test(part));
      const first = contentLines.find((part) => part.trim());
      if (!first) fail(rule, index);
      const indent = indentation(first, rule, index);
      if (indent <= baseIndent) fail(rule, index);
      const parts = contentLines.map((part) => {
        if (!part.trim()) return '';
        if (indentation(part, rule, index) < indent) fail(rule, index);
        return part.slice(indent);
      });
      let block = '';
      let previousContent;
      for (let j = 0; j < parts.length; j++) {
        const current = parts[j];
        const next = parts[j + 1];
        block += current;
        if (j + 1 < parts.length) {
          let separator = '\n';
          if (style[0] === '>' && next && !/^\s/.test(next)) {
            if (current && !/^\s/.test(current)) separator = ' ';
            else if (!current && previousContent && !/^\s/.test(previousContent)) separator = '';
          }
          block += separator;
        }
        if (current) previousContent = current;
      }
      block = block.replace(/\n+$/, '') + (style.endsWith('-') ? '' : '\n');
      if (!block.trim()) fail(rule, index);
      values[key] = block;
    } else {
      if (continuation.some((part) => !ignorable(part))) fail(rule, index);
      values[key] = scalar(raw, index, rule, fields[key] === 'emptyString');
    }
  }
  return { values, keys };
}

function markdown(content, index) {
  const lines = content.split('\n');
  if (lines[0] !== '---') return { body: content, metadata: {}, ignoredKeys: [] };
  const end = lines.indexOf('---', 1);
  if (end < 0) fail('CVT-MD-001', index);
  const parsed = yamlMapping(lines.slice(1, end), { name: 'string', description: 'string' }, 'CVT-MD-001', index);
  // Metadata is display text: preserve the existing outer-trim behavior.
  const metadata = Object.fromEntries(Object.entries(parsed.values).map(([key, value]) => [key, value.trim()]));
  return { body: lines.slice(end + 1).join('\n'), metadata, ignoredKeys: parsed.keys.filter((key) => !['name', 'description'].includes(key)) };
}

function notice(role, keys) {
  const safe = keys.filter((key) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(key) && sanitize(key) === key && sanitize(`${key}:`) === `${key}:`);
  return { role, keys: safe, hiddenKeyCount: keys.length - safe.length };
}

function validPath(path) {
  return typeof path === 'string' && !/^[A-Za-z]:|[\\\0]/.test(path)
    && !path.split('/').some((part) => ['', '.', '..'].includes(part));
}

const llmClasses = new Set(['', 'LlmAgent', 'Agent', 'google.adk.agents.LlmAgent', 'google.adk.agents.llm_agent.LlmAgent', 'google.adk.agents.Agent', 'google.adk.agents.llm_agent.Agent']);
const adkFields = { name: 'string', description: 'emptyString', instruction: 'string', sub_agents: 'references', agent_class: 'emptyString' };
function readAdk(path, content, index) {
  if (!validPath(path) || typeof content !== 'string' || content.includes('\0')) fail('CVT-ADK-001', index);
  const parsed = yamlMapping(content.split('\n'), adkFields, 'CVT-ADK-001', index);
  const value = parsed.values;
  if (!Object.hasOwn(value, 'name') || !Object.hasOwn(value, 'instruction')
    || (Object.hasOwn(value, 'agent_class') && !llmClasses.has(value.agent_class))) fail('CVT-ADK-001', index);
  const folder = path.includes('/') ? path.slice(0, path.lastIndexOf('/') + 1) : '';
  const references = (value.sub_agents ?? []).map((reference) => {
    if (/^(?:\/|[A-Za-z]:)|[\\\0]/.test(reference) || reference.split('/').includes('..')) fail('CVT-ADK-001', index);
    const canonical = reference.split('/').filter((part) => part !== '' && part !== '.').join('/');
    if (!canonical) fail('CVT-ADK-001', index);
    return folder + canonical;
  });
  return { value, references, ignoredKeys: parsed.keys.filter((key) => !['name', 'description', 'instruction', 'sub_agents'].includes(key)) };
}

// Adapters discover reachable files through exactly the same reader as parseRoles.
export function adkReferences(path, content) {
  if (typeof content !== 'string') fail('CVT-ADK-001');
  return readAdk(path, normalize(content)).references;
}

/**
 * CVT-IR-001: parse virtual UTF-8 files without mutating files or options.
 * @param {{path: string, content: string}[]} files POSIX root-relative virtual files.
 * @param {{layout?: 'theora'|'markdown'|'adk'}} options Omit layout for structural detection.
 * @returns {{roles: {name: string, description: string, instructions: string, tools?: string[]}[], configFront: string|undefined, layout: 'theora'|'markdown'|'adk', notices: {role: string, keys: string[], hiddenKeyCount: number}[]}}
 * Final front selection is the emitter's responsibility, including any explicit override.
 */
export function parseRoles(files, options = {}) {
  if (!Array.isArray(files)) fail('CVT-IN-001');
  if (!options || typeof options !== 'object' || Array.isArray(options)
    || (options.layout !== undefined && !['theora', 'markdown', 'adk'].includes(options.layout))) fail('CVT-IN-002');
  const seenPaths = new Set();
  const validated = Array.from(files, (file, index) => {
    if (!file || typeof file !== 'object' || Array.isArray(file)
      || typeof file.path !== 'string' || typeof file.content !== 'string') fail('CVT-IN-001', index);
    const { path, content } = file;
    if (!validPath(path) || seenPaths.has(path)) fail('CVT-IN-001', index);
    seenPaths.add(path);
    return { path, content: normalize(content), index };
  });
  const layout = options.layout ?? (validated.some(({ path }) => rolePath.test(path)) ? 'theora'
    : validated.some(({ path }) => path === 'root_agent.yaml') ? 'adk' : 'markdown');
  const claudePath = /^\.claude\/agents\/[^/]+\.md(?![\s\S])/;
  const claude = layout === 'markdown' && validated.some(({ path }) => claudePath.test(path));
  let selected;
  const adkData = new Map();
  if (layout === 'adk') {
    selected = [];
    const byPath = new Map(validated.map((entry) => [entry.path, entry]));
    const visit = (path) => {
      const entry = byPath.get(path);
      if (!entry || adkData.has(path)) fail('CVT-ADK-001');
      const parsed = readAdk(path, entry.content, entry.index);
      adkData.set(path, parsed);
      selected.push(entry);
      for (const reference of parsed.references) visit(reference);
    };
    visit('root_agent.yaml');
  } else {
    selected = validated.filter(({ path }) => layout === 'theora'
      ? rolePath.test(path) : (claude ? claudePath : /^[^/]+\.md(?![\s\S])/).test(path));
  }
  if (!selected.length) fail('CVT-IN-002');
  const names = new Set();
  const notices = [];
  const roles = selected.map(({ path, content, index }) => {
    if (content.includes('\0')) fail('CVT-IN-001', index);
    const adk = adkData.get(path);
    const { body, metadata, ignoredKeys } = adk
      ? { body: adk.value.instruction, metadata: adk.value, ignoredKeys: adk.ignoredKeys }
      : layout === 'markdown' ? markdown(content, index) : { body: content, metadata: {}, ignoredKeys: [] };
    const instructions = sanitize(body).trim();
    if (!hasText(instructions)) fail('CVT-ROLE-002', index);
    const name = layout === 'theora' ? path.match(rolePath)[1]
      : metadata.name ?? (slug(path.split('/').at(-1).slice(0, -3)) || slug(firstHeading(instructions) ?? ''));
    validateName(name, index);
    if (names.has(name.toLowerCase())) fail('CVT-ROLE-001', index);
    names.add(name.toLowerCase());
    const publicDescription = metadata.description === undefined ? '' : sanitize(metadata.description);
    const summary = hasText(publicDescription) ? publicDescription : bodyDescription(instructions) ?? '';
    const description = hasText(summary) ? summary.replace(/\s+/g, ' ').trim() : `Role ${name}.`;
    if (ignoredKeys.length) notices.push(notice(name, ignoredKeys));
    return { name, description, instructions, ...(adk ? { tools: adk.references.map((reference) => adkData.get(reference).value.name) } : {}) };
  }).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);

  let configFront = adkData.get('root_agent.yaml')?.value.name;
  const config = layout === 'theora' ? validated.find(({ path }) => path === configPath) : undefined;
  if (config) {
    if (config.content.includes('\0')) fail('CVT-IN-003', config.index);
    let value;
    try { value = JSON.parse(config.content); } catch { fail('CVT-IN-003', config.index); }
    if (!value || typeof value !== 'object' || Array.isArray(value)) fail('CVT-IN-003', config.index);
    if (Object.hasOwn(value, 'front_man')) {
      validateName(value.front_man, config.index);
      if (!roles.some(({ name }) => name === value.front_man)) fail('CVT-IN-003', config.index);
      configFront = value.front_man;
    }
  }
  notices.sort((a, b) => a.role < b.role ? -1 : a.role > b.role ? 1 : 0);
  return { roles, configFront, layout, notices };
}
