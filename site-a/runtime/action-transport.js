// Changed by agentic-web. See README.md in this folder for what changed.
import { assertActive } from "./scope.js";

export function sameOriginAsset(base, path) {
  const url = new URL(path, `${base.replace(/\/$/, "")}/`);
  if (!["http:", "https:"].includes(url.protocol) || url.origin !== new URL(base).origin || url.username || url.password) throw new Error("Action assets must belong to their publishing origin.");
  return url.href;
}
export async function loadActionModule(registry, scope, manifest) {
  if (!manifest.actions) return;
  if (new URL(scope.base).origin !== location.origin) throw new Error("Executable action adapters must run on their own origin.");
  if (manifest.actions.version !== 1) throw new Error("Unsupported action protocol.");
  const actions = { register: definition => registry.register(scope, definition) };
  for (const path of new Set([manifest.actions.module, ...(manifest.actions.modules || [])].filter(Boolean))) {
    const module = await import(sameOriginAsset(scope.base, path));
    if (typeof module.registerActions !== "function") throw new Error("Action modules must export registerActions.");
    await module.registerActions(actions);
  }
  if (!registry.catalog(scope).length) {
    registry.discoveryIssues.push({ ...scope, page: "Action sources", reason: "No website actions connected. Check the configured modules on the application origin." });
  }
}

export function reviewActions(items, { signal } = {}) {
  return new Promise((resolve, reject) => {
    assertActive(signal);
    let settled = false;
    const dialog = document.createElement("dialog");
    dialog.style.cssText = "max-width:640px;width:85%;max-height:85vh;overflow:auto;border:1px solid #888;border-radius:12px;padding:24px;font:16px system-ui";
    const heading = document.createElement("h2"); heading.textContent = "Review actions";
    // Enter on the initially focused heading cannot authorize an action.
    heading.tabIndex = -1; heading.autofocus = true;
    const details = document.createElement("pre"); details.style.cssText = "white-space:pre-wrap;overflow-wrap:anywhere";
    details.textContent = items.map(i => `${i.action} — ${i.origin} (${i.effect})\n${i.description || ""}\n${JSON.stringify(i.arguments, null, 2)}`).join("\n\n");
    const yes = document.createElement("button"); yes.textContent = "Confirm actions";
    const no = document.createElement("button"); no.textContent = "Cancel";
    const cleanup = () => { signal?.removeEventListener("abort", abort); dialog.close(); dialog.remove(); };
    const abort = () => {
      if (settled) return;
      settled = true; cleanup(); reject(signal.reason);
    };
    const finish = value => {
      try { assertActive(signal); } catch { abort(); return; }
      if (settled) return;
      settled = true; cleanup(); resolve(value);
    };
    yes.onclick = () => finish(true); no.onclick = () => finish(false);
    signal?.addEventListener("abort", abort, { once: true });
    dialog.addEventListener("cancel", event => { event.preventDefault(); finish(false); });
    dialog.append(heading, details, yes, no); document.body.append(dialog); dialog.showModal();
  });
}
