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

function scalar(raw, index) {
  const value = raw.trim();
  let parsed;
  if (value.startsWith('"')) {
    try { parsed = JSON.parse(value); } catch { fail('CVT-MD-001', index); }
  } else if (value.startsWith("'")) {
    if (!/^'(?:[^']|'')*'$/.test(value)) fail('CVT-MD-001', index);
    parsed = value.slice(1, -1).replace(/''/g, "'");
  } else {
    parsed = value.replace(/ +#.*$/, '').trim();
    // This is a string-only YAML subset, not an implicit-type YAML reader.
    if (/^(?:null|~|true|false)$/i.test(parsed)
      || /^[+-]?(?:\.(?:inf|nan)|0[xob][0-9a-f_]+|(?:[0-9][0-9_]*(?:\.[0-9_]*)?|\.[0-9_]+)(?:e[+-]?[0-9]+)?|[0-9]+(?::[0-9]+)+)$/i.test(parsed)
      || /^[\[\]{},!&*|>@`%#]/.test(parsed) || /:\s/.test(parsed)
      || /^[-?:](?:\s|$)/.test(parsed)) fail('CVT-MD-001', index);
  }
  if (typeof parsed !== 'string' || !parsed.trim()) fail('CVT-MD-001', index);
  return parsed.trim();
}

function markdown(content, index) {
  const lines = content.split('\n');
  if (lines[0] !== '---') return { body: content, metadata: {} };
  const end = lines.indexOf('---', 1);
  if (end < 0) fail('CVT-MD-001', index);
  const metadata = {};
  for (let i = 1; i < end; i++) {
    const line = lines[i];
    const key = line.match(/^(name|description)\s*:(.*)$/);
    if (!key) {
      if (/^(?:name|description)(?:\s|$)|^["'](?:name|description)["']\s*:/.test(line)) fail('CVT-MD-001', index);
      continue; // Unknown fields and their indented continuations are not evaluated.
    }
    if (Object.hasOwn(metadata, key[1])) fail('CVT-MD-001', index);
    const continuation = [];
    while (i + 1 < end && (/^\s/.test(lines[i + 1]) || lines[i + 1] === '' || /^#/.test(lines[i + 1]))) {
      continuation.push(lines[++i]);
    }
    const style = key[2].trim();
    if (/^[|>]-?$/.test(style)) {
      const block = continuation.filter((part) => !/^#/.test(part)).map((part) => {
        if (!part.trim()) return '';
        if (!part.startsWith('  ')) fail('CVT-MD-001', index);
        return part.slice(2);
      }).join('\n');
      metadata[key[1]] = (style[0] === '>' ? block.replace(/([^\n])\n(?=[^\n])/g, '$1 ') : block).trim();
      if (!metadata[key[1]]) fail('CVT-MD-001', index);
    } else {
      if (continuation.some((part) => part.trim() && !/^\s*#/.test(part))) fail('CVT-MD-001', index);
      metadata[key[1]] = scalar(key[2], index);
    }
  }
  return { body: lines.slice(end + 1).join('\n'), metadata };
}

/**
 * CVT-IR-001: parse virtual UTF-8 files without mutating files or options.
 * @param {{path: string, content: string}[]} files POSIX root-relative virtual files.
 * @param {{layout?: 'theora'|'markdown'}} options Omit layout for structural detection.
 * @returns {{roles: {name: string, description: string, instructions: string}[], configFront: string|undefined}}
 * Final front selection is the emitter's responsibility, including any explicit override.
 */
export function parseRoles(files, options = {}) {
  if (!Array.isArray(files)) fail('CVT-IN-001');
  if (!options || typeof options !== 'object' || Array.isArray(options)
    || (options.layout !== undefined && !['theora', 'markdown'].includes(options.layout))) fail('CVT-IN-002');
  const seenPaths = new Set();
  const validated = Array.from(files, (file, index) => {
    if (!file || typeof file !== 'object' || Array.isArray(file)
      || typeof file.path !== 'string' || typeof file.content !== 'string') fail('CVT-IN-001', index);
    const { path, content } = file;
    if (/^[A-Za-z]:|[\\\0]/.test(path) || path.split('/').some((part) => ['', '.', '..'].includes(part))
      || seenPaths.has(path)) fail('CVT-IN-001', index);
    seenPaths.add(path);
    return { path, content: normalize(content), index };
  });
  const layout = options.layout ?? (validated.some(({ path }) => rolePath.test(path)) ? 'theora' : 'markdown');
  const claudePath = /^\.claude\/agents\/[^/]+\.md(?![\s\S])/;
  const claude = layout === 'markdown' && validated.some(({ path }) => claudePath.test(path));
  const selected = validated.filter(({ path }) => layout === 'theora'
    ? rolePath.test(path) : (claude ? claudePath : /^[^/]+\.md(?![\s\S])/).test(path));
  if (!selected.length) fail('CVT-IN-002');
  const names = new Set();
  const roles = selected.map(({ path, content, index }) => {
    if (content.includes('\0')) fail('CVT-IN-001', index);
    const { body, metadata } = layout === 'markdown' ? markdown(content, index) : { body: content, metadata: {} };
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
    return { name, description, instructions };
  }).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);

  let configFront;
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
  return { roles, configFront };
}
