import { config, redisClient } from '@/config'
import { TAskSupport } from '@/models/ai.validation'
import { chatText, ChatMessage } from '@/services/ai/client'
import { searchKnowledgeBase } from '@/services/ai/kb.service'
import { supportSystemPrompt } from '@/services/ai/prompts'
import { AppError } from '@/types/errors'
import logger from '@/utils/logger'

/**
 * SUPPORT AGENT
 *
 * Answers app questions from the knowledge base and nothing else. It has no
 * access to the asking user's account: no progress, no history, no email. That
 * is a deliberate limit, not a gap. An assistant that could read an account
 * would need per field authorisation and an audit trail before it could be
 * trusted with one, and answering "how do streaks work" needs neither.
 *
 * Two gates sit in front of the model, in this order:
 *
 *   1. A per user daily quota, because the HTTP rate limiter is per IP and
 *      resets in a minute, so it is not a spend ceiling.
 *   2. Retrieval. Nothing relevant in the corpus means the question is
 *      answered with a referral to email, without a model call at all.
 */

/** How many passages are put in front of the model. */
const RETRIEVAL_LIMIT = 5

/** Conversation turns kept from the client supplied history. */
const HISTORY_TURNS = 6

const REFERRAL =
  'I do not have anything on that in the Studzee help material, so I would ' +
  'rather not guess. Email studzee247@gmail.com and a person will pick it up. ' +
  'Support is open Monday to Friday, 9 AM to 6 PM IST.'

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

export interface SupportSource {
  heading: string | null
  /** Mongo document id when the passage came from study material. */
  contentId: string | null
}

export interface SupportAnswer {
  answer: string
  sources: SupportSource[]
  /** Questions the caller has left today, after this one. */
  remaining: number
}

/**
 * Count this question against the caller's daily allowance.
 *
 * Unlike the read caches, this fails closed when Redis is unavailable. The
 * cache doctrine elsewhere in the service is that a miss is cheap and nothing
 * should break when Redis is down; here a miss means the spend ceiling is
 * gone, which is not cheap against a 550B model. Redis is a required
 * dependency checked by the readiness probe, so this is an outage path rather
 * than a normal one.
 */
const consumeQuota = async (clerkId: string): Promise<number> => {
  // UTC rather than local, matching how DailyActivity and streaks are counted,
  // so a user's quota day and their streak day are the same day.
  const day = new Date().toISOString().slice(0, 10)
  const key = `ai:support:quota:${clerkId}:${day}`

  let used: number
  try {
    used = await redisClient.incr(key)
    if (used === 1) {
      // Only on the first increment of the day, so a long conversation cannot
      // keep pushing the expiry out and leak the key.
      await redisClient.expire(key, 86_400)
    }
  } catch (error) {
    logger.error(error, 'Support quota check failed, refusing the request')
    throw appError(
      503,
      'Support chat is briefly unavailable. Please try again shortly.',
      'AI_QUOTA_UNAVAILABLE'
    )
  }

  if (used > config.AI_SUPPORT_DAILY_LIMIT) {
    throw appError(
      429,
      `You have reached today's limit of ${config.AI_SUPPORT_DAILY_LIMIT} ` +
        'support questions. Email studzee247@gmail.com if you need more help ' +
        'today.',
      'AI_QUOTA_EXCEEDED'
    )
  }

  return Math.max(0, config.AI_SUPPORT_DAILY_LIMIT - used)
}

/**
 * Answer one support question.
 *
 * History arrives from the client and is capped rather than trusted. It is
 * placed between the system prompt and the current question, so the retrieved
 * passages still sit in the system turn where the instruction to stay inside
 * them lives.
 */
export const answerSupportQuestion = async (
  clerkId: string,
  input: TAskSupport
): Promise<SupportAnswer> => {
  const remaining = await consumeQuota(clerkId)

  const passages = await searchKnowledgeBase(input.question, RETRIEVAL_LIMIT)

  if (passages.length === 0) {
    // No model call. An unanswerable question is the common case for anything
    // off topic, and paying for a refusal the prompt would have produced
    // anyway is waste.
    logger.info(
      { clerkId, questionLength: input.question.length },
      'Support question retrieved nothing, answered with the referral'
    )
    return { answer: REFERRAL, sources: [], remaining }
  }

  const history: ChatMessage[] = (input.history ?? [])
    .slice(-HISTORY_TURNS)
    .map((turn) => ({ role: turn.role, content: turn.content }))

  const answer = await chatText(
    [
      { role: 'system', content: supportSystemPrompt(passages) },
      ...history,
      { role: 'user', content: input.question },
    ],
    { temperature: 0.2, maxTokens: 600 }
  )

  // The question itself is never logged. Its length and the passages that
  // matched are enough to tell whether retrieval is working, and the question
  // is a user's own words.
  logger.info(
    {
      clerkId,
      questionLength: input.question.length,
      chunks: passages.map((passage) => passage.id),
    },
    'Support question answered'
  )

  return {
    answer,
    sources: dedupeSources(passages),
    remaining,
  }
}

/**
 * Passages the answer drew on, thinned to what a client can act on: a heading
 * to show, and a document id it can deep link into when the passage came from
 * study material rather than the help text.
 */
const dedupeSources = (
  passages: {
    heading: string | null
    source: string
    sourceId: string | null
  }[]
): SupportSource[] => {
  const seen = new Set<string>()
  const sources: SupportSource[] = []

  for (const passage of passages) {
    const identity = passage.sourceId ?? passage.heading ?? ''
    if (identity === '' || seen.has(identity)) continue
    seen.add(identity)
    sources.push({
      heading: passage.heading,
      contentId: passage.source === 'content' ? passage.sourceId : null,
    })
  }

  return sources
}
