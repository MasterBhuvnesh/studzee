/**
 * UNIT TESTS FOR AI GENERATION
 *
 * What are we testing?
 * - That a generated payload is assembled and validated before a draft row is
 *   written, so an approved draft cannot fail on shape later
 *
 * What is mocked?
 * - The AI client, so no model is called
 * - DocumentModel and prisma, so no database is needed
 *
 * The rules being pinned here are the ones that would otherwise only surface
 * at approval time, hours after generation: a pass mark above the number of
 * questions returned, a contentId on the wrong quest type, a quiz item with
 * one option.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.mock factories are hoisted above every const in the file, so the spies
// they close over have to be created inside vi.hoisted or they are still in
// the temporal dead zone when the factory runs.
const { chatJson, aiDraftCreate, questFindUnique, leanFindById } = vi.hoisted(
  () => ({
    chatJson: vi.fn(),
    aiDraftCreate: vi.fn(),
    questFindUnique: vi.fn(),
    leanFindById: vi.fn(),
  })
)

vi.mock('@/services/ai/client', () => ({ chatJson }))

vi.mock('@/models/document.model', () => ({
  DocumentModel: {
    findById: () => ({ lean: leanFindById }),
  },
}))

vi.mock('@/config', async (importOriginal) => {
  // The real config is kept so AI_MODEL and the rest still resolve; only the
  // Prisma client is replaced.
  const actual = await importOriginal<typeof import('@/config')>()
  return {
    ...actual,
    prisma: {
      aiDraft: { create: aiDraftCreate },
      quest: { findUnique: questFindUnique },
    },
  }
})

import {
  generateContentDraft,
  generateNotesDraft,
  generateQuestDraft,
  generateQuizDraft,
} from '@/services/ai/generate.service'
import { AppError } from '@/types/errors'

const DOC_ID = '507f1f77bcf86cd799439011'

const sourceDoc = {
  _id: DOC_ID,
  title: 'Load Balancers Explained',
  summary: 'How traffic is spread across servers.',
  topic: 'system-design',
  content: { body: 'A load balancer distributes requests.' },
  key_notes: { 'Round robin': 'Requests cycle through servers in order.' },
}

/** The payload the service handed to prisma on the most recent call. */
const capturedPayload = () =>
  aiDraftCreate.mock.calls[0][0].data.payload as Record<string, unknown>

describe('AI generation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    leanFindById.mockResolvedValue(sourceDoc)
    aiDraftCreate.mockImplementation(async ({ data }) => ({
      id: 'draft_1',
      ...data,
    }))
    questFindUnique.mockResolvedValue(null)
  })

  describe('generateContentDraft', () => {
    const request = {
      title: 'Consistent Hashing',
      topic: 'system-design' as const,
      sections: 3,
      quizCount: 2,
    }

    /** The three replies, in the order the service asks for them. */
    const replies = (blocks: unknown[]) => {
      chatJson
        .mockResolvedValueOnce({
          title: 'Consistent Hashing By Any Other Name',
          topic: 'devops',
          content: [
            { title: 'INTRODUCTION', content: blocks },
            {
              title: 'HOW IT WORKS',
              content: [
                { type: 'text', value: 'Nodes are placed around the ring.' },
              ],
            },
          ],
          facts: 'Consistent hashing came out of Akamai research in 1997.',
          tags: ['hashing', 'sharding'],
        })
        .mockResolvedValueOnce({
          quiz: {
            q1: {
              que: 'What does a hash ring reduce?',
              ans: 'Key movement on resize',
              options: ['Key movement on resize', 'Disk usage'],
            },
          },
        })
        .mockResolvedValueOnce({
          summary:
            'Consistent hashing keeps most keys on the same node when the ' +
            'node count changes.',
          key_notes: { 'Hash ring': 'Nodes and keys map onto one ring.' },
        })
    }

    it('should assemble one document draft from three model calls', async () => {
      // ARRANGE
      replies([{ type: 'text', value: 'A hash ring maps keys to nodes.' }])

      // ACT
      await generateContentDraft(request, 'user_admin')

      // ASSERT
      expect(chatJson).toHaveBeenCalledTimes(3)
      const call = aiDraftCreate.mock.calls[0][0].data
      expect(call.kind).toBe('document')
      // Written from a title, so it is derived from nothing already stored.
      expect(call.sourceId).toBeNull()

      const payload = capturedPayload()
      // The operator owns the title and the topic; the model owns the prose.
      expect(payload.title).toBe('Consistent Hashing')
      expect(payload.topic).toBe('system-design')
      expect(payload.tags).toEqual(['hashing', 'sharding'])
      expect(payload.quiz).toHaveProperty('q1')
      expect(payload.key_notes).toHaveProperty('Hash ring')
    })

    it('should let the model name and file the document when asked to', async () => {
      // ARRANGE
      // The case this exists for: material pasted in with no title and no
      // topic, so both come back from the model.
      replies([{ type: 'text', value: 'A hash ring maps keys to nodes.' }])

      // ACT
      await generateContentDraft(
        { brief: 'Notes on consistent hashing.', sections: 3, quizCount: 2 },
        'user_admin'
      )

      // ASSERT
      const payload = capturedPayload()
      expect(payload.title).toBe('Consistent Hashing By Any Other Name')
      expect(payload.topic).toBe('devops')
    })

    it('should reject a block type the client cannot render', async () => {
      // ARRANGE
      // contentmd.tsx switches on five block types and drops anything else,
      // so an invented one would validate against DocumentSchema's z.any()
      // and then render as a gap on the screen.
      replies([{ type: 'callout', value: 'Note this.' }])

      // ACT
      const failure = await generateContentDraft(request, 'user_admin').catch(
        (error: AppError) => error
      )

      // ASSERT
      expect((failure as AppError).code).toBe('AI_INVALID_OUTPUT')
      expect(aiDraftCreate).not.toHaveBeenCalled()
    })
  })

  describe('generateQuizDraft', () => {
    it('should store the generated quiz as a pending draft', async () => {
      // ARRANGE
      chatJson.mockResolvedValue({
        quiz: {
          q1: {
            que: 'What does a load balancer do?',
            ans: 'Spreads requests',
            options: ['Spreads requests', 'Stores data'],
          },
        },
      })

      // ACT
      const draft = await generateQuizDraft(DOC_ID, 5, 'user_admin')

      // ASSERT
      expect(aiDraftCreate).toHaveBeenCalledTimes(1)
      const call = aiDraftCreate.mock.calls[0][0].data
      expect(call.kind).toBe('quiz')
      expect(call.sourceId).toBe(DOC_ID)
      expect(call.createdBy).toBe('user_admin')
      expect(draft.id).toBe('draft_1')
    })

    it('should raise 404 without calling the model when the document is gone', async () => {
      // ARRANGE
      leanFindById.mockResolvedValue(null)

      // ACT
      const failure = await generateQuizDraft(DOC_ID, 5, 'user_admin').catch(
        (error: AppError) => error
      )

      // ASSERT
      expect((failure as AppError).statusCode).toBe(404)
      // Loading first is what makes a missing id free rather than a paid call.
      expect(chatJson).not.toHaveBeenCalled()
    })
  })

  describe('generateNotesDraft', () => {
    it('should store summary and key notes under the key_notes kind', async () => {
      // ARRANGE
      chatJson.mockResolvedValue({
        summary: 'A load balancer spreads incoming requests across servers.',
        key_notes: {
          'Health checks': 'Unhealthy servers stop receiving traffic.',
        },
      })

      // ACT
      await generateNotesDraft(DOC_ID, 'user_admin')

      // ASSERT
      expect(aiDraftCreate.mock.calls[0][0].data.kind).toBe('key_notes')
      expect(capturedPayload().summary).toContain('load balancer')
    })
  })

  describe('generateQuestDraft', () => {
    const window = {
      startsAt: new Date('2026-09-01T00:00:00Z'),
      endsAt: new Date('2026-09-30T00:00:00Z'),
    }

    it('should clamp the pass mark to the number of questions returned', async () => {
      // ARRANGE
      // The request asks for three questions with a pass mark of three, but
      // the model returns two. Left alone the quest would be uncompletable.
      chatJson.mockResolvedValue({
        title: 'Load Balancer Basics',
        description: 'Answer two questions on load balancing.',
        questions: [
          {
            key: 'q1',
            que: 'What is round robin?',
            options: ['Cycling servers', 'Caching'],
            ans: 'Cycling servers',
          },
          {
            key: 'q2',
            que: 'What is a health check?',
            options: ['A probe', 'A cache'],
            ans: 'A probe',
          },
        ],
      })

      // ACT
      await generateQuestDraft(
        {
          contentId: DOC_ID,
          type: 'mcq',
          gems: 10,
          questionCount: 3,
          passScore: 3,
          ...window,
        },
        'user_admin'
      )

      // ASSERT
      const payload = capturedPayload().payload as { passScore: number }
      expect(payload.passScore).toBe(2)
    })

    it('should default the pass mark to sixty percent, rounded up', async () => {
      // ARRANGE
      chatJson.mockResolvedValue({
        title: 'Load Balancer Drill',
        description: 'Three questions on load balancing.',
        questions: [1, 2, 3].map((n) => ({
          key: `q${n}`,
          que: `Question ${n}?`,
          options: ['Right', 'Wrong'],
          ans: 'Right',
        })),
      })

      // ACT
      await generateQuestDraft(
        {
          contentId: DOC_ID,
          type: 'scq',
          gems: 5,
          questionCount: 3,
          ...window,
        },
        'user_admin'
      )

      // ASSERT
      const payload = capturedPayload().payload as { passScore: number }
      expect(payload.passScore).toBe(2)
    })

    it('should attach a contentId to a read_blog quest and no payload', async () => {
      // ARRANGE
      chatJson.mockResolvedValue({
        title: 'Read up on load balancers',
        description: 'Open the load balancing material and read it through.',
      })

      // ACT
      await generateQuestDraft(
        {
          contentId: DOC_ID,
          type: 'read_blog',
          gems: 3,
          questionCount: 3,
          ...window,
        },
        'user_admin'
      )

      // ASSERT
      // CreateQuestSchema requires contentId for read_blog and payload for
      // every other type. Getting this backwards is the one way the assembled
      // quest fails its own schema.
      const payload = capturedPayload()
      expect(payload.contentId).toBe(DOC_ID)
      expect(payload.payload).toBeUndefined()
    })

    it('should raise AI_INVALID_OUTPUT when the assembled quest fails its schema', async () => {
      // ARRANGE
      // A blank title passes the generated shape's min(1) only if the model
      // returns whitespace, which CreateQuestSchema then rejects. The point is
      // that the second gate exists at all.
      chatJson.mockResolvedValue({
        title: '',
        description: 'Something',
        questions: [{ key: 'q1', que: 'Q?', options: ['a', 'b'], ans: 'a' }],
      })

      // ACT
      const failure = await generateQuestDraft(
        {
          contentId: DOC_ID,
          type: 'mcq',
          gems: 5,
          questionCount: 1,
          ...window,
        },
        'user_admin'
      ).catch((error: AppError) => error)

      // ASSERT
      expect((failure as AppError).code).toBe('AI_INVALID_OUTPUT')
      expect(aiDraftCreate).not.toHaveBeenCalled()
    })
  })
})
