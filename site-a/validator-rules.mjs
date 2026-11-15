import { filterConfig } from './runtime/kernel.js';
import { find_front_man, is_mcp_ref } from './runtime/generated/graph.gen.mjs';
import { RemoteRegistry } from './runtime/remote.js';

const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = value => typeof value === 'string' && value.trim().length > 0;
const own = (value, key) => object(value) && Object.hasOwn(value, key);
const pointer = key => String(key).replaceAll('~', '~0').replaceAll('/', '~1');
const types = new Set(['null', 'boolean', 'object', 'array', 'number', 'integer', 'string']);
const strings = value => Array.isArray(value) && value.every(item => typeof item === 'string')
  && new Set(value).size === value.length;

// Object member order does not distinguish JSON enum values.
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (object(value)) return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

const dialects = new Map();
const labels = { 4: 'Draft 4', 6: 'Draft 6', 7: 'Draft 7', 2019: 'Draft 2019-09', 2020: 'Draft 2020-12' };
// Accept only these official identifiers, with http/https and an optional empty fragment.
for (const [draft, path] of [[4, 'draft-04'], [6, 'draft-06'], [7, 'draft-07'], [2019, 'draft/2019-09'], [2020, 'draft/2020-12']]) {
  for (const scheme of ['http', 'https']) {
    for (const suffix of ['', '#']) dialects.set(`${scheme}://json-schema.org/${path}/schema${suffix}`, draft);
  }
}

function uri(value, absolute = false) {
  if (typeof value !== 'string' || /[^\x21-\x7e]|[<>"{}|\\^`]/.test(value)
    || /%(?![a-f\d]{2})/i.test(value) || value.split('#').length > 2) return false;
  const path = value.replace(/^(?:[a-z][a-z\d+.-]*:)?\/\/[^/?#]*/i, '');
  if (/[\[\]]/.test(path)) return false;
  if (!absolute && !/^[a-z][a-z\d+.-]*:/i.test(value) && /^[^/?#]*:/.test(value)) return false;
  try {
    if (absolute) new URL(value);
    else new URL(value, 'https://schema.example/');
    return true;
  } catch {
    return false;
  }
}

// These are schema-structure constraints, not an instance validator. Keyword
// locations follow the official meta-schemas for each supported dialect.
function vocabulary(draft) {
  const keywords = {};
  const add = (kind, names) => names.split(' ').forEach(name => { keywords[name] = kind; });
  add('string', 'title description format');
  add('uri', '$schema');
  add('reference', '$ref');
  add('type', 'type');
  add('enum', 'enum');
  add('strings', 'required');
  add('number', 'minimum maximum');
  add('positive', 'multipleOf');
  add(draft === 4 ? 'boolean' : 'number', 'exclusiveMinimum exclusiveMaximum');
  add('integer', 'minLength maxLength minItems maxItems minProperties maxProperties');
  add('boolean', 'uniqueItems');
  add('pattern', 'pattern');
  add('map', 'properties patternProperties definitions');
  add('dependencies', 'dependencies');
  add('schemas', 'allOf anyOf oneOf');
  add('schema', 'not');
  add('additional', 'additionalProperties');
  add('items', 'items');
  if (draft !== 2020) add('additional', 'additionalItems');
  if (draft === 4) add('reference', 'id');
  if (draft >= 6) {
    add('reference', '$id');
    add('array', 'examples');
    add('schema', 'contains propertyNames');
  }
  if (draft >= 7) {
    add('string', '$comment contentEncoding contentMediaType');
    add('boolean', 'readOnly writeOnly');
    add('schema', 'if then else');
  }
  if (draft >= 2019) {
    add('map', '$defs dependentSchemas');
    add('schema', 'unevaluatedItems unevaluatedProperties contentSchema');
    add('integer', 'minContains maxContains');
    add('boolean', 'deprecated');
    add('anchor', '$anchor');
    add('reference', '$recursiveRef');
    add(draft === 2019 ? 'boolean' : 'anchor', '$recursiveAnchor');
    add('vocabulary', '$vocabulary');
    add('dependentRequired', 'dependentRequired');
  }
  if (draft === 2020) {
    add('anchor', '$dynamicAnchor');
    add('reference', '$dynamicRef');
    add('schemas', 'prefixItems');
  }
  return keywords;
}
const vocabularies = new Map(Object.keys(labels).map(draft => [Number(draft), vocabulary(Number(draft))]));

function inspectSchema(schema, path) {
  const issues = [];
  const defaulted = !own(schema, '$schema');
  let rootDraft = 2020;
  function issue(status, at, message, draft) {
    issues.push({ status, path: at,
      message: `${message} Dialect context: ${labels[draft] ?? 'unknown'}. Parameters root: ${defaulted ? 'default selection of Draft 2020-12 ($schema omitted)' : 'explicit $schema selection'}.`,
      hint: status === 'unverified' ? 'Use a supported official $schema URI or review this custom dialect separately.'
        : 'Correct this schema keyword for the selected dialect; declare the intended $schema if different.' });
  }
  function visit(value, at, inherited = 2020, root = false, booleanAllowed = false) {
    let draft = inherited;
    if (own(value, '$schema')) {
      if (!uri(value.$schema, true)) {
        issue('fail', `${at}/$schema`, '$schema must be an absolute URI string.', undefined);
        return;
      }
      // Older drafts permit $schema only at the document root. Modern embedded
      // resources may select their own dialect when introduced by $id.
      if (!root && !(inherited >= 2019 && own(value, '$id') && uri(value.$id) && !value.$id.startsWith('#') && value.$id !== '')) {
        issue('fail', `${at}/$schema`, '$schema must appear at a schema resource root.', draft);
        return;
      }
      draft = dialects.get(value.$schema);
      if (root) rootDraft = draft;
      if (draft === undefined) {
        issue('unverified', `${at}/$schema`, `Schema structure is unverified for ${value.$schema}.`, draft);
        return;
      }
    }
    if (typeof value === 'boolean' && (draft !== 4 || booleanAllowed)) return;
    if (!object(value)) {
      issue('fail', at, `A schema must be ${draft === 4 ? 'an object' : 'an object or boolean'}.`, draft);
      return;
    }
    for (const [key, item] of Object.entries(value)) {
      const here = `${at}/${pointer(key)}`;
      const kind = vocabularies.get(draft)[key];
      const bad = message => issue('fail', here, message, draft);
      const child = (value, childPath = here, allowBoolean = false) => visit(value, childPath, draft, false, allowBoolean);
      if (kind === 'schema' || kind === 'additional') child(item, here, kind === 'additional');
      else if (kind === 'map') {
        if (!object(item)) bad(`${key} must be an object of schemas.`);
        else for (const [name, value] of Object.entries(item)) {
          const childPath = `${here}/${pointer(name)}`;
          if (key === 'patternProperties' && !pattern(name)) issue('fail', childPath, 'Use a valid regular expression property name.', draft);
          child(value, childPath);
        }
      } else if (kind === 'schemas' || (kind === 'items' && draft !== 2020 && Array.isArray(item))) {
        if (!Array.isArray(item) || item.length === 0) bad(`${key} must be a non-empty array of schemas.`);
        else item.forEach((value, index) => child(value, `${here}/${index}`));
      } else if (kind === 'items') child(item);
      else if (kind === 'dependencies' || kind === 'dependentRequired') {
        if (!object(item)) bad(`${key} must be an object.`);
        else for (const [name, value] of Object.entries(item)) {
          const childPath = `${here}/${pointer(name)}`;
          if (kind === 'dependentRequired' || Array.isArray(value)) {
            if (!strings(value) || (draft === 4 && value.length === 0)) {
              issue('fail', childPath, 'Dependencies must be an array of distinct strings, non-empty in Draft 4.', draft);
            }
          } else child(value, childPath);
        }
      } else if (kind === 'strings') {
        if (!strings(item) || (draft === 4 && item.length === 0)) bad('required must be an array of distinct strings, non-empty in Draft 4.');
      } else if (kind === 'type') {
        if (!(typeof item === 'string' && types.has(item))
          && !(strings(item) && item.length > 0 && item.every(type => types.has(type)))) bad('Use a JSON Schema type name or a non-empty array of distinct type names.');
      } else if (kind === 'enum') {
        if (!Array.isArray(item) || (draft <= 7 && (item.length === 0 || new Set(item.map(canonical)).size !== item.length))) {
          bad('enum must be an array; Drafts 4/6/7 also require non-empty, distinct values.');
        }
      } else if (['number', 'positive', 'integer'].includes(kind)) {
        if (typeof item !== 'number' || !Number.isFinite(item) || (kind === 'positive' && item <= 0)
          || (kind === 'integer' && (!Number.isInteger(item) || item < 0))) bad(`${key} must be a finite ${kind === 'integer' ? 'non-negative integer' : kind === 'positive' ? 'positive number' : 'number'}.`);
      } else if (kind === 'boolean' && typeof item !== 'boolean') bad(`${key} must be a boolean.`);
      else if (kind === 'array' && !Array.isArray(item)) bad(`${key} must be an array.`);
      else if (kind === 'string' && typeof item !== 'string') bad(`${key} must be a string.`);
      else if (kind === 'pattern' && !pattern(item)) bad('Use a valid regular expression string.');
      else if (kind === 'uri' && !uri(item, true)) bad(`${key} must be an absolute URI string.`);
      else if (kind === 'reference' && !uri(item)) bad(`${key} must be a URI-reference string; reference targets are not fetched.`);
      else if (kind === 'anchor' && (typeof item !== 'string' || !(draft === 2019 ? /^[A-Za-z][-A-Za-z0-9.:_]*$/ : /^[A-Za-z_][-A-Za-z0-9._]*$/).test(item))) bad(`${key} must be a valid plain-name anchor.`);
      else if (kind === 'vocabulary') {
        if (!object(item) || !Object.entries(item).every(([name, flag]) => uri(name, true) && typeof flag === 'boolean')) {
          bad('$vocabulary must map absolute URIs to booleans.');
        }
      }
      if (key === '$id' && draft >= 2019 && typeof item === 'string' && !/^[^#]*#?$/.test(item)) bad('$id must not contain a non-empty fragment.');
      if (draft === 4 && ['exclusiveMinimum', 'exclusiveMaximum'].includes(key)) {
        const bound = key === 'exclusiveMinimum' ? 'minimum' : 'maximum';
        if (!own(value, bound)) bad(`${key} requires ${bound} in Draft 4.`);
      }
    }
  }
  visit(schema, path, 2020, true);
  return issues.length ? issues : [{ status: 'pass', path,
    message: `Parameters have valid schema structure under ${labels[rootDraft]} at the root (${defaulted ? 'default selection; $schema omitted' : 'explicit $schema'}); embedded resources use their declared dialects. Reference availability, instance validation, and provider compatibility are not checked.`, hint: '' }];
}

function pattern(value) {
  if (typeof value !== 'string') return false;
  try { new RegExp(value); return true; } catch { return false; }
}

// Inspect configuration positions, not prose or schema instance data. A quoted
// ${...} example in instructions or command is not a build-time dependency.
function inspectResolved(value, path, emit, commondefs, literal = false) {
  if (Array.isArray(value)) return value.forEach((item, index) => inspectResolved(item, `${path}/${index}`, emit, commondefs, literal));
  if (object(value)) {
    for (const [key, item] of Object.entries(value)) {
      const here = `${path}/${pointer(key)}`;
      const nameMap = ['/network/link_slots', '/network/links', '/network/link_labels'].includes(path);
      if (!literal && !nameMap && ['include', '$include', '$env'].includes(key)) {
        emit('network.resolved', 'fail', here, 'Published configuration must not depend on includes or environment directives.',
          'Expand the dependency during publication and supply resolved JSON.');
      } else if (path !== '/network' || key !== 'commondefs') {
        inspectResolved(item, here, emit, commondefs,
          literal || (!nameMap && ['instructions', 'command', 'description', 'metadata', 'parameters', 'title', '$comment'].includes(key)));
      }
    }
  } else if (typeof value === 'string') {
    const replacement = own(commondefs?.replacement_values, value)
      || [...value.matchAll(/\{([A-Za-z0-9_]+)\}/g)].some(match => own(commondefs?.replacement_strings, match[1]));
    if (replacement || (!literal && /\$\{[^}]*\}/.test(value))) {
      emit('network.resolved', 'fail', path, 'A configuration value depends on an unresolved substitution.',
        'Expand configuration replacements during publication; keep non-dependent literal examples in prose fields.');
    }
  }
}

function webUrl(value) {
  // Artifact URLs use browser URL parsing, not JSON Schema's ASCII URI grammar.
  if (!text(value) || !/^https?:\/\//.test(value) || /[\x00-\x20\x7f<>"{}|\\^`]|\s/.test(value)
    || /%(?![a-f\d]{2})/i.test(value)) return null;
  try {
    const url = new URL(value);
    if (url.protocol === 'http:' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) return null;
    return url.username || url.password ? null : url;
  } catch { return null; }
}

function peerIdentity(value) {
  const url = webUrl(value);
  if (!url || url.pathname.endsWith('/')) return null;
  return { base: new URL('./', url).href.replace(/\/$/, ''), name: url.pathname.split('/').at(-1) };
}

function inspectIntegrity(input, entry, agents, emit) {
  const { network, baseUrl, activePeerChain, links } = input;
  let unresolved = false;
  inspectResolved(network, '/network', (...args) => { unresolved = true; emit(...args); }, network.commondefs);
  if (!unresolved) emit('network.resolved', 'pass', '/network', 'No structural include or substitution dependencies were found.', '');

  const chain = [];
  const registry = new RemoteRegistry({ maxDepth: Infinity });
  function reentry(target, path) {
    try { registry.checkCycle(chain, target.base, target.name); }
    catch (error) {
      if (error.code !== 'COMPOSITION_CYCLE') throw error;
      emit('peer.composition', 'fail', path,
        'This declared peer hop would re-enter an active network. Static analysis does not prove that the hop executes or that the browser stops it.',
        'Remove the re-entry from the active peer call chain; verify runtime interruption separately.');
    }
  }
  if (activePeerChain !== undefined) {
    const valid = Array.isArray(activePeerChain) && activePeerChain.every(value => peerIdentity(value));
    emit('peer.chain', valid ? 'pass' : 'fail', '/activePeerChain',
      'activePeerChain must list only currently active ancestor network URLs, not completed calls.', 'Supply an array of complete HTTPS peer-network URLs.');
    if (valid) activePeerChain.forEach((value, index) => {
      const target = peerIdentity(value);
      reentry(target, `/activePeerChain/${index}`);
      chain.push(registry.cacheKey(target.base, target.name));
    });
  }
  let base = webUrl(baseUrl);
  if (base && (base.search || base.hash)) base = null;
  if (baseUrl !== undefined) emit('peer.base', base ? 'pass' : 'fail', '/baseUrl',
    'baseUrl must identify the publication site base, including its subpath.', 'Supply an HTTPS site base without a query or fragment.');
  if (base && text(entry?.name)) {
    const target = { base: base.href.replace(/\/$/, ''), name: entry.name };
    reentry(target, '/network');
    chain.push(registry.cacheKey(target.base, target.name));
  }

  const byName = new Map(agents.filter(agent => text(agent?.name)).map(agent => [agent.name.trim(), agent]));
  // Internal recursion is legal. Reachability merely excludes unused agents from
  // the conditional peer re-entry diagnosis; it is not an agent-cycle detector.
  const reachable = new Set();
  function visit(name) {
    if (reachable.has(name) || !byName.has(name)) return;
    reachable.add(name);
    const refs = byName.get(name).tools;
    if (Array.isArray(refs)) refs.filter(ref => typeof ref === 'string' && byName.has(ref)).forEach(visit);
  }
  visit(entry?.front_man);
  const bindings = { ...(object(network.links) ? network.links : {}),
    ...(object(links?.networks?.[entry?.name]) ? links.networks[entry.name] : {}) };
  function peer(ref, path, active) {
    const identity = peerIdentity(ref);
    emit('tool.peer.url', identity ? 'pass' : 'fail', path,
      'A peer URL must use HTTPS (loopback HTTP for development) and end with the exact published network name.',
      'Use https://host/site-base/network-name, not a site base or a local file path.');
    if (identity && active) reentry(identity, path);
  }
  agents.forEach((agent, index) => {
    if (!object(agent)) return;
    const path = `/network/tools/${index}`;
    emit('agent.tools', Array.isArray(agent.tools) ? 'pass' : 'fail', `${path}/tools`,
      'Each agent must declare a tools array.', 'Use an array of local names, peer URLs, or MCP descriptors; use [] for no calls.');
    if (Array.isArray(agent.tools)) agent.tools.forEach((ref, at) => {
      const here = `${path}/tools/${at}`;
      if (typeof ref === 'string' && byName.has(ref) && !is_mcp_ref(ref)) {
        emit('tool.local', 'pass', here, 'The local reference names a defined agent.', '');
      } else if (object(ref) || (typeof ref === 'string' && is_mcp_ref(ref))) {
        const url = object(ref) ? ref.url : ref;
        const valid = !!webUrl(url) && (!object(ref) || !own(ref, 'tools') || (strings(ref.tools) && ref.tools.every(text)));
        emit('tool.mcp', valid ? 'pass' : 'fail', here,
          'An MCP reference needs an HTTP(S) endpoint and an optional array of distinct tool names.',
          'Supply { url: "https://host/mcp", tools: ["tool_name"] } or a complete MCP endpoint URL.');
      } else if (typeof ref === 'string' && own(network.link_slots, ref)) {
        if (own(bindings, ref)) peer(bindings[ref], here, text(agent.name) && reachable.has(agent.name.trim()));
        else emit('tool.link', 'fail', here, 'The declared named peer link has no published binding.',
          'Bind this reference in links.json under networks[network-name], or supply a direct peer-network URL.');
      } else if (typeof ref === 'string' && (/^[a-z][a-z\d+.-]*:/i.test(ref) || ref.startsWith('/'))) {
        // resolveRemote accepts root-relative direct references; resolveLink
        // requires complete URLs in published bindings and must not use this base.
        const target = ref.startsWith('/') && !ref.startsWith('//') && base ? new URL(ref, base).href : ref;
        peer(target, here, text(agent.name) && reachable.has(agent.name.trim()));
      } else emit('tool.local', 'fail', here, 'The tool reference does not name a defined local agent or a bound peer.',
        'Define the referenced agent, correct its exact name, or bind a declared peer link to a network URL.');
    });
    for (const key of ['max_steps', 'max_execution_seconds']) {
      const owner = own(agent, key) ? agent : network;
      const here = own(agent, key) ? `${path}/${key}` : `/network/${key}`;
      if (!own(owner, key)) emit('execution.limit', 'warning', `${path}/${key}`,
        `No ${key} is declared for this agent; the caller runtime may supply defaults.`,
        'Declare a finite positive execution limit; check effective caller budgets during execution.');
      else emit('execution.limit', typeof owner[key] === 'number' && Number.isFinite(owner[key]) && owner[key] > 0
        && (key !== 'max_steps' || Number.isInteger(owner[key])) ? 'pass' : 'fail', here,
        `${key} must be a finite positive ${key === 'max_steps' ? 'integer' : 'number'} when declared; this is not proof of enforcement.`,
        'Replace the limit with a finite positive value.');
    }
  });
  emit('runtime.composition', 'unverified', '/network/tools',
    'Only re-entry into the known active peer chain is diagnosed. Other peer graphs, actual calls, repeated completed calls, and browser cycle interruption are unverified.',
    'Inspect peer artifacts and observe an actual browser run; provide baseUrl to diagnose self-peer re-entry.');
  emit('runtime.safety', 'unverified', '/network',
    'Execution-limit enforcement, consent, CORS, peer availability, and private-context isolation cannot be established from static JSON.',
    'Verify these behaviors in the browser using runtime events, not declaration-only checks.');
}

/**
 * Inspect parsed JSON artifacts without fetching, running agents, or changing input.
 * Paths are JSON Pointers into the input. valid covers static checks: warnings and
 * runtime.* unverified observations are non-blocking, not proof of live readiness.
 * An unverified schema still prevents a valid static report.
 * networkName selects an exact published entry; otherwise the first is inspected.
 * baseUrl is the publication base, not the definition URL. activePeerChain is an
 * optional array of active ancestor peer URLs, excluding the current network.
 * links optionally supplies links.json; named peer references require runtime
 * link_slots and an absolute peer URL in network.links or links.networks[selectedName].
 * Only direct peer references may use root-relative paths resolved against baseUrl.
 */
export function validateNetwork(input = {}) {
  const { manifest, network, networkName } = input ?? {};
  const checks = [];
  function check(ruleId, passes, path, message, hint) {
    checks.push({ ruleId, status: passes ? 'pass' : 'fail', path, message, hint: passes ? '' : hint });
  }
  check('manifest.networks', object(manifest) && Array.isArray(manifest.networks) && manifest.networks.length > 0,
    '/manifest/networks', 'The manifest must publish at least one network.', 'Add a networks array with name, front_man, and hocon.');
  const entries = Array.isArray(manifest?.networks) ? manifest.networks : [];
  entries.forEach((entry, index) => {
    for (const key of ['name', 'front_man', 'hocon']) {
      check(`manifest.${key}`, text(entry?.[key]), `/manifest/networks/${index}/${key}`,
        `Manifest ${key} must be a non-empty string.`, `Supply the published network's ${key}.`);
    }
  });
  const selected = networkName === undefined ? 0 : entries.findIndex(entry => entry?.name === networkName);
  const entry = entries[selected];
  check('manifest.selection', object(entry), '/manifest/networks',
    'The requested network must have an exact manifest entry.', 'Select a name published in manifest.networks.');
  check('network.document', object(network), '/network', 'The network must be a JSON object.', 'Supply the resolved network JSON object.');
  if (!object(network)) return { valid: false, checks };

  check('network.description', text(network.metadata?.description), '/network/metadata/description',
    'The network must have a short metadata.description.', 'Add a non-empty public description under metadata.');
  check('network.tools', Array.isArray(network.tools) && network.tools.length > 0, '/network/tools',
    'The network must define agents in tools.', 'Add a non-empty array of agent definitions.');
  const agents = Array.isArray(network.tools) ? network.tools : [];
  if (object(entry) && text(entry.front_man)) {
    check('network.front_man.exists', agents.some(agent => text(agent?.name) && agent.name.trim() === entry.front_man),
      `/manifest/networks/${selected}/front_man`, 'The manifest front_man must name an agent in network.tools.',
      'Set front_man to an agent name defined in this network.');
  }
  const names = new Set();
  agents.forEach((agent, index) => {
    const name = text(agent?.name) ? agent.name.trim() : '';
    check('agent.name', object(agent) && name !== '' && !names.has(name), `/network/tools/${index}/name`,
      'Every agent must have a non-empty, unique name.', 'Supply an agent name not used by another agent in this network.');
    names.add(name);
    const path = `/network/tools/${index}/function`;
    check('agent.description', text(agent?.function?.description), `${path}/description`,
      'Every agent must have a function.description.', 'Add a non-empty description to this agent function.');
    if (!own(agent?.function, 'parameters')) {
      checks.push({ ruleId: 'agent.parameters', status: 'pass', path: `${path}/parameters`,
        message: 'Parameters are omitted; the runtime applies its default object schema with required request:string.', hint: '' });
    } else {
      for (const result of inspectSchema(agent.function.parameters, `${path}/parameters`)) {
        checks.push({ ruleId: 'agent.parameters', ...result });
      }
    }
  });
  if (object(entry)) {
    check('network.identity.name', text(entry.name) && (!own(network, 'name') || (text(network.name) && network.name === entry.name)),
      own(network, 'name') ? '/network/name' : `/manifest/networks/${selected}/name`,
      'The manifest supplies the published name; any duplicate network.name must agree. Static input cannot prove stability over time.',
      'Use the same non-empty name in the manifest and any network.name declaration.');
    if (own(network, 'front_man')) {
      check('network.identity.front_man', text(network.front_man) && network.front_man === entry.front_man, '/network/front_man',
        'Any duplicate network.front_man must agree with the manifest.', 'Match the manifest front_man or omit the duplicate field.');
    }
    // Runtime config processing can fail even when the raw tools have valid shape.
    try {
      const front = Array.isArray(network.tools) && agents.every(object) ? find_front_man(filterConfig(network)) : null;
      check('network.front_man.selected', text(entry.front_man) && front === entry.front_man,
        `/manifest/networks/${selected}/front_man`,
        'The manifest front_man must match the entry agent selected by the reference runtime.',
        'Make front_man name the first agent with instructions and without class/toolbox, or the first tool if none qualifies.');
    } catch {
      check('network.config', false, '/network',
        'The reference runtime could not process the network configuration for entry-agent selection.',
        'Correct the network configuration and its replacement values so the reference runtime can select an entry agent.');
    }
  }
  inspectIntegrity(input, entry, agents, (ruleId, status, path, message, hint) => {
    checks.push({ ruleId, status, path, message, hint: status === 'pass' ? '' : hint });
  });
  return { valid: checks.every(item => item.status === 'pass' || item.status === 'warning'
    || (item.status === 'unverified' && item.ruleId.startsWith('runtime.'))), checks };
}
