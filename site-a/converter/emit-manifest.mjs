// Pure CVT publication emission. Public-text sanitation belongs to parseRoles.
import { describeLayout } from './describe-layout.mjs';
/**
 * Emit publication data using emitNetwork's selected, sanitized frontMan.
 * Front selection and role membership validation stay in emitNetwork.
 * @param {string} frontMan Selected role name, unchanged.
 * @param {'theora'|'markdown'|'adk'} layout Input format selected by parseRoles.
 * @returns {{manifest: object, links: object}} Fresh data for agent-manifest.json and links.json.
 */
export function emitManifest(frontMan, layout) {
  if (typeof frontMan !== 'string' || !/^[A-Za-z][A-Za-z0-9_]{0,59}(?![\s\S])/.test(frontMan)) {
    // Do not disclose rejected values in publication diagnostics.
    throw new Error('CVT-MAN-001: invalid converter input.');
  }

  const description = describeLayout(layout);
  return {
    manifest: {
      brand: 'Converted Role Team',
      networks: [{
        name: 'converted_team',
        front_man: frontMan,
        hocon: './converted_team.network.json',
        description,
      }],
      llm_router: {
        base_url: 'https://api.otari.ai/api/v1',
        mock: false,
        byok_router: 'https://api.otari.ai/api/v1',
      },
      allowed_peers: [],
      peer_policy: { mode: 'closed' },
      deployment: { mode: 'static' },
    },
    links: {
      version: 1,
      networks: { converted_team: {} },
    },
  };
}
