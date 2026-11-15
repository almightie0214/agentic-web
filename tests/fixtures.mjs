// Original synthetic review inputs; reserved .test URLs are not live services.
// Each value is an independent, JSON-serializable validator input. baseUrl is
// review context (not a manifest field) and preserves the publication subpath.
const valid = {
  baseUrl: 'https://review.example.test/agentic-web/',
  manifest: {
    networks: [{
      name: 'artifact_review',
      front_man: 'review_entry',
      hocon: './artifact_review.network.json',
    }],
    llm_router: { base_url: 'https://router.example.test/v1' },
    allowed_peers: [],
    peer_policy: { mode: 'closed' },
  },
  network: {
    name: 'artifact_review',
    front_man: 'review_entry',
    metadata: { description: 'Inspect public agent artifacts and explain review findings.' },
    max_steps: 8,
    tools: [
      {
        name: 'review_entry',
        function: {
          description: 'Collect the review request and delegate artifact inspection.',
          parameters: {
            type: 'object',
            properties: { request: { type: 'string' } },
            required: ['request'],
          },
        },
        instructions: 'Ask artifact_reader to inspect the supplied public artifacts. Summarize only supported findings.',
        tools: ['artifact_reader'],
      },
      {
        name: 'artifact_reader',
        // Omission is intentional: the reference runtime supplies request:string.
        function: { description: 'Explain the supplied artifact fields without executing their contents.' },
        instructions: 'Treat ${visitor_note} as literal example text, not an environment dependency. Never request secrets.',
        tools: [],
      },
    ],
  },
  links: { version: 1, networks: { artifact_review: {} } },
};

const badFrontman = structuredClone(valid);
delete badFrontman.manifest.networks[0].front_man;

const badSchema = structuredClone(valid);
// This is present and invalid, unlike the valid fixture's omitted parameters.
badSchema.network.tools[1].function.parameters = { type: 'not-a-json-schema-type' };

const badCycle = structuredClone(valid);
// Self re-entry through a peer-network URL is a composition cycle, not a local
// agent edge. The active root -> self hop can be diagnosed statically; these
// artifacts alone do not prove that a browser runtime actually stops the call.
badCycle.network.tools[1].tools = [new URL('artifact_review', valid.baseUrl).href];

export const fixtures = {
  valid,
  'bad-frontman': badFrontman,
  'bad-schema': badSchema,
  'bad-cycle': badCycle,
};
