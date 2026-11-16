// Pure CVT network emission. Public-text sanitation belongs to parseRoles.
import { describeLayout } from './describe-layout.mjs';

// CVT-NET-005: append after the sanitized source, according to the selected front.
const outputRules = {
  front: 'Return only the final answer intended for the visitor. Do not include drafts, plans, process notes, or messages addressed to other roles.',
  specialist: 'Return only the answer to the inquiry you received. Do not include drafts, plans, process notes, or messages addressed to other roles.',
};
function fail(rule) {
  // Never include rejected front values or source text in diagnostics.
  throw new Error(`${rule}: invalid converter input.`);
}

/**
 * Emit from parseRoles' sanitized IR without mutating it or the options.
 * @param {{roles: {name: string, description: string, instructions: string, tools?: string[]}[], configFront?: string, layout: 'theora'|'markdown'|'adk'}} parsed
 * @param {{front?: string}} options Explicit front overrides config except for ADK's fixed root.
 * @returns {{network: object, frontMan: string}} Selected front is also used by the manifest emitter.
 */
export function emitNetwork(parsed, options = {}) {
  if (!parsed || !Array.isArray(parsed.roles) || !parsed.roles.length) fail('CVT-IR-001');
  if (!options || typeof options !== 'object' || Array.isArray(options)) fail('CVT-FRONT-001');

  const names = new Set();
  const roles = Array.from(parsed.roles, (role) => {
    if (!role || typeof role.name !== 'string' || !role.name
      || typeof role.description !== 'string' || !role.description.trim()
      || typeof role.instructions !== 'string' || !role.instructions.trim()
      || names.has(role.name.toLowerCase())) fail('CVT-IR-001');
    names.add(role.name.toLowerCase());
    return role;
  }).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);

  // Validate even an overridden config candidate; no invalid candidate falls back.
  for (const candidate of [parsed.configFront, options.front]) {
    if (candidate !== undefined && (typeof candidate !== 'string'
      || !roles.some(({ name }) => name === candidate))) fail('CVT-FRONT-001');
  }
  const description = describeLayout(parsed.layout);
  if (parsed.layout === 'adk') {
    if (parsed.configFront === undefined || (options.front !== undefined && options.front !== parsed.configFront)) {
      fail('CVT-FRONT-001');
    }
    for (const role of roles) {
      if (!Array.isArray(role.tools) || new Set(role.tools).size !== role.tools.length
        || role.tools.some((name) => name === role.name || !roles.some((candidate) => candidate.name === name))) {
        fail('CVT-IR-001');
      }
    }
  }
  const frontMan = options.front ?? parsed.configFront ?? roles[0].name;
  const others = roles.filter(({ name }) => name !== frontMan);
  const front = roles.find(({ name }) => name === frontMan);

  const network = {
    metadata: { description },
    llm_config: { model_name: 'alibaba/qwen3.8-flash', temperature: 0.2 },
    max_steps: 12,
    max_execution_seconds: 90,
    tools: [front, ...others].map((role) => ({
      name: role.name,
      function: {
        description: role.description,
        parameters: {
          type: 'object',
          properties: {
            inquiry: { type: 'string', description: 'The request to handle.' },
          },
          required: ['inquiry'],
          additionalProperties: false,
        },
      },
      instructions: `${role.instructions}\n\n## Converter-owned output rule\n${outputRules[role.name === frontMan ? 'front' : 'specialist']}`,
      tools: parsed.layout === 'adk' ? [...role.tools] : role.name === frontMan ? others.map(({ name }) => name) : [],
    })),
  };
  return { network, frontMan };
}
