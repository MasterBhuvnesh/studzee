import { z } from 'zod'
import { config } from '@/config'
import { AppError } from '@/types/errors'
import logger from '@/utils/logger'

/**
 * AI CLIENT
 *
 * One thin wrapper over an OpenAI compatible endpoint, built on the global
 * fetch that Node 22 ships. No SDK is installed: chat completions and
 * embeddings are two POST bodies each, and an SDK would add a dependency to
 * save about forty lines while pinning us to one provider's release cadence.
 * Pointing AI_BASE_URL somewhere else is the whole of provider portability.
 *
 * Nothing here knows what it is generating. Callers supply the prompt and, for
 * structured output, the zod schema the reply has to satisfy.
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatOptions {
  /** Lower for structured extraction, higher for support prose. */
  temperature?: number
  maxTokens?: number
}

const appError = (
  statusCode: number,
  message: string,
  code?: string
): AppError => {
  const error: AppError = new Error(message)
  error.statusCode = statusCode
  error.code = code
  return error
}

/**
 * Every entry point checks this rather than the routes doing it, so a job, a
 * CLI tool and a controller all fail the same way when the layer is off.
 */
export const assertAiEnabled = (): void => {
  if (!config.AI_ENABLED) {
    throw appError(
      503,
      'The AI layer is disabled. Set AI_ENABLED=true and provide AI_API_KEY.',
      'AI_DISABLED'
    )
  }
}

/**
 * POST to the provider, mapping transport problems onto the status codes the
 * error handler already understands. The key is never logged or included in an
 * error message: a 401 from the provider surfaces as a plain upstream failure.
 */
const post = async <T>(path: string, body: unknown): Promise<T> => {
  assertAiEnabled()

  let response: Response
  try {
    response = await fetch(`${config.AI_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.AI_API_KEY}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(config.AI_TIMEOUT_MS),
    })
  } catch (error) {
    // A timeout and a DNS failure both land here. They are distinguished
    // because a timeout is worth retrying later and a DNS failure is not.
    const timedOut =
      error instanceof Error &&
      (error.name === 'TimeoutError' || error.name === 'AbortError')
    logger.error(
      { path, timedOut },
      'Model endpoint request failed before a response'
    )
    throw appError(
      timedOut ? 504 : 502,
      timedOut
        ? `The model did not respond within ${config.AI_TIMEOUT_MS}ms`
        : 'Could not reach the model endpoint',
      timedOut ? 'AI_TIMEOUT' : 'AI_UNREACHABLE'
    )
  }

  if (!response.ok) {
    // The body is read for the log only. It can carry provider side detail,
    // but it is not forwarded to the caller, which would leak endpoint
    // internals into an admin or user facing response.
    const detail = await response.text().catch(() => '')
    logger.error(
      { path, status: response.status, detail: detail.slice(0, 500) },
      'Model endpoint returned an error'
    )
    throw appError(
      502,
      `The model endpoint returned ${response.status}`,
      'AI_UPSTREAM'
    )
  }

  return (await response.json()) as T
}

interface ChatResponse {
  choices?: { message?: { content?: string } }[]
}

interface EmbeddingResponse {
  data?: { embedding?: number[] }[]
}

/**
 * Reasoning models emit a thinking block ahead of the answer, and chat models
 * habitually fence JSON even when asked not to. Both are stripped before the
 * text is parsed or returned, so neither reaches a draft or a support reply.
 */
/**
 * House style forbids em dashes, and models produce them constantly however
 * firmly the prompt says not to. Observed on the first live generation, so
 * this is a fix rather than a precaution: the prompt asks, and this enforces.
 *
 * Applied to the raw reply, before JSON parsing, which is safe because none of
 * these characters are structural in JSON and it means one pass covers every
 * generated field and every support answer rather than each caller
 * remembering. A dash used as punctuation becomes a comma, which is what the
 * style guide says to write instead; the doubled commas that leaves behind
 * where the model already had one are collapsed after.
 */
const normalisePunctuation = (text: string): string =>
  text
    // Non-breaking and figure hyphens are plain hyphens, not punctuation.
    .replace(/[\u2011\u2012]/g, '-')
    // Em dash, en dash, and the double hyphen used the same way.
    .replace(/\s*[\u2013\u2014]\s*|\s+--\s+/g, ', ')
    .replace(/,\s*,+/g, ', ')
    .replace(/\s+,/g, ',')

const stripModelScaffolding = (raw: string): string => {
  const withoutThinking = raw.replace(/<think>[\s\S]*?<\/think>/gi, '')
  const fenced = withoutThinking.match(/```(?:json)?\s*([\s\S]*?)```/i)
  return normalisePunctuation((fenced ? fenced[1] : withoutThinking).trim())
}

const completionText = (payload: ChatResponse): string => {
  const content = payload.choices?.[0]?.message?.content
  if (typeof content !== 'string' || content.trim() === '') {
    throw appError(502, 'The model returned an empty reply', 'AI_EMPTY')
  }
  return stripModelScaffolding(content)
}

/** Free text completion, used by the support agent. */
export const chatText = async (
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<string> => {
  const payload = await post<ChatResponse>('/chat/completions', {
    model: config.AI_MODEL,
    messages,
    temperature: options.temperature ?? 0.3,
    max_tokens: options.maxTokens ?? config.AI_MAX_TOKENS,
  })
  return completionText(payload)
}

type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string }

/**
 * Malformed JSON and a schema violation are the same failure to the caller:
 * both mean the reply is unusable and both are worth one retry with the reason
 * attached.
 */
const safeParseJson = <T>(
  raw: string,
  schema: z.ZodType<T>
): ParseResult<T> => {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, error: 'The reply was not valid JSON.' }
  }

  const result = schema.safeParse(parsed)
  if (result.success) return { ok: true, value: result.data }

  return {
    ok: false,
    error: result.error.issues
      .map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
      .join('; '),
  }
}

/**
 * Structured completion validated against a zod schema.
 *
 * This is the entire safety story for generation. The schema handed in is the
 * same one the matching admin route uses, so a value that survives this call
 * is already known to satisfy DocumentSchema or CreateQuestSchema and cannot
 * fail for shape reasons when the draft is later approved.
 *
 * One retry, and only one. The zod message is fed back as a user turn, which
 * fixes the common near misses: a missing field, a stringified number, one
 * option where the schema wanted at least two. A second failure means the
 * model is not going to produce this shape and looping would only spend money.
 */
export const chatJson = async <T>(
  messages: ChatMessage[],
  schema: z.ZodType<T>,
  options: ChatOptions = {}
): Promise<T> => {
  const body = {
    model: config.AI_MODEL,
    temperature: options.temperature ?? 0.2,
    max_tokens: options.maxTokens ?? config.AI_MAX_TOKENS,
    response_format: { type: 'json_object' as const },
  }

  const attempt = async (turns: ChatMessage[]) => {
    const payload = await post<ChatResponse>('/chat/completions', {
      ...body,
      messages: turns,
    })
    return completionText(payload)
  }

  const first = await attempt(messages)
  const firstParse = safeParseJson(first, schema)
  if (firstParse.ok) return firstParse.value

  logger.warn(
    { issues: firstParse.error },
    'Model output failed validation, retrying once with the errors fed back'
  )

  const retried = await attempt([
    ...messages,
    { role: 'assistant', content: first },
    {
      role: 'user',
      content:
        'That reply did not match the required schema. Fix exactly these ' +
        `problems and return only the corrected JSON object:\n${firstParse.error}`,
    },
  ])

  const secondParse = safeParseJson(retried, schema)
  if (secondParse.ok) return secondParse.value

  logger.error(
    { issues: secondParse.error },
    'Model output failed validation twice, giving up'
  )
  throw appError(
    502,
    'The model could not produce output in the required shape',
    'AI_INVALID_OUTPUT'
  )
}

/**
 * Embed a batch of passages. The dimension is checked against AI_EMBED_DIM
 * here rather than trusted, because a mismatch with the vector(n) column would
 * otherwise surface as an opaque Postgres error on every insert.
 */
export const embed = async (texts: string[]): Promise<number[][]> => {
  if (texts.length === 0) return []

  const payload = await post<EmbeddingResponse>('/embeddings', {
    model: config.AI_EMBED_MODEL,
    input: texts,
    // NVIDIA's retrieval models expect to be told which side of the pair they
    // are embedding. Providers that do not use the field ignore it.
    input_type: 'passage',
  })

  const vectors = (payload.data ?? []).map((row) => row.embedding ?? [])

  if (vectors.length !== texts.length) {
    throw appError(
      502,
      `Asked for ${texts.length} embeddings and got ${vectors.length}`,
      'AI_EMBED_COUNT'
    )
  }

  const wrong = vectors.find((vector) => vector.length !== config.AI_EMBED_DIM)
  if (wrong) {
    throw appError(
      500,
      `${config.AI_EMBED_MODEL} returns ${wrong.length} dimensions but ` +
        `AI_EMBED_DIM and the KbChunk column are ${config.AI_EMBED_DIM}. ` +
        'Change the model back or write a migration for the new dimension.',
      'AI_EMBED_DIM_MISMATCH'
    )
  }

  return vectors
}

/**
 * A question is embedded as a query rather than a passage. Retrieval models are
 * trained asymmetrically, so using the passage side for both halves measurably
 * degrades the match.
 */
export const embedQuery = async (text: string): Promise<number[]> => {
  const payload = await post<EmbeddingResponse>('/embeddings', {
    model: config.AI_EMBED_MODEL,
    input: [text],
    input_type: 'query',
  })

  const vector = payload.data?.[0]?.embedding
  if (!vector || vector.length !== config.AI_EMBED_DIM) {
    throw appError(
      502,
      'The embedding endpoint returned an unusable query vector',
      'AI_EMBED_QUERY'
    )
  }
  return vector
}
