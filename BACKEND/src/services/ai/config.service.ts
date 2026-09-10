import { config, prisma } from '@/config'
import { AI_CHAT_MODELS, AiChatModel } from '@/models/ai.validation'
import { AppError } from '@/types/errors'
import logger from '@/utils/logger'

/**
 * AI CONFIG
 *
 * One global chat model every generation and support answer uses. The stored
 * row wins when it exists and names a model still on the allowlist; otherwise
 * the AI_MODEL environment default applies. That fallback order matters: a
 * fresh database behaves exactly like before this table existed, and a model
 * retired from the allowlist cannot brick generation, it just logs and falls
 * back until an admin picks a current one.
 */

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

const GLOBAL_ID = 'global'

const isAllowlisted = (value: string): value is AiChatModel =>
  (AI_CHAT_MODELS as readonly string[]).includes(value)

/** The model chat completions are sent to right now. */
export const resolveChatModel = async (): Promise<string> => {
  try {
    const row = await prisma.aiConfig.findUnique({
      where: { id: GLOBAL_ID },
    })
    if (row && isAllowlisted(row.chatModel)) {
      return row.chatModel
    }
    if (row) {
      logger.warn(
        { stored: row.chatModel },
        'Stored chat model is no longer allowlisted, falling back to AI_MODEL'
      )
    }
  } catch (error) {
    // Config reads happen on the generation hot path. A database wobble here
    // must not fail the generation when a perfectly good env default exists.
    logger.error(error, 'Could not read AiConfig, falling back to AI_MODEL')
  }
  return config.AI_MODEL
}

export interface AiConfigView {
  chatModel: string
  source: 'stored' | 'env'
  updatedBy: string | null
  updatedAt: string | null
  availableModels: readonly string[]
  defaultModel: string
}

/** What the admin Settings screen renders: the effective model plus the list. */
export const getAiConfig = async (): Promise<AiConfigView> => {
  const row = await prisma.aiConfig.findUnique({
    where: { id: GLOBAL_ID },
  })
  const effective =
    row && isAllowlisted(row.chatModel) ? row.chatModel : config.AI_MODEL
  return {
    chatModel: effective,
    source: row && isAllowlisted(row.chatModel) ? 'stored' : 'env',
    updatedBy: row?.updatedBy ?? null,
    updatedAt: row?.updatedAt.toISOString() ?? null,
    availableModels: AI_CHAT_MODELS,
    defaultModel: config.AI_MODEL,
  }
}

/** Store the admin's choice. The schema already constrains it to the list. */
export const updateAiConfig = async (
  chatModel: AiChatModel,
  updatedBy: string
) => {
  const row = await prisma.aiConfig.upsert({
    where: { id: GLOBAL_ID },
    create: { id: GLOBAL_ID, chatModel, updatedBy },
    update: { chatModel, updatedBy },
  })
  logger.info({ chatModel, updatedBy }, 'Chat model changed by admin')
  return row
}

export const assertValidChatModel = (
  value: string
): asserts value is AiChatModel => {
  if (!isAllowlisted(value)) {
    throw appError(400, `Unknown chat model: ${value}`)
  }
}
