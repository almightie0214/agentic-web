// Both pages own and release their object URLs when the reviewed artifacts change.
export function artifactDownloads(container, input, { sources = {}, networkName } = {}) {
  const urls = [];
  const name = networkName ?? input.manifest?.networks?.[0]?.name;
  const networkFile = typeof name === 'string' && /^[a-zA-Z0-9_-]+$/.test(name)
    ? `${name}.network.json` : 'network.json';
  container.replaceChildren();
  for (const [key, filename] of [['network', networkFile], ['manifest', 'agent-manifest.json'], ['links', 'links.json']]) {
    if (input[key] === undefined) continue;
    const text = sources[key] ?? JSON.stringify(input[key], null, 2) + '\n';
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json;charset=utf-8' }));
    urls.push(url);
    const link = document.createElement('a');
    link.textContent = `Download ${filename}`;
    link.href = url;
    link.download = filename;
    container.append(link);
  }
  return () => {
    for (const url of urls.splice(0)) URL.revokeObjectURL(url);
    container.replaceChildren();
  };
}
