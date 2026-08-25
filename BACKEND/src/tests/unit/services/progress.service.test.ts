/**
 * UNIT TESTS FOR THE PROGRESS SERVICE
 *
 * All Prisma access goes through one mocked client object that doubles as the
 * transaction handle, since $transaction is implemented as "run the callback
 * with myself". Mongoose is mocked at the model boundary: findById chains are
 * hand built, so the tests never touch Mongo.
 *
 * What is pinned here:
 * 1. Grading compares option TEXT against ans, ignoring unknown response keys
 *    and out of range indices.
 * 2. Points pay the delta above the prior best score for the same content.
 * 3. Streak arithmetic: consecutive days chain from today or yesterday, gaps
 *    break the chain.
 * 4. Badges insert only when not already owned.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    $transaction: vi.fn(),
    // Backs the full score badge stat read; resolved per test in beforeEach.
    $queryRaw: vi.fn(),
    quizAttempt: {
      create: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
    dailyActivity: {
      upsert: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    userProgress: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    awardedBadge: {
      findMany: vi.fn(),
      createMany: vi.fn(),
    },
  },
}))

vi.mock('@/config', () => ({ prisma: prismaMock }))

const { documentFindById, documentFind } = vi.hoisted(() => ({
  documentFindById: vi.fn(),
  documentFind: vi.fn(),
}))

vi.mock('@/models/document.model', () => ({
  DocumentModel: { findById: documentFindById, find: documentFind },
}))

import {
  computeStreaks,
  getMyProgress,
  getUserTotalPoints,
  gradeAndRecordAttempt,
} from '@/services/progress.service'

const USER = 'clerk_user_1'
const CONTENT_ID = '507f1f77bcf86cd799439011'

const QUIZ = {
  q1: { que: 'Question 1?', ans: 'Alpha', options: ['Alpha', 'Beta', 'Gamma'] },
  q2: { que: 'Question 2?', ans: 'Delta', options: ['Delta', 'Epsilon'] },
}

const DAY_MS = 24 * 60 * 60 * 1000

/** Midnight UTC of today shifted by offsetDays. */
const dayAt = (offsetDays: number): Date =>
  new Date(
    Date.UTC(
      new Date().getUTCFullYear(),
      new Date().getUTCMonth(),
      new Date().getUTCDate()
    ) +
      offsetDays * DAY_MS
  )

const setLeanDocument = (doc: unknown) => {
  documentFindById.mockReturnValue({
    select: vi.fn().mockReturnThis(),
    lean: vi.fn().mockResolvedValue(doc),
  })
}

type Tx = typeof prismaMock

beforeEach(() => {
  vi.clearAllMocks()

  prismaMock.$transaction.mockImplementation(
    async (fn: (tx: Tx) => Promise<unknown>) => fn(prismaMock)
  )
  // No full score attempts in history unless a test says otherwise.
  prismaMock.$queryRaw.mockResolvedValue([{ count: 0 }])
  prismaMock.quizAttempt.findFirst.mockResolvedValue(null)
  prismaMock.quizAttempt.count.mockResolvedValue(1)
  prismaMock.quizAttempt.create.mockResolvedValue({})
  prismaMock.quizAttempt.findMany.mockResolvedValue([])
  prismaMock.dailyActivity.upsert.mockResolvedValue({})
  prismaMock.dailyActivity.findMany.mockResolvedValue([])
  prismaMock.dailyActivity.count.mockResolvedValue(0)
  prismaMock.userProgress.findUnique.mockResolvedValue(null)
  prismaMock.userProgress.upsert.mockResolvedValue({})
  prismaMock.awardedBadge.findMany.mockResolvedValue([])
  prismaMock.awardedBadge.createMany.mockResolvedValue({ count: 0 })

  setLeanDocument({ _id: CONTENT_ID, title: 'Doc', quiz: QUIZ })
})

const grade = (responses: Record<string, number>) =>
  gradeAndRecordAttempt(USER, CONTENT_ID, responses)

describe('grading', () => {
  it('counts answers chosen by option index and compared by text', async () => {
    const result = await grade({ q1: 0, q2: 0 })

    expect(result.score).toBe(2)
    expect(result.total).toBe(2)
  })

  it('scores a wrong index as incorrect, not as an error', async () => {
    const result = await grade({ q1: 1, q2: 1 })

    expect(result.score).toBe(0)
    expect(result.total).toBe(2)
  })

  it('ignores response keys that do not exist in the quiz', async () => {
    const result = await grade({ q1: 0, ghost: 1 })

    expect(result.score).toBe(1)
    expect(result.total).toBe(2)
  })

  it('treats an out of range index as incorrect', async () => {
    const result = await grade({ q1: 9, q2: 0 })

    expect(result.score).toBe(1)
  })

  it('grades a quiz handed back as a Map instance', async () => {
    setLeanDocument({
      _id: CONTENT_ID,
      title: 'Doc',
      quiz: new Map(Object.entries(QUIZ)),
    })

    const result = await grade({ q1: 0, q2: 0 })

    expect(result.score).toBe(2)
  })
})

describe('points rule', () => {
  it('pays 10 per correct answer on a first attempt', async () => {
    const result = await grade({ q1: 0, q2: 0 })

    expect(result.pointsAwarded).toBe(20)
    expect(result.totalPoints).toBe(20)
  })

  it('pays only the difference over the prior best on improvement', async () => {
    prismaMock.quizAttempt.findFirst.mockResolvedValue({ score: 1, total: 2 })
    prismaMock.userProgress.findUnique.mockResolvedValue({ points: 10 })

    const result = await grade({ q1: 0, q2: 0 })

    expect(result.score).toBe(2)
    expect(result.pointsAwarded).toBe(10)
    expect(result.totalPoints).toBe(20)
  })

  it('pays nothing when the replay is worse than the prior best', async () => {
    prismaMock.quizAttempt.findFirst.mockResolvedValue({ score: 2, total: 2 })
    prismaMock.userProgress.findUnique.mockResolvedValue({ points: 20 })

    const result = await grade({ q1: 0 })

    expect(result.score).toBe(1)
    expect(result.pointsAwarded).toBe(0)

    expect(prismaMock.quizAttempt.create).toHaveBeenCalledWith({
      data: {
        userId: USER,
        contentId: CONTENT_ID,
        score: 1,
        total: 2,
        pointsAwarded: 0,
      },
    })
    expect(prismaMock.userProgress.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ points: { increment: 0 } }),
      })
    )
  })
})

describe('streak recording', () => {
  it('upserts today as a UTC day row', async () => {
    await grade({ q1: 0 })

    expect(prismaMock.dailyActivity.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_date: { userId: USER, date: dayAt(0) } },
      })
    )
  })

  it('chains consecutive days ending today', async () => {
    prismaMock.dailyActivity.findMany.mockResolvedValue(
      [-3, -2, -1, 0].map((offset) => ({ date: dayAt(offset) }))
    )

    const result = await grade({ q1: 0 })

    expect(result.streak).toEqual({ current: 4, longest: 4 })
  })

  it('breaks the current streak at a gap but keeps the longest run', async () => {
    prismaMock.dailyActivity.findMany.mockResolvedValue(
      [-4, -3, -1, 0].map((offset) => ({ date: dayAt(offset) }))
    )

    const result = await grade({ q1: 0 })

    expect(result.streak).toEqual({ current: 2, longest: 2 })
  })

  it('counts today in the chain because the attempt upserts todays row', async () => {
    // Reads happen before the write now, so these rows deliberately exclude
    // today. The service unions todays key in, because the attempt being
    // recorded is itself activity: the yesterday chain extends to 4.
    prismaMock.dailyActivity.findMany.mockResolvedValue(
      [-3, -2, -1].map((offset) => ({ date: dayAt(offset) }))
    )

    const result = await grade({ q1: 0 })

    expect(result.streak.current).toBe(4)
  })
})

describe('badges', () => {
  it('inserts newly deserved badges once', async () => {
    const result = await grade({ q1: 0, q2: 0 })

    expect(prismaMock.awardedBadge.createMany).toHaveBeenCalledWith({
      data: [
        { userId: USER, badgeKey: 'first-steps' },
        { userId: USER, badgeKey: 'perfectionist' },
      ],
      skipDuplicates: true,
    })
    expect(result.newBadges.map((badge) => badge.key)).toEqual([
      'first-steps',
      'perfectionist',
    ])
  })

  it('never re-inserts a badge the user already owns', async () => {
    prismaMock.awardedBadge.findMany.mockResolvedValue([
      { badgeKey: 'first-steps' },
      { badgeKey: 'perfectionist' },
    ])

    const result = await grade({ q1: 0, q2: 0 })

    expect(prismaMock.awardedBadge.createMany).not.toHaveBeenCalled()
    expect(result.newBadges).toEqual([])
  })

  it('awards point threshold badges from derived totals', async () => {
    prismaMock.userProgress.findUnique.mockResolvedValue({ points: 95 })

    const result = await grade({ q1: 0 })

    expect(result.totalPoints).toBe(105)
    expect(result.newBadges.map((badge) => badge.key)).toEqual([
      'first-steps',
      'century',
    ])
  })

  it('keeps perfectionist earned by a prior attempt without re-inserting it', async () => {
    // Stored history already holds a full-score attempt elsewhere, so the
    // tally keeps tier one deserved even though this replay scores nothing;
    // the badge itself is owned, so nothing is inserted again.
    prismaMock.$queryRaw.mockResolvedValue([{ count: 1 }])
    prismaMock.quizAttempt.findFirst.mockResolvedValue({ score: 2, total: 2 })
    prismaMock.awardedBadge.findMany.mockResolvedValue([
      { badgeKey: 'first-steps' },
      { badgeKey: 'perfectionist' },
    ])

    const result = await grade({ q1: 1 })

    expect(result.score).toBe(0)
    expect(result.newBadges).toEqual([])
    expect(prismaMock.awardedBadge.createMany).not.toHaveBeenCalled()
  })

  it.each([
    [0, ['first-steps', 'perfectionist']],
    [9, ['first-steps', 'perfectionist', 'perfectionist-x2']],
    [
      24,
      ['first-steps', 'perfectionist', 'perfectionist-x2', 'perfectionist-x3'],
    ],
    [
      99,
      [
        'first-steps',
        'perfectionist',
        'perfectionist-x2',
        'perfectionist-x3',
        'perfectionist-x4',
      ],
    ],
  ])(
    'awards every tier reached when full score %i stored plus this attempt',
    async (stored, expected) => {
      prismaMock.$queryRaw.mockResolvedValue([{ count: stored }])

      const result = await grade({ q1: 0, q2: 0 })

      expect(result.score).toBe(2)
      expect(result.newBadges.map((badge) => badge.key)).toEqual(expected)
    }
  )

  it.each([
    [0, ['first-steps']],
    [9, ['first-steps', 'perfectionist']],
    [24, ['first-steps', 'perfectionist', 'perfectionist-x2']],
    [
      99,
      ['first-steps', 'perfectionist', 'perfectionist-x2', 'perfectionist-x3'],
    ],
  ])(
    'an imperfect attempt adds nothing to the tally at %i stored, so the next tier stays shut',
    async (stored, expected) => {
      prismaMock.$queryRaw.mockResolvedValue([{ count: stored }])

      const result = await grade({ q1: 0 })

      expect(result.score).toBe(1)
      // Lower tiers already crossed by history still land; the rung above
      // the stored count does not.
      expect(result.newBadges.map((badge) => badge.key)).toEqual(expected)
    }
  )
})

describe('rejections', () => {
  it('rejects with 404 when the content does not exist', async () => {
    setLeanDocument(null)

    await expect(grade({ q1: 0 })).rejects.toMatchObject({
      statusCode: 404,
      message: 'Content not found',
    })
  })

  it('rejects with 404 when the content has no quiz items', async () => {
    setLeanDocument({ _id: CONTENT_ID, title: 'Doc', quiz: {} })

    await expect(grade({ q1: 0 })).rejects.toMatchObject({ statusCode: 404 })
  })
})

describe('computeStreaks', () => {
  it('returns zeros with no history', () => {
    expect(computeStreaks([])).toEqual({ current: 0, longest: 0 })
  })

  it('treats a single isolated day as a streak of one', () => {
    expect(computeStreaks([dayAt(-5).toISOString().slice(0, 10)])).toEqual({
      current: 0,
      longest: 1,
    })
  })

  it('finds the longest run anywhere in history, not just the tail', () => {
    const keys = [-9, -8, -7, -2].map((offset) =>
      dayAt(offset).toISOString().slice(0, 10)
    )

    expect(computeStreaks(keys)).toEqual({ current: 0, longest: 3 })
  })

  it('ignores duplicate day keys', () => {
    const keys = [0, 0, -1, -1].map((offset) =>
      dayAt(offset).toISOString().slice(0, 10)
    )

    expect(computeStreaks(keys)).toEqual({ current: 2, longest: 2 })
  })
})

describe('getUserTotalPoints', () => {
  it('returns the stored total', async () => {
    prismaMock.userProgress.findUnique.mockResolvedValue({ points: 42 })

    await expect(getUserTotalPoints(USER)).resolves.toBe(42)
    expect(prismaMock.userProgress.findUnique).toHaveBeenCalledWith({
      where: { userId: USER },
      select: { points: true },
    })
  })

  it('returns 0 for a user with no progress row', async () => {
    prismaMock.userProgress.findUnique.mockResolvedValue(null)

    await expect(getUserTotalPoints(USER)).resolves.toBe(0)
  })
})

describe('getMyProgress', () => {
  it('composes the read side payload', async () => {
    prismaMock.userProgress.findUnique.mockResolvedValue({
      points: 150,
      currentStreak: 2,
      longestStreak: 5,
    })
    prismaMock.dailyActivity.count.mockResolvedValue(7)
    prismaMock.awardedBadge.findMany.mockResolvedValue([
      { badgeKey: 'first-steps', awardedAt: new Date('2026-08-01T00:00:00Z') },
      { badgeKey: 'century', awardedAt: new Date('2026-08-20T00:00:00Z') },
    ])
    prismaMock.quizAttempt.findMany.mockResolvedValue([
      {
        contentId: CONTENT_ID,
        score: 2,
        total: 2,
        createdAt: new Date('2026-08-24T10:00:00Z'),
      },
      {
        contentId: '507f1f77bcf86cd799439099',
        score: 0,
        total: 2,
        createdAt: new Date('2026-08-23T10:00:00Z'),
      },
    ])
    documentFind.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      lean: vi
        .fn()
        .mockResolvedValue([{ _id: CONTENT_ID, title: 'Cached Doc' }]),
    })

    const result = await getMyProgress(USER)

    expect(result.points).toBe(150)
    expect(result.level).toEqual({
      key: 'apprentice',
      label: 'Apprentice',
      minPoints: 100,
    })
    expect(result.nextLevel).toEqual({
      key: 'scholar',
      label: 'Scholar',
      minPoints: 250,
    })
    expect(result.streak).toEqual({ current: 2, longest: 5 })
    expect(result.activeDays).toBe(7)
    expect(result.badges).toHaveLength(2)
    expect(result.badges[0]).toMatchObject({
      key: 'first-steps',
      awardedAt: '2026-08-01T00:00:00.000Z',
    })
    expect(result.allBadges).toHaveLength(9)
    expect(
      result.allBadges.filter((badge) => badge.awarded).map((b) => b.key)
    ).toEqual(['first-steps', 'century'])
    expect(result.recentAttempts).toEqual([
      expect.objectContaining({
        contentId: CONTENT_ID,
        title: 'Cached Doc',
        score: 2,
        total: 2,
        createdAt: '2026-08-24T10:00:00.000Z',
      }),
      expect.objectContaining({
        contentId: '507f1f77bcf86cd799439099',
        title: '',
      }),
    ])
    expect(documentFind).toHaveBeenCalledWith({
      _id: { $in: [CONTENT_ID, '507f1f77bcf86cd799439099'] },
    })
  })

  it('falls back to novice and empty collections for a brand new user', async () => {
    const result = await getMyProgress(USER)

    expect(result.points).toBe(0)
    expect(result.level).toEqual({
      key: 'novice',
      label: 'Novice',
      minPoints: 0,
    })
    expect(result.nextLevel).toEqual({
      key: 'apprentice',
      label: 'Apprentice',
      minPoints: 100,
    })
    expect(result.recentAttempts).toEqual([])
    expect(result.badges).toEqual([])
    expect(documentFind).not.toHaveBeenCalled()
  })
})
