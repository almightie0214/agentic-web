import { lstat, readFile, realpath, stat } from 'node:fs/promises';
import { relative, isAbsolute, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validateNetwork } from '../site-a/validator-rules.mjs';

const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = value => typeof value === 'string' && value.trim().length > 0;
const display = value => typeof value === 'string' ? value : JSON.stringify(value);
const pointer = value => String(display(value)).replaceAll('~', '~0').replaceAll('/', '~1');

/**
 * Inspect the repository's two independent static publication roots. No fetch,
 * vendor loader execution, DOM, storage, inference, or browser emulation occurs.
 * The shared AW2 rules alone own manifest/network conformance. Additional checks
 * concern local publication files and the repository's A <-> B link wiring.
 */
export async function checkConformance({ root = new URL('../', import.meta.url) } = {}) {
  const checks = [];
  const sites = [];
  let valid = true;
  const add = (site, ruleId, status, path, message, networkName) => {
    if (status === 'fail') valid = false;
    checks.push({ site, ...(networkName === undefined ? {} : { networkName }), ruleId, status, path, message });
  };

  for (const name of ['site-a', 'site-b']) {
    const base = new URL(`${name}/`, root);
    const site = { name, manifest: undefined, links: undefined, networks: [] };
    sites.push(site);

    async function readArtifact(reference, path, { json = true, optional = false } = {}) {
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
        add(name, 'publication.file', 'pass', path, `${reference}: readable ${json ? 'JSON' : 'file'}.`);
        return value;
      } catch (error) {
        add(name, 'publication.file', 'fail', path, `${display(reference)}: ${error.message}`);
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
      const report = validateNetwork({ manifest: site.manifest, network, links: site.links, networkName: entry?.name });
      valid &&= report.valid;
      checks.push(...report.checks.map(check => ({ site: name, networkName: entry?.name, ...check })));
    }
    // Check existence only: never import publisher action code in this CLI.
    if (site.manifest?.actions?.module !== undefined) {
      await readArtifact(site.manifest.actions.module, '/manifest/actions/module', { json: false });
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
          'Peer bindings must be a map.', entry?.name);
        if (!object(bindings)) continue;
        for (const [slot, target] of Object.entries(bindings)) {
          const path = `${source}/${pointer(slot)}`;
          add(site.name, 'publication.links.slot', object(network?.link_slots) && Object.hasOwn(network.link_slots, slot) ? 'pass' : 'fail',
            path, 'A published binding must name a declared link slot.', entry?.name);
          let requested;
          try { if (typeof target === 'string') requested = new URL(target).pathname.split('/').at(-1); } catch { /* A mismatch below. */ }
          add(site.name, 'publication.links.target', peerNames.has(requested) ? 'pass' : 'fail', path,
            `The binding's final URL component must exactly match a network published in the local ${peer.name} manifest. This does not verify the remote origin or execute its loader.`, entry?.name);
        }
      }
    }
  }

  return { valid, checks };
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const report = await checkConformance();
  for (const check of report.checks) {
    console.log(`[${check.status}] ${check.site}${check.networkName === undefined ? '' : `/${display(check.networkName)}`} ${check.ruleId} ${check.path}: ${check.message}`);
    if (check.hint) console.log(`  ${check.hint}`);
  }
  console.log(`Static repository conformance: ${report.valid ? 'PASS' : 'FAIL'}. Browser behavior, exact-name loader refusal, live HTTPS/CORS, consent, keys, router isolation, private context, cycles, and execution-limit enforcement remain unverified.`);
  process.exitCode = report.valid ? 0 : 1;
}
