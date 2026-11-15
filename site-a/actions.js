import { validateNetwork } from './validator-rules.mjs';

function parseArtifact(source, field) {
  try {
    return JSON.parse(source);
  } catch {
    // Do not echo submitted artifact contents in an action error.
    throw new SyntaxError(`Invalid JSON in ${field}. Supply a JSON-encoded artifact, not HOCON or a URL.`);
  }
}

// Loaded by the reference runtime through manifest.actions.module.
export function registerActions(actions) {
  actions.register({
    name: 'validate_network',
    description: 'Inspect supplied manifest and resolved network JSON with deterministic Review Desk rules. Returns valid and checks with ruleId, status, JSON Pointer path, message, and hint. Does not fetch URLs, run agents, or change data. Static results do not prove live readiness; preserve warnings and unverified observations when explaining the report.',
    effect: 'read',
    availability: 'local-only',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['manifest', 'network'],
      properties: {
        // The runtime action-schema subset cannot describe arbitrary JSON objects.
        manifest: {
          type: 'string',
          description: 'The complete agent-manifest.json encoded as a JSON string.',
        },
        network: {
          type: 'string',
          description: 'The complete resolved network definition encoded as a JSON string.',
        },
        links: {
          type: 'string',
          description: 'Optional links.json encoded as a JSON string for named peer bindings.',
        },
        networkName: {
          type: 'string',
          description: 'Exact manifest network name to inspect. Omit to inspect the first entry.',
        },
        baseUrl: {
          type: 'string',
          description: 'Publication site base URL including its subpath, without query or fragment; not the definition URL. Used for static peer identity checks only, never fetched.',
        },
        activePeerChain: {
          type: 'array',
          items: { type: 'string' },
          description: 'Currently active ancestor peer-network URLs, excluding the current network and completed calls. Omit if unknown.',
        },
      },
    },
    execute({ manifest, network, links, networkName, baseUrl, activePeerChain }) {
      return validateNetwork({
        manifest: parseArtifact(manifest, 'manifest'),
        network: parseArtifact(network, 'network'),
        ...(links === undefined ? {} : { links: parseArtifact(links, 'links') }),
        networkName,
        baseUrl,
        activePeerChain,
      });
    },
  });
}
