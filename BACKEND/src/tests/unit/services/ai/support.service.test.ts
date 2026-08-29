/**
 * UNIT TESTS FOR THE SUPPORT AGENT
 *
 * What are we testing?
 * - The two gates that sit in front of the model, and the shape of the answer
 *
 * What is mocked?
 * - Redis, retrieval and the AI client
 *
 * Both gates exist to stop a model call happening, so nearly every test here
 * asserts that chatText was NOT called. Getting the ordering wrong would still
 * produce correct answers while quietly spending money on questions that never
 * needed to reach the model.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

const { incr, expire, searchKnowledgeBase, chatText } = vi.hoisted(() => ({
  incr: vi.fn(),
  expire: vi.fn(),
  searchKnowledgeBase: vi.fn(),
  chatText: vi.fn(),
}))

vi.mock('@/config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/config')>()
  return { ...actual, redisClient: { incr, expire } }
})

vi.mock('@/services/ai/kb.service', () => ({ searchKnowledgeBase }))
vi.mock('@/services/ai/client', () => ({ chatText }))

import { answerSupportQuestion } from '@/services/ai/support.service'
import { config } from '@/config'
import { AppError } from '@/types/errors'

const USER = 'user_123'

const passage = (overrides: Record<string, unknown> = {}) => ({
  id: 'chunk_1',
  source: 'support-md',
  sourceId: null,
  heading: 'STREAKS',
  text: 'A streak counts consecutive days of activity, in UTC.',
  similarity: 0.8,
  ...overrides,
})

describe('support agent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    incr.mockResolvedValue(1)
    expire.mockResolvedValue(1)
    searchKnowledgeBase.mockResolvedValue([passage()])
    chatText.mockResolvedValue('Streaks are counted in UTC days.')
  })

  describe('the daily quota', () => {
    it('should set the expiry only on the first question of the day', async () => {
      // ARRANGE
      incr.mockResolvedValue(1)

      // ACT
      await answerSupportQuestion(USER, { question: 'how do streaks work' })

      // ASSERT
      expect(incr).toHaveBeenCalledWith(
        expect.stringContaining(`ai:support:quota:${USER}:`)
      )
      expect(expire).toHaveBeenCalledTimes(1)
    })

    it('should not push the expiry out on later questions', async () => {
      // ARRANGE
      // Re-expiring on every question would let a long conversation keep the
      // key alive indefinitely and leak it.
      incr.mockResolvedValue(4)

      // ACT
      await answerSupportQuestion(USER, { question: 'and gems?' })

      // ASSERT
      expect(expire).not.toHaveBeenCalled()
    })

    it('should raise 429 once the daily limit is passed, before any model call', async () => {
      // ARRANGE
      incr.mockResolvedValue(config.AI_SUPPORT_DAILY_LIMIT + 1)

      // ACT
      const failure = await answerSupportQuestion(USER, {
        question: 'one more',
      }).catch((error: AppError) => error)

      // ASSERT
      expect((failure as AppError).statusCode).toBe(429)
      expect((failure as AppError).code).toBe('AI_QUOTA_EXCEEDED')
      expect(searchKnowledgeBase).not.toHaveBeenCalled()
      expect(chatText).not.toHaveBeenCalled()
    })

    it('should report how many questions are left', async () => {
      // ARRANGE
      incr.mockResolvedValue(3)

      // ACT
      const result = await answerSupportQuestion(USER, { question: 'q' })

      // ASSERT
      expect(result.remaining).toBe(config.AI_SUPPORT_DAILY_LIMIT - 3)
    })

    it('should fail closed when Redis is unavailable', async () => {
      // ARRANGE
      // This deliberately differs from the read caches, which degrade quietly
      // when Redis is down. Here a miss removes the spend ceiling entirely.
      incr.mockRejectedValue(new Error('connection refused'))

      // ACT
      const failure = await answerSupportQuestion(USER, {
        question: 'q',
      }).catch((error: AppError) => error)

      // ASSERT
      expect((failure as AppError).statusCode).toBe(503)
      expect((failure as AppError).code).toBe('AI_QUOTA_UNAVAILABLE')
      expect(chatText).not.toHaveBeenCalled()
    })
  })

  describe('retrieval', () => {
    it('should refer to email without a model call when nothing matches', async () => {
      // ARRANGE
      searchKnowledgeBase.mockResolvedValue([])

      // ACT
      const result = await answerSupportQuestion(USER, {
        question: 'what is the capital of France',
      })

      // ASSERT
      expect(chatText).not.toHaveBeenCalled()
      expect(result.answer).toContain('studzee247@gmail.com')
      expect(result.sources).toEqual([])
    })

    it('should put the retrieved passages in the system turn', async () => {
      // ARRANGE
      searchKnowledgeBase.mockResolvedValue([passage()])

      // ACT
      await answerSupportQuestion(USER, { question: 'how do streaks work' })

      // ASSERT
      const messages = chatText.mock.calls[0][0] as {
        role: string
        content: string
      }[]
      expect(messages[0].role).toBe('system')
      expect(messages[0].content).toContain('consecutive days')
      // The instruction to stay inside the passages has to sit with them.
      expect(messages[0].content).toContain('studzee247@gmail.com')
    })
  })

  describe('the answer', () => {
    it('should return a content id only for study material passages', async () => {
      // ARRANGE
      searchKnowledgeBase.mockResolvedValue([
        passage({ id: 'c1', source: 'support-md', heading: 'STREAKS' }),
        passage({
          id: 'c2',
          source: 'content',
          sourceId: '507f1f77bcf86cd799439011',
          heading: 'Load Balancers Explained',
        }),
      ])

      // ACT
      const result = await answerSupportQuestion(USER, { question: 'q' })

      // ASSERT
      expect(result.sources).toEqual([
        { heading: 'STREAKS', contentId: null },
        {
          heading: 'Load Balancers Explained',
          contentId: '507f1f77bcf86cd799439011',
        },
      ])
    })

    it('should cap the conversation history it forwards', async () => {
      // ARRANGE
      const history = Array.from({ length: 12 }, (_, index) => ({
        role: index % 2 === 0 ? ('user' as const) : ('assistant' as const),
        content: `turn ${index}`,
      }))

      // ACT
      await answerSupportQuestion(USER, { question: 'and now?', history })

      // ASSERT
      // One system turn, six history turns, one current question.
      const messages = chatText.mock.calls[0][0] as unknown[]
      expect(messages).toHaveLength(8)
    })

    it('should work with no history at all', async () => {
      // ACT
      const result = await answerSupportQuestion(USER, { question: 'q' })

      // ASSERT
      expect(result.answer).toBe('Streaks are counted in UTC days.')
      expect(chatText.mock.calls[0][0]).toHaveLength(2)
    })
  })
})
