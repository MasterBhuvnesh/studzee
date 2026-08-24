import { prisma } from '@/config'
import { DocumentModel } from '@/models/document.model'
import {
  BADGES,
  Badge,
  evaluateBadges,
  findBadge,
  LevelSummary,
  resolveLevel,
  resolveNextLevel,
} from '@/models/gamification'
import { AppError } from '@/types/errors'
import logger from '@/utils/logger'

/**
 * Points per correct answer. An attempt only pays the delta above the user's
 * previous best on the same content, so replaying a quiz cannot farm points.
 */
const POINTS_PER_CORRECT = 10

/** How many recent attempts the profile read side returns. */
const RECENT_ATTEMPT_LIMIT = 10

const notFoundError = (message: string): AppError => {
  const error: AppError = new Error(message)
  error.statusCode = 404
  return error
}

interface RawQuizItem {
  que: string
  ans: string
  options?: string[]
}

/**
 * The quiz path is a Mongoose Map, which .lean() may hand back either as a Map
 * instance or as a plain object depending on version and options. Normalising
 * here keeps grading independent of that choice.
 */
const toQuizEntries = (quiz: unknown): [string, RawQuizItem][] => {
  if (quiz instanceof Map) return [...quiz.entries()] as [string, RawQuizItem][]
  if (quiz && typeof quiz === 'object')
    return Object.entries(quiz) as [string, RawQuizItem][]
  return []
}

export interface Streaks {
  current: number
  longest: number
}

/**
 * Pure streak arithmetic over distinct UTC day keys, sorted ascending.
 *
 * current walks back day by day from today or, when today has no row yet
 * because the attempt in progress is the first one today, from yesterday. A
 * single missing day breaks the chain. longest is the best run anywhere in
 * history, so it never regresses.
 */
export const computeStreaks = (dayKeys: string[]): Streaks => {
  const days = [...new Set(dayKeys)].sort()
  if (days.length === 0) return { current: 0, longest: 0 }

  const DAY_MS = 24 * 60 * 60 * 1000
  const toTime = (key: string) => Date.parse(`${key}T00:00:00.000Z`)
  const shiftKey = (key: string, deltaDays: number) =>
    new Date(toTime(key) + deltaDays * DAY_MS).toISOString().slice(0, 10)

  let longest = 1
  let run = 1
  for (let i = 1; i < days.length; i++) {
    const gap = Math.round((toTime(days[i]) - toTime(days[i - 1])) / DAY_MS)
    run = gap === 1 ? run + 1 : 1
    if (run > longest) longest = run
  }

  const todayKey = new Date().toISOString().slice(0, 10)
  const last = days[days.length - 1]
  let current = 0
  if (last === todayKey || last === shiftKey(todayKey, -1)) {
    current = 1
    let cursor = last
    for (let i = days.length - 2; i >= 0; i--) {
      const expected = shiftKey(cursor, -1)
      if (days[i] !== expected) break
      current += 1
      cursor = days[i]
    }
  }

  return { current, longest }
}

export interface AttemptResult {
  contentId: string
  score: number
  total: number
  pointsAwarded: number
  totalPoints: number
  streak: Streaks
  newBadges: Pick<Badge, 'key' | 'label' | 'description'>[]
}

/**
 * Grade a quiz submission and record everything the tracker derives from it.
 *
 * Grading compares the chosen option's text against ans, matching how quiz
 * documents store answers: ans holds the answer text, conventionally also at
 * options[0]. Unknown response keys are ignored rather than penalised.
 */
export const gradeAndRecordAttempt = async (
  userId: string,
  contentId: string,
  responses: Record<string, number>
): Promise<AttemptResult> => {
  const document = await DocumentModel.findById(contentId)
    .select('title quiz')
    .lean()

  if (!document) {
    throw notFoundError('Content not found')
  }

  const quizEntries = toQuizEntries(
    (document as { quiz?: unknown }).quiz
  ).filter(([, item]) => item && Array.isArray(item.options))

  if (quizEntries.length === 0) {
    throw notFoundError('This content has no quiz to attempt')
  }

  let score = 0
  for (const [key, item] of quizEntries) {
    const chosenIndex = responses[key]
    if (chosenIndex !== undefined && item.options?.[chosenIndex] === item.ans) {
      score += 1
    }
  }
  const total = quizEntries.length

  // Prior best drives the points delta: improvement pays the difference over
  // what earlier attempts on this content already earned, anything else pays 0.
  const priorBest = await prisma.quizAttempt.findFirst({
    where: { userId, contentId },
    orderBy: { score: 'desc' },
  })

  const pointsAwarded = Math.max(
    0,
    POINTS_PER_CORRECT * score - POINTS_PER_CORRECT * (priorBest?.score ?? 0)
  )

  // A perfect prior attempt implies this content was fully scored before, so
  // the perfectionist badge must not depend on beating your own best.
  const hasPerfectAttempt =
    total > 0 &&
    (score === total ||
      (priorBest != null && priorBest.score === priorBest.total))

  const todayUtc = new Date(
    Date.UTC(
      new Date().getUTCFullYear(),
      new Date().getUTCMonth(),
      new Date().getUTCDate()
    )
  )

  // Every read happens before the transaction so the interactive window only
  // carries the four writes it needs. Against a pooled remote Postgres the
  // default 5s budget is easily spent by latency alone when reads sit inside,
  // which is exactly how this used to fail.
  const [priorAttemptsCount, ownedBadges, activity] = await Promise.all([
    prisma.quizAttempt.count({ where: { userId } }),
    prisma.awardedBadge.findMany({
      where: { userId },
      select: { badgeKey: true },
    }),
    prisma.dailyActivity.findMany({
      where: { userId },
      select: { date: true },
      orderBy: { date: 'asc' },
    }),
  ])

  const dayKeys = activity.map((row) => row.date.toISOString().slice(0, 10))
  const todayKey = todayUtc.toISOString().slice(0, 10)
  const streaks = computeStreaks([...dayKeys, todayKey])

  const existingProgress = await prisma.userProgress.findUnique({
    where: { userId },
  })
  const totalPoints = (existingProgress?.points ?? 0) + pointsAwarded
  const longestStreak = Math.max(
    streaks.longest,
    existingProgress?.longestStreak ?? 0
  )

  const attemptCount = priorAttemptsCount + 1
  const ownedKeys = new Set(ownedBadges.map((badge) => badge.badgeKey))
  const deservedKeys = evaluateBadges({
    attemptCount,
    longestStreak,
    totalPoints,
    hasPerfectAttempt,
  })
  const newKeys = deservedKeys.filter((key) => !ownedKeys.has(key))

  const recorded = await prisma.$transaction(
    async (tx) => {
      await tx.quizAttempt.create({
        data: { userId, contentId, score, total, pointsAwarded },
      })

      await tx.dailyActivity.upsert({
        where: { userId_date: { userId, date: todayUtc } },
        create: { userId, date: todayUtc },
        update: {},
      })

      await tx.userProgress.upsert({
        where: { userId },
        create: {
          userId,
          points: totalPoints,
          currentStreak: streaks.current,
          longestStreak,
        },
        update: {
          points: { increment: pointsAwarded },
          currentStreak: streaks.current,
          longestStreak,
        },
      })

      if (newKeys.length > 0) {
        // skipDuplicates keeps a concurrent attempt from failing on the
        // unique (userId, badgeKey) pair; both sides awarding is harmless.
        await tx.awardedBadge.createMany({
          data: newKeys.map((badgeKey) => ({ userId, badgeKey })),
          skipDuplicates: true,
        })
      }

      return { totalPoints, streaks, newKeys }
    },
    { timeout: 15000, maxWait: 10000 }
  )

  logger.debug(
    { userId, contentId, score, total, pointsAwarded },
    'Quiz attempt graded and recorded'
  )

  return {
    contentId,
    score,
    total,
    pointsAwarded,
    totalPoints: recorded.totalPoints,
    streak: recorded.streaks,
    newBadges: recorded.newKeys.flatMap((key) => {
      const badge = findBadge(key)
      return badge
        ? [
            {
              key: badge.key,
              label: badge.label,
              description: badge.description,
            },
          ]
        : []
    }),
  }
}

export interface MyProgress {
  points: number
  level: LevelSummary | null
  nextLevel: LevelSummary | null
  streak: Streaks
  activeDays: number
  badges: {
    key: string
    label: string
    description: string
    awardedAt: string
  }[]
  allBadges: {
    key: string
    label: string
    description: string
    threshold: number
    awarded: boolean
  }[]
  recentAttempts: {
    contentId: string
    title: string
    score: number
    total: number
    createdAt: string
  }[]
}

/**
 * Read side of the tracker: aggregates every counter the profile screen needs
 * in one round of queries. Titles come from Mongo because attempts only store
 * the content id.
 */
export const getMyProgress = async (userId: string): Promise<MyProgress> => {
  const [progress, activeDays, ownedBadges, attempts] = await Promise.all([
    prisma.userProgress.findUnique({ where: { userId } }),
    prisma.dailyActivity.count({ where: { userId } }),
    prisma.awardedBadge.findMany({
      where: { userId },
      orderBy: { awardedAt: 'asc' },
    }),
    prisma.quizAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: RECENT_ATTEMPT_LIMIT,
    }),
  ])

  const titleRows =
    attempts.length > 0
      ? await DocumentModel.find({
          _id: { $in: attempts.map((attempt) => attempt.contentId) },
        })
          .select('title')
          .lean()
      : []

  const titleById = new Map<string, string>()
  for (const row of titleRows as { _id: unknown; title?: string }[]) {
    titleById.set(String(row._id), row.title ?? '')
  }

  const ownedKeys = new Set(ownedBadges.map((badge) => badge.badgeKey))
  const points = progress?.points ?? 0
  const level = resolveLevel(points)

  return {
    points,
    level,
    nextLevel: resolveNextLevel(points),
    streak: {
      current: progress?.currentStreak ?? 0,
      longest: progress?.longestStreak ?? 0,
    },
    activeDays,
    badges: ownedBadges.flatMap((badge) => {
      const entry = findBadge(badge.badgeKey)
      return entry
        ? [
            {
              key: entry.key,
              label: entry.label,
              description: entry.description,
              awardedAt: badge.awardedAt.toISOString(),
            },
          ]
        : []
    }),
    allBadges: BADGES.map((badge) => ({
      key: badge.key,
      label: badge.label,
      description: badge.description,
      threshold: badge.threshold,
      awarded: ownedKeys.has(badge.key),
    })),
    recentAttempts: attempts.map((attempt) => ({
      contentId: attempt.contentId,
      title: titleById.get(attempt.contentId) ?? '',
      score: attempt.score,
      total: attempt.total,
      createdAt: attempt.createdAt.toISOString(),
    })),
  }
}

/**
 * Total points for a user, used by the unlock gate on document reads. Missing
 * progress means zero, never an error: a new user simply unlocks nothing.
 */
export const getUserTotalPoints = async (userId: string): Promise<number> => {
  const progress = await prisma.userProgress.findUnique({
    where: { userId },
    select: { points: true },
  })
  return progress?.points ?? 0
}
