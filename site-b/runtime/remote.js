// remote.js — the RemoteNetworkLoader intrinsic: fetch a peer origin's published
// agent network (manifest + HOCON) and make it runnable
// locally. This is the "fetch-and-run-locally" cross-origin composition model:
// there is no agent server — the caller's browser runs the peer's published files.

import { assertActive, scoped } from "./scope.js";

// All published artifacts stay on the approved publication origin. Redirects
// are never followed, including same-origin redirects and optional links.json.
export async function fetchPublished(url, { base = url, signal, cache, fetchImpl = fetch } = {}) {
  const target = new URL(url);
  const publication = new URL(base);
  if (target.protocol !== publication.protocol || target.origin !== publication.origin) {
    const error = new Error(`Published file must remain on ${publication.origin}: ${url}`);
    error.code = "PUBLISHED_FETCH_POLICY";
    throw error;
  }
  let resp;
  try {
    resp = await scoped(signal, () => fetchImpl(target.href, { signal, cache, redirect: "error" }));
  } catch (cause) {
    assertActive(signal);
    const error = new Error(`Published file fetch failed (redirects are forbidden): ${url}`, { cause });
    error.code = "PUBLISHED_FETCH_FAILED";
    throw error;
  }
  assertActive(signal);
  if (resp.redirected || resp.type === "opaqueredirect" || (resp.status >= 300 && resp.status < 400)) {
    const error = new Error(`Published file redirect is forbidden: ${url}`);
    error.code = "PUBLISHED_REDIRECT";
    throw error;
  }
  return resp;
}

export async function fetchManifest(originUrl, { signal } = {}) {
  const base = originUrl.replace(/\/+$/, "");
  const url = resolveUrl(base, "/agent-manifest.json");
  const resp = await fetchPublished(url, { base, signal });
  if (!resp.ok) throw new Error(`manifest fetch ${resp.status} for ${url}`);
  const manifest = await scoped(signal, () => resp.json());
  assertActive(signal);
  return { manifest, base, url };
}

export async function fetchText(url, { base = url, signal } = {}) {
  const resp = await fetchPublished(url, { base, signal });
  if (!resp.ok) throw new Error(`fetch ${resp.status} for ${url}`);
  return scoped(signal, () => resp.text());
}

// Single-leading-slash paths are publication-base relative, as before. URL
// parsing normalizes dot segments and exposes network-path references to policy.
export function resolveUrl(base, path) {
  const relative = path.startsWith("/") && !path.startsWith("//") ? "." + path : path;
  return new URL(relative, base.replace(/\/+$/, "") + "/").href;
}

// Caches compiled peer sessions and enforces cycle + depth limits across hops.
export class RemoteRegistry {
  constructor({ maxDepth = 5, trace } = {}) {
    this.maxDepth = maxDepth;
    this.trace = trace;
    this.cache = new Map(); // key: `${origin}::${agentName}` -> Session
  }

  cacheKey(origin, agentName) {
    return `${origin}::${agentName}`;
  }

  get(origin, agentName) {
    return this.cache.get(this.cacheKey(origin, agentName));
  }

  set(origin, agentName, session) {
    this.cache.set(this.cacheKey(origin, agentName), session);
  }

  checkCycle(chain, origin, agentName) {
    const key = this.cacheKey(origin, agentName);
    if (chain.includes(key)) {
      const error = new Error(`composition cycle detected: ${[...chain, key].join(" -> ")}`);
      error.code = "COMPOSITION_CYCLE";
      throw error;
    }
    if (chain.length >= this.maxDepth) {
      const error = new Error(`composition depth limit (${this.maxDepth}) exceeded`);
      error.code = "COMPOSITION_DEPTH";
      throw error;
    }
  }
}
