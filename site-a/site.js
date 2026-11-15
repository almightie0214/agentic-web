const root = document.querySelector('#agent-app');
const status = document.querySelector('#site-status');

async function mountDesk() {
  try {
    const { boot } = await import('./runtime/index.js');
    await boot(root, {
      originUrl: new URL('./', import.meta.url).href,
      sandboxWorkerUrl: new URL('./runtime/sandbox-worker.js', import.meta.url).href,
    });
    root.hidden = false;
    status.textContent = 'Review Desk is ready. Configure AI model settings with your provider key to start chatting. No website actions are connected.';
  } catch {
    root.hidden = true;
    status.setAttribute('role', 'alert');
    status.dataset.state = 'error';
    status.textContent = 'Review Desk could not be loaded. Serve this site over HTTP or HTTPS, check that its runtime, agent-manifest.json, and network definition are available and valid, and reload.';
  }
}

await mountDesk();
