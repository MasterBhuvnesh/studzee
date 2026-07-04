// NVIDIA NIM — OpenAI-compatible REST. Called with fetch from Convex actions
// (default runtime, no SDK, no "use node").

import { EMBED_MODEL } from './model/embeddings';

const NIM_BASE = 'https://integrate.api.nvidia.com/v1';
const CHAT_MODEL = 'nvidia/nemotron-3-ultra-550b-a55b';

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

function apiKey(): string {
  const key = process.env.NVIDIA_API_KEY;
  if (!key) {
    throw new Error(
      'NVIDIA_API_KEY is not set. Run: npx convex env set NVIDIA_API_KEY <key>'
    );
  }
  return key;
}

/** Non-streaming completion. Used for quiz + summary generation. */
export async function nimChat(
  messages: ChatMessage[],
  opts?: { maxTokens?: number; temperature?: number; enableThinking?: boolean }
): Promise<string> {
  const res = await fetch(`${NIM_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey()}`,
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages,
      temperature: opts?.temperature ?? 0.4,
      top_p: 0.95,
      max_tokens: opts?.maxTokens ?? 1024,
      stream: false,
      chat_template_kwargs: { enable_thinking: opts?.enableThinking ?? false },
    }),
  });
  if (!res.ok) {
    throw new Error(`NIM chat ${res.status}: ${await res.text()}`);
  }
  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? '';
}

/** Embed one or more strings. `input_type` distinguishes stored passages from queries. */
export async function nimEmbed(
  input: string[],
  inputType: 'query' | 'passage'
): Promise<number[][]> {
  const res = await fetch(`${NIM_BASE}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey()}`,
    },
    body: JSON.stringify({
      model: EMBED_MODEL,
      input,
      encoding_format: 'float',
      input_type: inputType,
      truncate: 'NONE',
    }),
  });
  if (!res.ok) throw new Error(`NIM embed ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return (json.data as { embedding: number[] }[]).map((d) => d.embedding);
}

/**
 * Streaming completion. Invokes onDelta for each token (content or reasoning),
 * and returns the fully accumulated text. Thinking is enabled for the tutor chat.
 */
export async function nimChatStream(
  messages: ChatMessage[],
  onDelta: (d: { content?: string; reasoning?: string }) => void | Promise<void>,
  opts?: { maxTokens?: number; temperature?: number }
): Promise<{ content: string; reasoning: string }> {
  const res = await fetch(`${NIM_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey()}`,
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages,
      temperature: opts?.temperature ?? 0.5,
      top_p: 0.95,
      max_tokens: opts?.maxTokens ?? 1500,
      stream: true,
      chat_template_kwargs: { enable_thinking: true },
    }),
  });
  if (!res.ok || !res.body) {
    throw new Error(`NIM stream ${res.status}: ${await res.text().catch(() => '')}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let content = '';
  let reasoning = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const t = line.trim();
      if (!t.startsWith('data:')) continue;
      const data = t.slice(5).trim();
      if (data === '[DONE]') continue;
      try {
        const delta = JSON.parse(data).choices?.[0]?.delta;
        if (!delta) continue;
        const c = delta.content as string | undefined;
        const r = delta.reasoning_content as string | undefined;
        if (c) content += c;
        if (r) reasoning += r;
        if (c || r) await onDelta({ content: c, reasoning: r });
      } catch {
        // partial/non-JSON keepalive line — ignore
      }
    }
  }
  return { content, reasoning };
}

export type AiQuestion = {
  question: string;
  options: string[];
  answerIndex: number;
};

/**
 * Extract a strict quiz array from an LLM response, tolerating stray prose.
 * Throws on anything it cannot trust — the action surfaces that as an error.
 */
export function parseQuiz(raw: string): AiQuestion[] {
  const start = raw.indexOf('[');
  const end = raw.lastIndexOf(']');
  if (start === -1 || end === -1 || end < start) {
    throw new Error('AI did not return a JSON array');
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.slice(start, end + 1));
  } catch {
    throw new Error('AI returned invalid JSON');
  }
  if (!Array.isArray(parsed)) throw new Error('AI returned a non-array');

  const out: AiQuestion[] = parsed.map((q, i) => {
    const item = q as Record<string, unknown>;
    if (
      !item ||
      typeof item.question !== 'string' ||
      !Array.isArray(item.options) ||
      item.options.length < 2 ||
      typeof item.answerIndex !== 'number'
    ) {
      throw new Error(`Malformed question at index ${i}`);
    }
    const options = item.options.map(String).slice(0, 4);
    const answerIndex = Math.max(
      0,
      Math.min(options.length - 1, Math.floor(item.answerIndex))
    );
    return { question: item.question, options, answerIndex };
  });

  if (out.length === 0) throw new Error('No questions produced');
  return out.slice(0, 5);
}
