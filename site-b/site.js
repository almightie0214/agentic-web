const root = document.querySelector('#agent-app');
const status = document.querySelector('#site-status');

const urlSecrets = [...new URLSearchParams(globalThis.location?.search || "")]
  .filter(([name]) => /key|token|secret|password|authorization|cookie/i.test(name))
  .map(([, value]) => value).filter(Boolean);

function bootError(error) {
  let message = String(error?.message || error || "Unknown loader error");
  for (const value of urlSecrets) message = message.split(value).join("[redacted]");
  return message.replace(/https?:\/\/[^\s<>"']+/gi, value => {
    try { const url = new URL(value); return url.origin + url.pathname; }
    catch { return "[redacted URL]"; }
  }).replace(/\b(authorization|cookie)\s*:\s*[^\r\n]+/gi, "$1: [redacted]")
    .replace(/(["']?(?:api[_-]?key|key|token|secret|password|authorization|cookie)["']?\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi, "$1[redacted]");
}

async function mountScout() {
  try {
    // Remove URL credentials even if the runtime import fails.
    const params = new URLSearchParams(location.search);
    if (params.has('key')) {
      params.delete('key');
      const query = params.toString();
      history.replaceState(null, '', location.pathname + (query ? `?${query}` : '') + location.hash);
    }

    const { boot } = await import('./runtime/index.js');
    await boot(root, {
      originUrl: new URL('./', import.meta.url).href,
    });
    root.hidden = false;
    status.textContent = 'Spec Scout is ready. Configure AI model settings with your provider key to ask specification questions using the embedded, cited excerpts. Responses are informational, not conformance certification.';
  } catch (error) {
    root.hidden = true;
    status.setAttribute('role', 'alert');
    status.dataset.state = 'error';
    status.textContent = 'Spec Scout could not be loaded. Serve this site over HTTP or HTTPS, check that its runtime, agent-manifest.json, and network definition are available and valid, and reload.' + ` Loader error: ${bootError(error)}`;
  }
}

await mountScout();
