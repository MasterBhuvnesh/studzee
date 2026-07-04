// Confirmed 4096 from a live call (Mistral-7B-based embedding model).
// Convex vector indexes require this fixed at schema time (max 4096).
export const EMBED_MODEL = 'nvidia/nv-embedcode-7b-v1';
export const EMBED_DIM = 4096;

// How many top chunks to feed the chat as grounding context.
export const RAG_TOP_K = 6;
