const root = document.querySelector('#agent-app');
const status = document.querySelector('#site-status');

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
      sandboxWorkerUrl: new URL('./runtime/sandbox-worker.js', import.meta.url).href,
    });
    root.hidden = false;
    status.textContent = 'Spec Scout is ready. Configure AI model settings with your provider key to ask specification questions using the embedded, cited excerpts. Responses are informational, not conformance certification.';
  } catch {
    root.hidden = true;
    status.setAttribute('role', 'alert');
    status.dataset.state = 'error';
    status.textContent = 'Spec Scout could not be loaded. Serve this site over HTTP or HTTPS, check that its runtime, agent-manifest.json, and network definition are available and valid, and reload.';
  }
}

await mountScout();
