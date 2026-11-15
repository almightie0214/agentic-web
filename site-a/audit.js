import { validateNetwork } from './validator-rules.mjs';

function publicUrl(value, base) {
  if (typeof value !== 'string' || !value.trim()) throw new Error('A URL is required.');
  const url = new URL(value, base);
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if ((url.protocol !== 'https:' && !(url.protocol === 'http:' && loopback))
    || url.username || url.password) throw new Error('Use HTTPS, or loopback HTTP for local development, without credentials.');
  return url;
}

/**
 * Audit public JSON only: no inference, action/code imports, peer traversal, or
 * browser-storage access. A user-initiated URL audit authorizes these artifact
 * GETs; it does not authorize a runtime peer invocation. The caller owns its UI
 * and any consent required before initiating contact.
 *
 * Accept a site base (with or without a trailing slash) or agent-manifest.json.
 * Select the first manifest network unless networkName requests an exact match.
 * fetchImpl and signal allow isolated tests and caller-owned cancellation.
 *
 * artifacts retains parsed documents and retrieval diagnostics; errors concerns
 * acquisition, not conformance. report is the unchanged validateNetwork result
 * after all three documents load, or manifest-only checks if no definition can
 * be selected. No report is fabricated for unavailable/malformed JSON.
 * readiness.summary is display-ready English. static-ready means only that the
 * fetched artifacts passed static rules, never that runtime safety was proved.
 */
export async function auditUrl(value, { fetchImpl = globalThis.fetch, networkName, signal } = {}) {
  const artifacts = {};
  const errors = [];
  const input = {};
  let report = null;
  let manifestUrl;

  function result() {
    const failedRules = report?.checks.some(check => check.status === 'fail');
    const status = failedRules ? 'blocked' : errors.length || !report?.valid ? 'incomplete' : 'static-ready';
    const summary = status === 'static-ready'
      ? 'Readiness: public JSON retrieved and static checks passed. Warnings may remain. Runtime behavior and access from other origins are unverified.'
      : status === 'blocked'
        ? 'Readiness: blocked by reported rule violations. Runtime behavior is unverified.'
        : errors.length
          ? 'Readiness: incomplete because artifacts could not be acquired as JSON. This does not establish a rule violation or a CORS cause. Runtime behavior is unverified.'
          : 'Readiness: static conformance remains unverified; review the report. Runtime behavior is unverified.';
    return { baseUrl: input.baseUrl ?? null, manifestUrl: manifestUrl ?? null,
      artifacts, errors, input, report,
      readiness: { status, summary, runtime: 'unverified' } };
  }

  try {
    const target = publicUrl(value);
    target.hash = '';
    if (target.pathname.endsWith('/agent-manifest.json')) {
      manifestUrl = target.href;
      input.baseUrl = new URL('./', target).href;
    } else {
      // A base without a trailing slash is still a directory, not a network URL.
      target.search = '';
      if (!target.pathname.endsWith('/')) target.pathname += '/';
      input.baseUrl = target.href;
      manifestUrl = new URL('agent-manifest.json', target).href;
    }
  } catch {
    errors.push({ artifact: 'input', kind: 'input', path: '/url',
      message: 'Enter an absolute HTTPS site base or agent-manifest.json URL (loopback HTTP is allowed for local development). Do not include URL credentials.',
      hint: 'Use https://host/your-site/ or https://host/your-site/agent-manifest.json.' });
    return result();
  }

  async function read(artifact, url) {
    const record = artifacts[artifact] = { url, status: 'failed' };
    function fail(kind, message, hint) {
      errors.push({ artifact, url, kind, path: `/${artifact}`, message, hint,
        ...(record.httpStatus === undefined ? {} : { httpStatus: record.httpStatus }) });
      return false;
    }
    let response;
    try {
      response = await fetchImpl(url, { method: 'GET', mode: 'cors', credentials: 'omit', cache: 'no-store', signal });
    } catch {
      return fail(signal?.aborted ? 'aborted' : 'fetch',
        signal?.aborted ? 'The audit request was cancelled.'
          : 'The artifact could not be fetched. The cause is unknown; connectivity, TLS, browser policy, or CORS may be involved.',
        'Check the URL and browser network diagnostics; a generic fetch failure does not prove a CORS problem.');
    }
    record.httpStatus = response.status;
    record.responseUrl = response.url || url;
    if (!response.ok) return fail('http', `The artifact returned HTTP ${response.status}.`, 'Publish the artifact at this URL and check its HTTP response.');
    // Read failures are transport failures, not evidence of invalid JSON.
    let source;
    try { source = await response.text(); }
    catch {
      return fail(signal?.aborted ? 'aborted' : 'fetch', 'The response body could not be read.', 'Retry the audit and inspect browser network diagnostics.');
    }
    try { record.data = JSON.parse(source); }
    catch {
      return fail('json', 'The artifact is not valid JSON.', 'Publish resolved JSON, not HOCON, HTML, or an unresolved template.');
    }
    record.status = 'loaded';
    input[artifact] = record.data;
    return true;
  }

  if (!await read('manifest', manifestUrl)) return result();
  if (networkName !== undefined) input.networkName = networkName;
  const entries = Array.isArray(input.manifest?.networks) ? input.manifest.networks : [];
  const selected = networkName === undefined ? 0 : entries.findIndex(entry => entry?.name === networkName);
  const entry = entries[selected];
  let networkUrl;
  // Let the shared rules own missing fields and exact-name selection, rather
  // than treating an invalid publication as a failed fetch of "undefined".
  if (typeof entry?.hocon !== 'string' || !entry.hocon.trim()) {
    report = { valid: false, checks: validateNetwork(input).checks.filter(check => check.ruleId.startsWith('manifest.')) };
  } else {
    try { networkUrl = publicUrl(entry.hocon, input.baseUrl).href; }
    catch {
      report = { valid: false, checks: [
        ...validateNetwork(input).checks.filter(check => check.ruleId.startsWith('manifest.')),
        { ruleId: 'publication.definition.url', status: 'fail', path: `/manifest/networks/${selected}/hocon`,
          message: 'The definition must resolve to a public HTTPS URL (loopback HTTP for local development), without URL credentials.',
          hint: 'Use a relative JSON path or an absolute HTTPS definition URL.' },
      ] };
    }
  }
  if (networkUrl) await read('network', networkUrl);
  await read('links', new URL('links.json', input.baseUrl).href);
  if (networkUrl && errors.length === 0) report = validateNetwork(input);
  return result();
}
