// Pure CVT network emission. Public-text sanitation belongs to parseRoles.
function fail(rule) {
  // Never include rejected front values or source text in diagnostics.
  throw new Error(`${rule}: invalid converter input.`);
}

/**
 * Emit from parseRoles' sanitized IR without mutating it or the options.
 * @param {{roles: {name: string, description: string, instructions: string}[], configFront?: string}} parsed
 * @param {{front?: string}} options Explicit front overrides the validated config candidate.
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
  const frontMan = options.front ?? parsed.configFront ?? roles[0].name;
  const others = roles.filter(({ name }) => name !== frontMan);
  const front = roles.find(({ name }) => name === frontMan);

  const network = {
    metadata: { description: 'Converted Markdown role conversation network.' },
    llm_config: { model_name: 'alibaba/qwen3.8-flash' },
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
      instructions: role.instructions,
      tools: role.name === frontMan ? others.map(({ name }) => name) : [],
    })),
  };
  return { network, frontMan };
}
