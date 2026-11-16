import { lstat, readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join, parse, sep } from 'node:path';
import { parseRoles } from '../../site-a/converter/parse-roles.mjs';
import { emitNetwork } from '../../site-a/converter/emit-network.mjs';
import { emitManifest } from '../../site-a/converter/emit-manifest.mjs';

const usage = 'Usage: node tools/theora2hocon/theora2hocon.mjs <input-dir> <out-dir> [--front <role>] [--layout theora|markdown]';

function argumentsFor(argv) {
  const directories = [];
  const options = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--front' || arg === '--layout') {
      const key = arg.slice(2);
      if (Object.hasOwn(options, key) || !argv[i + 1] || argv[i + 1].startsWith('-')) {
        throw new Error('Invalid option.');
      }
      options[key] = argv[++i];
    } else if (arg.startsWith('-') || !arg) {
      throw new Error('Invalid argument.');
    } else {
      directories.push(arg);
    }
  }
  if (directories.length !== 2 || (options.layout !== undefined && !['theora', 'markdown'].includes(options.layout))) {
    throw new Error('Invalid arguments.');
  }
  return { input: resolve(directories[0]), output: resolve(directories[1]), options };
}

// Inspect each directory before descending. Symlink entries are never selected,
// including a symlink used as the input root or one of its ancestors.
async function inputRoot(input) {
  const root = parse(input).root;
  let current = root;
  for (const component of input.slice(root.length).split(sep).filter(Boolean)) {
    current = join(current, component);
    if (!(await lstat(current)).isDirectory()) throw new Error('Input must be a directory.');
  }
  return input;
}

async function directory(parent, name) {
  const path = join(parent, name);
  try {
    return (await lstat(path)).isDirectory() ? path : undefined;
  } catch (error) {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  }
}

async function filesIn(path) {
  if (path === undefined) return [];
  return readdir(path, { withFileTypes: true });
}

async function acquire(input, requestedLayout) {
  const root = await inputRoot(input);
  const files = [];
  const decoder = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });
  const read = async (path, virtualPath) => {
    files.push({ path: virtualPath, content: decoder.decode(await readFile(path)) });
  };

  // Discover only exact role paths, without reading their content or any state.
  const theora = requestedLayout === 'markdown' ? undefined : await directory(root, '.theora');
  const rolesDir = theora && await directory(theora, 'roles');
  const roleFiles = [];
  for (const entry of await filesIn(rolesDir)) {
    if (!entry.isDirectory()) continue;
    const path = join(rolesDir, entry.name, 'agent.md');
    try {
      if ((await lstat(path)).isFile()) roleFiles.push({ path, name: entry.name });
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  const layout = requestedLayout ?? (roleFiles.length ? 'theora' : 'markdown');
  if (layout === 'theora') {
    for (const { path, name } of roleFiles) await read(path, `.theora/roles/${name}/agent.md`);
    const configDir = theora && await directory(theora, 'config');
    if (configDir) {
      const config = join(configDir, 'theora.json');
      try {
        if ((await lstat(config)).isFile()) await read(config, '.theora/config/theora.json');
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }
  } else {
    const claude = await directory(root, '.claude');
    const agents = claude && await directory(claude, 'agents');
    const claudeFiles = (await filesIn(agents)).filter(entry => entry.isFile() && entry.name.endsWith('.md'));
    const selected = claudeFiles.length ? claudeFiles : (await filesIn(root)).filter(entry => entry.isFile() && entry.name.endsWith('.md'));
    for (const entry of selected) {
      await read(join(claudeFiles.length ? agents : root, entry.name),
        `${claudeFiles.length ? '.claude/agents/' : ''}${entry.name}`);
    }
  }
  return { files, layout };
}

try {
  const { input, output, options } = argumentsFor(process.argv.slice(2));
  const { files, layout } = await acquire(input, options.layout);
  const parsed = parseRoles(files, { layout });
  const { network, frontMan } = emitNetwork(parsed, { front: options.front });
  const { manifest, links } = emitManifest(frontMan);
  // Complete parsing, mapping and serialization before creating output files.
  const artifacts = [
    ['converted_team.network.json', network],
    ['agent-manifest.json', manifest],
    ['links.json', links],
  ].map(([name, value]) => [name, JSON.stringify(value, null, 2) + '\n']);
  await mkdir(output, { recursive: true });
  for (const [name, content] of artifacts) await writeFile(join(output, name), content, 'utf8');
  console.log('Wrote converted_team.network.json, agent-manifest.json, and links.json. Review all artifacts before publication; deployment and browser behavior are not verified.');
} catch {
  // Native filesystem and decoder errors can disclose host paths or source text.
  console.error(`CVT-CLI-001: conversion failed. Check arguments, selected UTF-8 input, mapping, and output permissions.\n${usage}`);
  process.exitCode = 1;
}
