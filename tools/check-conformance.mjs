import { lstat, readFile, realpath, stat } from 'node:fs/promises';
import { relative, isAbsolute, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validateNetwork } from '../site-a/validator-rules.mjs';

const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = value => typeof value === 'string' && value.trim().length > 0;
const display = value => typeof value === 'string' ? value : JSON.stringify(value);
const pointer = value => String(display(value)).replaceAll('~', '~0').replaceAll('/', '~1');

// Audit declarations only. Never read, inject, filter, or print context values.
function inspectPrivateContext(network, emit) {
  if (!object(network)) return;
  if (Object.hasOwn(network, 'allow')) emit('warning', '/network/allow',
    'Network-level allow is not inherited by the reference runtime. Declare private-context permissions on each agent.');
  const agents = Array.isArray(network.tools) ? network.tools : [];
  for (const [index, agent] of agents.entries()) {
    if (!object(agent)) continue;
    const path = `/network/tools/${index}/allow`;
    if (Object.hasOwn(agent, 'allow') && !object(agent.allow)) {
      emit('fail', path, 'Agent allow must be an object when declared.');
      continue;
    }
    for (const direction of ['to_downstream', 'to_upstream']) {
      const block = agent.allow?.[direction];
      const here = `${path}/${direction}/sly_data`;
      if (block !== undefined && !object(block)) {
        emit('fail', `${path}/${direction}`, 'Private-context direction must be an object when declared.');
        continue;
      }
      const keys = block?.sly_data;
      if (keys === undefined || keys === null) {
        emit('pass', here, 'No private-context fields are allowed by this declaration (deny by default); runtime filtering remains unverified.');
      } else if (!Array.isArray(keys) || !keys.every(key => text(key) && key.trim() === key && key !== '*')
        || new Set(keys).size !== keys.length) {
        emit('fail', here, 'Private-context permissions must be an array of distinct, explicit field names; wildcard disclosure is not permitted by the named-field policy.');
      } else {
        emit(keys.length ? 'warning' : 'pass', here,
          `${keys.length} private-context field(s) explicitly allowed. Review downstream and upstream disclosure separately; declaration validity does not establish runtime filtering or destination scoping.`);
      }
    }
  }
  for (const [path, owner] of [['/network', network], ...agents.map((agent, index) => [`/network/tools/${index}`, agent])]) {
    if (object(owner) && Object.hasOwn(owner, 'sly_data')) emit('warning', `${path}/sly_data`,
      'Published sly_data is public JSON, not invocation context or evidence of injection. Use only harmless sentinels; inject through existing browser runtime invocation options for observation. Values are not printed.');
  }
}

// A conservative audit of Pages' local-path _headers rules. Merge every matching
// rule: duplicate ACAO values do not form a usable wildcard response header.
function inspectCors(source, artifacts, emit) {
  const rules = [];
  let current;
  for (const [index, line] of source.split(/\r?\n/).entries()) {
    const value = line.trim();
    if (!value || value.startsWith('#')) continue;
    if (!/^\s/.test(line)) {
      if (!value.startsWith('/') || /[\s?#]/.test(value)) {
        emit('fail', `/_headers/${index + 1}`, 'Static CORS audit supports site-relative path rules only; this rule cannot be verified.');
        current = undefined;
        continue;
      }
      const expression = value.split(/(\*|:[A-Za-z][\w]*)/).map(part => part === '*' ? '.*'
        : part.startsWith(':') ? '[^/]+' : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('');
      current = { matches: new RegExp(`^${expression}$`), origins: [], removesOrigin: false };
      rules.push(current);
    } else if (!current) {
      emit('fail', `/_headers/${index + 1}`, 'A header must belong to a supported path rule.');
    } else if (/^!\s*[^:\s]+\s*$/.test(value)) {
      if (/^!\s*access-control-allow-origin\s*$/i.test(value)) current.removesOrigin = true;
    } else {
      const header = /^([^:\s]+)\s*:\s*(.*)$/.exec(value);
      if (!header) emit('fail', `/_headers/${index + 1}`, 'Malformed header declaration.');
      else if (header[1].toLowerCase() === 'access-control-allow-origin') current.origins.push(header[2]);
    }
  }
  for (const artifact of new Set(artifacts)) {
    const matched = rules.filter(rule => rule.matches.test(artifact));
    const origins = matched.flatMap(rule => rule.origins);
    emit(origins.length === 1 && origins[0] === '*' && !matched.some(rule => rule.removesOrigin) ? 'pass' : 'fail',
      `/_headers${artifact}`, 'Public artifact must have exactly one applicable Access-Control-Allow-Origin: * declaration and no removal. This checks local configuration only, not deployed HTTPS/CORS responses.');
  }
}

/**
 * Inspect the repository's two independent static publication roots. No fetch,
 * vendor loader execution, DOM, storage, inference, or browser emulation occurs.
 * AW2 owns shared manifest/network rules, conditional cycle diagnostics and limit
 * warnings. CLI-only checks audit publication files, private-context declarations,
 * CORS configuration and local A <-> B wiring, never runtime enforcement.
 */
export async function checkConformance({ root = new URL('../', import.meta.url) } = {}) {
  const checks = [];
  const sites = [];
  let valid = true;
  const add = (site, ruleId, status, path, message, context = {}) => {
    if (status === 'fail') valid = false;
    checks.push({ site, ...context, ruleId, status, path, message });
  };

  for (const name of ['site-a', 'site-b']) {
    const base = new URL(`${name}/`, root);
    const site = { name, manifest: undefined, links: undefined, networks: [], artifacts: [] };
    sites.push(site);

    async function readArtifact(reference, path, { json = true, optional = false, context = {} } = {}) {
      try {
        // Our deployment bundles own their assets. A reference to a sibling site,
        // absolute host path, remote URL, or escaping symlink cannot be verified
        // as a file in this independent static publication root.
        if (!text(reference) || reference.startsWith('/') || /^[a-z][a-z\d+.-]*:/i.test(reference)) {
          throw new Error('Use a site-relative artifact reference.');
        }
        const url = new URL(reference, base);
        url.search = '';
        url.hash = '';
        if (!url.href.startsWith(base.href)) throw new Error('Artifact reference leaves the site publication root.');
        const filename = fileURLToPath(url);
        // Optional means absent, not unreadable, malformed, or a dangling link.
        if (optional) {
          try { await lstat(filename); }
          catch (error) { if (error.code === 'ENOENT') return undefined; throw error; }
        }
        const siteRoot = await realpath(base);
        const resolved = await realpath(filename);
        const local = relative(siteRoot, resolved);
        if (isAbsolute(local) || local === '..' || local.startsWith(`..${sep}`)) {
          throw new Error('Artifact resolves outside the site publication root.');
        }
        if (!(await stat(resolved)).isFile()) throw new Error('Artifact must be a regular file.');
        const source = await readFile(resolved, 'utf8');
        const value = json ? JSON.parse(source) : source;
        if (json) site.artifacts.push(url.pathname.slice(base.pathname.length - 1));
        add(name, 'publication.file', 'pass', path, `${reference}: readable ${json ? 'JSON' : 'file'}.`, context);
        return value;
      } catch (error) {
        add(name, 'publication.file', 'fail', path, `${display(reference)}: ${error.message}`, context);
        return undefined;
      }
    }

    site.manifest = await readArtifact('agent-manifest.json', '/manifest');
    site.links = await readArtifact('links.json', '/links', { optional: true });
    const entries = Array.isArray(site.manifest?.networks) ? site.manifest.networks : [];
    const names = new Set();
    // Even an empty or unreadable manifest must receive shared manifest checks.
    if (!entries.length) {
      const report = validateNetwork({ manifest: site.manifest });
      valid &&= report.valid;
      checks.push(...report.checks.filter(check => check.ruleId.startsWith('manifest.'))
        .map(check => ({ site: name, ...check })));
    }
    for (const [index, entry] of entries.entries()) {
      if (text(entry?.name)) {
        add(name, 'publication.name', names.has(entry.name) ? 'fail' : 'pass', `/manifest/networks/${index}/name`,
          'Published network names must be unambiguous within this manifest.');
        names.add(entry.name);
      }
      const network = await readArtifact(entry?.hocon, `/manifest/networks/${index}/hocon`);
      site.networks.push({ entry, network });
      // AW2 owns conditional peer-cycle diagnostics and execution-limit warnings.
      // Unknown live publication bases/active chains are not guessed in this CLI.
      const report = validateNetwork({ manifest: site.manifest, network, links: site.links, networkName: entry?.name });
      valid &&= report.valid;
      checks.push(...report.checks.map(check => ({ site: name, networkName: entry?.name, ...check })));
      inspectPrivateContext(network, (status, path, message) =>
        add(name, 'publication.private_context', status, path, message, { networkName: entry?.name }));
    }
    if (name === 'site-a') {
      const reference = 'samples/test-slydata.network.json';
      const path = `/${reference}`;
      const context = { sample: reference };
      // Like the other inspector samples, this is a manifest/network input
      // envelope, not an additional published network or invocation context.
      const sample = await readArtifact(reference, path, { context });
      const report = validateNetwork(sample);
      valid &&= report.valid;
      checks.push(...report.checks.map(check => ({ site: name, ...context, ...check, path: `${path}${check.path}` })));
      inspectPrivateContext(sample?.network, (status, here, message) =>
        add(name, 'publication.private_context', status, `${path}${here}`, message, context));
    }
    // Check existence only: never import publisher action code in this CLI.
    if (site.manifest?.actions?.module !== undefined) {
      await readArtifact(site.manifest.actions.module, '/manifest/actions/module', { json: false });
    }

    if (name === 'site-b') {
      const headers = await readArtifact('_headers', '/_headers', { json: false });
      if (headers !== undefined) {
        inspectCors(headers, site.artifacts, (status, path, message) =>
          add(name, 'publication.cors', status, path, message));
      }
    }

    if (site.links !== undefined) {
      const valid = object(site.links) && site.links.version === 1 && object(site.links.networks);
      add(name, 'publication.links', valid ? 'pass' : 'fail', '/links',
        'links.json must contain version:1 and a networks binding map.');
      if (valid) for (const [networkName, bindings] of Object.entries(site.links.networks)) {
        add(name, 'publication.links.network', names.has(networkName) && object(bindings) ? 'pass' : 'fail',
          `/links/networks/${pointer(networkName)}`, 'Each binding map must belong to an exact published network name.');
      }
    }
  }

  for (const site of sites) {
    const peer = sites.find(other => other !== site);
    const peerNames = new Set(peer.networks.map(({ entry }) => entry?.name).filter(text));
    for (const { entry, network } of site.networks) {
      const published = text(entry?.name) ? site.links?.networks?.[entry.name] : undefined;
      for (const [source, bindings] of [['/network/links', network?.links],
        [`/links/networks/${pointer(entry?.name)}`, published]]) {
        if (bindings === undefined) continue;
        add(site.name, 'publication.links.bindings', object(bindings) ? 'pass' : 'fail', source,
          'Peer bindings must be a map.', { networkName: entry?.name });
        if (!object(bindings)) continue;
        for (const [slot, target] of Object.entries(bindings)) {
          const path = `${source}/${pointer(slot)}`;
          add(site.name, 'publication.links.slot', object(network?.link_slots) && Object.hasOwn(network.link_slots, slot) ? 'pass' : 'fail',
            path, 'A published binding must name a declared link slot.', { networkName: entry?.name });
          let requested;
          try { if (typeof target === 'string') requested = new URL(target).pathname.split('/').at(-1); } catch { /* A mismatch below. */ }
          add(site.name, 'publication.links.target', peerNames.has(requested) ? 'pass' : 'fail', path,
            `The binding's final URL component must exactly match a network published in the local ${peer.name} manifest. This does not verify the remote origin or execute its loader.`, { networkName: entry?.name });
        }
      }
    }
  }

  return { valid, checks };
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const report = await checkConformance();
  for (const check of report.checks) {
    console.log(`[${check.status}] ${check.site}${check.sample === undefined ? '' : `/sample:${check.sample}`}${check.networkName === undefined ? '' : `/${display(check.networkName)}`} ${check.ruleId} ${check.path}: ${check.message}`);
    if (check.hint) console.log(`  ${check.hint}`);
  }
  console.log(`Static repository conformance: ${report.valid ? 'PASS' : 'FAIL'}. Browser behavior, exact-name loader refusal, live HTTPS/CORS, consent, keys, router isolation, private context, cycles, and execution-limit enforcement remain unverified. demo-kit must observe duplicate-agent and wrong explicit peer-name refusal before any model call in a real browser; Node does not run the vendor loader.`);
  process.exitCode = report.valid ? 0 : 1;
}
