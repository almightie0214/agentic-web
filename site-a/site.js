const root = document.querySelector('#agent-app');
const status = document.querySelector('#site-status');

async function mountShell() {
  try {
    // Match boot's credential hygiene: inference settings never come from a URL.
    const params = new URLSearchParams(location.search);
    if (params.has('key')) {
      params.delete('key');
      const query = params.toString();
      history.replaceState(null, '', location.pathname + (query ? `?${query}` : '') + location.hash);
    }

    const [{ Engine, TraceBus, mountApp }, { getSelectedByokProfile, loadTabByokSetup }] = await Promise.all([
      import('./runtime/index.js'),
      import('./runtime/byok.js'),
    ]);
    const setup = loadTabByokSetup(getSelectedByokProfile());
    const trace = new TraceBus();
    const engine = new Engine({
      originUrl: new URL('./', import.meta.url).href,
      sandboxWorkerUrl: new URL('./runtime/sandbox-worker.js', import.meta.url).href,
      trace,
      byokKey: setup.key,
      routerOverride: setup.router,
      modelOverride: setup.model,
    });

    // Mount the built-in settings without loading a network. Chat stays disabled
    // because this shell has no validated network to execute.
    mountApp(root, { engine, trace });
    const input = root.querySelector('#ns-input');
    input.disabled = true;
    input.placeholder = 'Chat will be available when the network is connected.';
    root.querySelector('#ns-send').disabled = true;
    root.hidden = false;
    status.textContent = 'Network not connected yet. You can configure AI model settings; chat and agent inspection are unavailable until the network is published.';
  } catch {
    root.hidden = true;
    status.setAttribute('role', 'alert');
    status.dataset.state = 'error';
    status.textContent = 'The settings and chat interface could not be loaded. Serve this site over HTTP or HTTPS, check that its runtime files are available, and reload.';
  }
}

await mountShell();
