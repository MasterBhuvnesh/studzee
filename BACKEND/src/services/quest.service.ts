import { prisma } from '@/config'
import { Badge } from '@/models/gamification'
import { CreateQuestSchema, TQuestResponses } from '@/models/quest.validation'
import { Streaks, recordActivityAndAward } from '@/services/progress.service'
import { AppError } from '@/types/errors'
import logger from '@/utils/logger'

/**
 * QUEST SERVICE
 *
 * Quests are limited time challenges paying gems once per user. Storage is
 * Postgres beside the tracker tables; contentId points into Mongo when a quest
 * is tied to a document. Awarding goes through the shared
 * recordActivityAndAward path, so completing a quest counts for streaks and
 * badges exactly like a quiz attempt does. Quest completions are never
 * QuizAttempts, so attempt count badges stay unaffected by them.
 */

/**
 * Payload shape stored on graded quests. Choice questions carry options plus
 * ans holding the answer text; fill_blank questions carry answer text.
 */
interface QuestPayload {
  passScore?: number
  questions?: {
    key: string
    que?: string
    options?: string[]
    ans?: string
    answer?: string
  }[]
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

/** Client response sheets arrive validated but loosely typed. */
const toResponses = (body: unknown): TQuestResponses => {
  if (body && typeof body === 'object') {
    const responses = (body as { responses?: unknown }).responses
    if (responses && typeof responses === 'object') {
      return responses as TQuestResponses
    }
  }
  return {}
}

export interface ActiveQuest {
  id: string
  title: string
  description: string
  type: string
  gems: number
  contentId: string | null
  /** Minimum score the submission must reach for the gems, 0 for read quests */
  passScore: number
  /** Sanitized questions without answers, empty for read_blog quests */
  questions: { key: string; que: string; options?: string[] }[]
  startsAt: string
  endsAt: string
  completed: boolean
}

/**
 * Every live quest for the caller, including ones already completed inside
 * their window so the client can render history without a second endpoint.
 */
export const listActiveQuests = async (
  userId: string
): Promise<ActiveQuest[]> => {
  const now = new Date()

  const quests = await prisma.quest.findMany({
    where: {
      active: true,
      startsAt: { lte: now },
      endsAt: { gt: now },
    },
    orderBy: { endsAt: 'asc' },
  })

  const completions =
    quests.length > 0
      ? await prisma.questCompletion.findMany({
          where: { userId, questId: { in: quests.map((quest) => quest.id) } },
          select: { questId: true },
        })
      : []
  const completedIds = new Set(completions.map((row) => row.questId))

  return quests.map((quest) => ({
    id: quest.id,
    title: quest.title,
    description: quest.description,
    type: quest.type,
    gems: quest.gems,
    contentId: quest.contentId,
    // Questionable payloads are sanitized for the list: the client needs the
    // questions to render the quest, but answers stay server side so the
    // grading in completeQuest cannot be gamed from the client.
    passScore: getPassScore(quest.payload),
    questions: getPublicQuestions(quest.payload),
    startsAt: quest.startsAt.toISOString(),
    endsAt: quest.endsAt.toISOString(),
    completed: completedIds.has(quest.id),
  }))
}

interface StoredPayload {
  passScore?: number
  questions?: { key: string; que: string; options?: string[]; ans?: string }[]
}

const getPassScore = (payload: unknown): number => {
  const parsed = payload as StoredPayload | null
  return parsed?.passScore ?? 0
}

/** Questions without the answer field, safe to send to clients. */
const getPublicQuestions = (
  payload: unknown
): { key: string; que: string; options?: string[] }[] => {
  const parsed = payload as StoredPayload | null
  return (parsed?.questions ?? []).map(({ key, que, options }) => ({
    key,
    que,
    ...(options ? { options } : {}),
  }))
}

export interface CompletionOutcome {
  /** Set when the caller had already completed this quest before. */
  alreadyCompleted?: boolean
  passed?: boolean
  score?: number
  total?: number
  gemsAwarded: number
  totalPoints?: number
  streak?: Streaks
  newBadges?: Pick<Badge, 'key' | 'label' | 'description'>[]
}

/**
 * Attempt one quest completion. Graded quests pay nothing below passScore,
 * which still answers 200 with passed false so the client can show a retry
 * screen rather than an error.
 */
export const completeQuest = async (
  userId: string,
  questId: string,
  body: unknown
): Promise<CompletionOutcome> => {
  const quest = await prisma.quest.findUnique({ where: { id: questId } })

  if (!quest) {
    throw appError(404, 'Quest not found')
  }

  // An admin withdrawn quest and one whose window closed behave identically:
  // the caller can no longer complete it.
  const now = new Date()
  if (!quest.active || now < quest.startsAt || now > quest.endsAt) {
    throw appError(
      409,
      'This quest is no longer accepting completions',
      'QUEST_ENDED'
    )
  }

  const existing = await prisma.questCompletion.findUnique({
    where: { userId_questId: { userId, questId } },
  })
  if (existing) {
    return { alreadyCompleted: true, gemsAwarded: 0 }
  }

  if (quest.type === 'read_blog') {
    return awardQuest(userId, quest.id, quest.gems)
  }

  const payload = (quest.payload ?? {}) as QuestPayload
  const questions = Array.isArray(payload.questions) ? payload.questions : []
  const responses = toResponses(body)

  let score = 0
  for (const question of questions) {
    if (quest.type === 'fill_blank') {
      // Free text compares case insensitively after trimming, so stray
      // whitespace or capitalisation cannot fail a correct answer.
      const expected = String(question.answer ?? '')
        .trim()
        .toLowerCase()
      const given = String(responses[question.key] ?? '')
        .trim()
        .toLowerCase()
      if (expected !== '' && given === expected) score += 1
    } else {
      // Same rule as the quiz grader: the chosen option's text must equal ans.
      const index = responses[question.key]
      if (
        typeof index === 'number' &&
        Number.isInteger(index) &&
        question.options?.[index] === question.ans
      ) {
        score += 1
      }
    }
  }
  const total = questions.length

  // A payload missing passScore would be an admin data bug; requiring every
  // question correct is the safe reading rather than passing anyone.
  const passScore = payload.passScore ?? total

  if (score < passScore) {
    logger.debug(
      { userId, questId, score, total },
      'Quest submission did not reach pass score'
    )
    return { passed: false, score, total, gemsAwarded: 0 }
  }

  return awardQuest(userId, quest.id, quest.gems, { score, total })
}

const awardQuest = async (
  userId: string,
  questId: string,
  gems: number,
  grading?: { score: number; total: number }
): Promise<CompletionOutcome> => {
  const summary = await recordActivityAndAward(userId, gems)

  // Written after the award so a crash between the two leaves the caller
  // under credited rather than double paid on a retry.
  await prisma.questCompletion.create({
    data: { userId, questId, gemsAwarded: gems },
  })

  logger.debug({ userId, questId, gems }, 'Quest completed and gems awarded')

  return {
    passed: true,
    ...(grading ?? {}),
    gemsAwarded: gems,
    totalPoints: summary.totalPoints,
    streak: summary.streak,
    newBadges: summary.newBadges,
  }
}

/**
 * Admin side create. Parses defensively even though the route validates first:
 * the seeder and future callers go straight through this function.
 */
export const createQuest = async (input: unknown) => {
  const parsed = CreateQuestSchema.safeParse(input)
  if (!parsed.success) {
    throw appError(400, 'Invalid quest data')
  }

  const { title, description, type, gems, active, startsAt, endsAt } =
    parsed.data
  return prisma.quest.create({
    data: {
      title,
      description,
      type,
      gems,
      contentId: parsed.data.contentId ?? null,
      ...(parsed.data.payload !== undefined
        ? { payload: parsed.data.payload as object }
        : {}),
      active,
      startsAt,
      endsAt,
    },
  })
}

/** Full quest list for the admin console, newest first. */
export const listAllQuests = async () => {
  return prisma.quest.findMany({ orderBy: { createdAt: 'desc' } })
}
