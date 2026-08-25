/**
 * UNIT TESTS FOR THE QUEST SERVICE
 *
 * Prisma is one mocked client object, the shared award path is a mocked
 * function: this suite pins quest behaviour only and trusts
 * recordActivityAndAward to do what its own suite proves.
 *
 * What is pinned here:
 * 1. Listing filters to active quests inside their window and flags which of
 *    them the caller already completed.
 * 2. A closed window answers 409 with code QUEST_ENDED.
 * 3. A repeat completion short circuits without awarding anything again.
 * 4. Grading per type: option text comparison for mcq/scq, trimmed case
 *    insensitive text comparison for fill_blank, pass score gating, and the
 *    direct award for read_blog.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    quest: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    questCompletion: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock('@/config', () => ({ prisma: prismaMock }))

const { recordActivityAndAward } = vi.hoisted(() => ({
  recordActivityAndAward: vi.fn(),
}))

vi.mock('@/services/progress.service', () => ({ recordActivityAndAward }))

import { completeQuest, listActiveQuests } from '@/services/quest.service'

const USER = 'clerk_user_1'
const QUEST_ID = 'quest_1'

const buildQuest = (overrides: Record<string, unknown> = {}) => ({
  id: QUEST_ID,
  title: 'Test Quest',
  description: 'A quest',
  type: 'mcq',
  gems: 25,
  contentId: null,
  payload: null,
  active: true,
  startsAt: new Date(Date.now() - 1000),
  endsAt: new Date(Date.now() + 1000),
  createdAt: new Date(),
  ...overrides,
})

const MCQ_PAYLOAD = {
  passScore: 2,
  questions: [
    { key: 'q1', que: 'One?', options: ['Right', 'Wrong'], ans: 'Right' },
    { key: 'q2', que: 'Two?', options: ['Wrong', 'Right'], ans: 'Right' },
  ],
}

beforeEach(() => {
  vi.clearAllMocks()
  prismaMock.quest.findUnique.mockResolvedValue(buildQuest())
  prismaMock.quest.findMany.mockResolvedValue([])
  prismaMock.quest.create.mockResolvedValue({})
  prismaMock.questCompletion.findUnique.mockResolvedValue(null)
  prismaMock.questCompletion.findMany.mockResolvedValue([])
  prismaMock.questCompletion.create.mockResolvedValue({})
  recordActivityAndAward.mockResolvedValue({
    totalPoints: 125,
    streak: { current: 3, longest: 5 },
    newBadges: [],
  })
})

describe('listActiveQuests', () => {
  it('asks only for active quests whose window covers now', async () => {
    await listActiveQuests(USER)

    expect(prismaMock.quest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          active: true,
          startsAt: { lte: expect.any(Date) },
          endsAt: { gt: expect.any(Date) },
        },
      })
    )
  })

  it('flags completions and keeps completed quests in the list', async () => {
    const rows = [buildQuest({ id: 'q_open' }), buildQuest({ id: 'q_done' })]
    prismaMock.quest.findMany.mockResolvedValue(rows)
    prismaMock.questCompletion.findMany.mockResolvedValue([
      { questId: 'q_done' },
    ])

    const quests = await listActiveQuests(USER)

    expect(quests).toHaveLength(2)
    expect(quests[0]).toMatchObject({ id: 'q_open', completed: false })
    expect(quests[1]).toMatchObject({ id: 'q_done', completed: true })
    expect(quests[1].gems).toBe(25)
    expect(quests[1].endsAt).toBe(rows[1].endsAt.toISOString())
  })
})

describe('completeQuest guards', () => {
  it('rejects an unknown quest with 404', async () => {
    prismaMock.quest.findUnique.mockResolvedValue(null)

    await expect(completeQuest(USER, 'missing', {})).rejects.toMatchObject({
      statusCode: 404,
      message: 'Quest not found',
    })
  })

  it('rejects an expired window with 409 and code QUEST_ENDED', async () => {
    prismaMock.quest.findUnique.mockResolvedValue(
      buildQuest({ endsAt: new Date(Date.now() - 60_000) })
    )

    await expect(completeQuest(USER, QUEST_ID, {})).rejects.toMatchObject({
      statusCode: 409,
      code: 'QUEST_ENDED',
    })
  })

  it('rejects a quest withdrawn by admin the same way as an expired one', async () => {
    prismaMock.quest.findUnique.mockResolvedValue(buildQuest({ active: false }))

    await expect(completeQuest(USER, QUEST_ID, {})).rejects.toMatchObject({
      statusCode: 409,
      code: 'QUEST_ENDED',
    })
  })

  it('short circuits a repeat completion without awarding again', async () => {
    prismaMock.questCompletion.findUnique.mockResolvedValue({
      id: 'row_1',
      gemsAwarded: 25,
    })

    const result = await completeQuest(USER, QUEST_ID, { responses: { q1: 0 } })

    expect(result).toEqual({ alreadyCompleted: true, gemsAwarded: 0 })
    expect(recordActivityAndAward).not.toHaveBeenCalled()
    expect(prismaMock.questCompletion.create).not.toHaveBeenCalled()
  })
})

describe('mcq grading', () => {
  it('awards when every answer matches option text at the chosen index', async () => {
    prismaMock.quest.findUnique.mockResolvedValue(
      buildQuest({ payload: MCQ_PAYLOAD })
    )

    const result = await completeQuest(USER, QUEST_ID, {
      responses: { q1: 0, q2: 1 },
    })

    expect(result.passed).toBe(true)
    expect(result.score).toBe(2)
    expect(result.total).toBe(2)
    expect(recordActivityAndAward).toHaveBeenCalledWith(USER, 25)
    expect(prismaMock.questCompletion.create).toHaveBeenCalledWith({
      data: { userId: USER, questId: QUEST_ID, gemsAwarded: 25 },
    })
  })

  it('answers passed false without awarding below the pass score', async () => {
    prismaMock.quest.findUnique.mockResolvedValue(
      buildQuest({ payload: MCQ_PAYLOAD })
    )

    // q2 grades correct but one of two is below passScore 2.
    const result = await completeQuest(USER, QUEST_ID, {
      responses: { q1: 1, q2: 1 },
    })

    expect(result).toEqual({
      passed: false,
      score: 1,
      total: 2,
      gemsAwarded: 0,
    })
    expect(recordActivityAndAward).not.toHaveBeenCalled()
    expect(prismaMock.questCompletion.create).not.toHaveBeenCalled()
  })

  it('compares by option text, so ans at options[0] still grades fairly', async () => {
    // Same convention as quiz documents: the correct option text also sits
    // elsewhere in the array, index alone decides nothing.
    prismaMock.quest.findUnique.mockResolvedValue(
      buildQuest({ payload: MCQ_PAYLOAD })
    )

    const result = await completeQuest(USER, QUEST_ID, {
      responses: { q1: 1, q2: 0 },
    })

    expect(result.passed).toBe(false)
    expect(result.score).toBe(0)
  })
})

describe('fill_blank grading', () => {
  const FILL_PAYLOAD = {
    passScore: 2,
    questions: [
      { key: 'q1', que: 'Blank one', answer: 'Consistency' },
      { key: 'q2', que: 'Blank two', answer: 'partition' },
    ],
  }

  beforeEach(() => {
    prismaMock.quest.findUnique.mockResolvedValue(
      buildQuest({ type: 'fill_blank', payload: FILL_PAYLOAD })
    )
  })

  it('ignores case and surrounding whitespace', async () => {
    const result = await completeQuest(USER, QUEST_ID, {
      responses: { q1: '  consistency ', q2: 'PARTITION' },
    })

    expect(result.passed).toBe(true)
    expect(result.score).toBe(2)
  })

  it('fails a wrong term without awarding', async () => {
    const result = await completeQuest(USER, QUEST_ID, {
      responses: { q1: 'availability', q2: 'partition' },
    })

    expect(result.passed).toBe(false)
    expect(result.score).toBe(1)
  })
})

describe('read_blog award', () => {
  it('awards on submission without any grading', async () => {
    prismaMock.quest.findUnique.mockResolvedValue(
      buildQuest({
        type: 'read_blog',
        contentId: '507f1f77bcf86cd799439011',
      })
    )

    const result = await completeQuest(USER, QUEST_ID, {})

    expect(result.passed).toBe(true)
    expect(result.gemsAwarded).toBe(25)
    expect(result.totalPoints).toBe(125)
    expect(result.streak).toEqual({ current: 3, longest: 5 })
    expect(recordActivityAndAward).toHaveBeenCalledTimes(1)
    expect(prismaMock.questCompletion.create).toHaveBeenCalledTimes(1)
  })
})

describe('award delegation', () => {
  it('routes gems through the shared activity award path', async () => {
    await completeQuest(USER, QUEST_ID, { responses: { q1: 0, q2: 1 } })

    // Quest completions are activity for streaks but never QuizAttempts, so
    // nothing here touches attempt counting.
    expect(recordActivityAndAward).toHaveBeenCalledWith(USER, 25)
  })
})
