import { filterConfig } from './runtime/kernel.js';
import { find_front_man } from './runtime/generated/graph.gen.mjs';

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

/**
 * Inspect parsed JSON artifacts without fetching, running agents, or changing input.
 * Paths are JSON Pointers into { manifest, network }. valid means all included
 * checks passed, not live readiness; an unverified schema does not count as valid.
 * networkName selects an exact published entry; otherwise the first is inspected.
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
    // Guard malformed tools before using the same config filters and selector as AgentNetwork.
    const front = Array.isArray(network.tools) && agents.every(object) ? find_front_man(filterConfig(network)) : null;
    check('network.front_man.selected', text(entry.front_man) && front === entry.front_man,
      `/manifest/networks/${selected}/front_man`,
      'The manifest front_man must match the entry agent selected by the reference runtime.',
      'Make front_man name the first agent with instructions and without class/toolbox, or the first tool if none qualifies.');
  }
  return { valid: checks.every(item => item.status === 'pass'), checks };
}
