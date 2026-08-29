/**
 * UNIT TESTS FOR DRAFT REVIEW
 *
 * What are we testing?
 * - The only path by which a generated payload becomes visible to a student
 *
 * What is mocked?
 * - prisma, DocumentModel, and each of the four services approval dispatches
 *   to. Asserting on those calls is the point: approval must go through the
 *   existing write paths rather than writing anything itself.
 *
 * The behaviours pinned here are the ones with a cost attached. A duplicate
 * quest title must not surface as a raw Prisma error. A failed apply must
 * leave the draft pending, because losing it means paying to generate it
 * again. And an override must be re-validated, or it becomes a way to put a
 * shape into the database that the generator would have rejected.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

const {
  aiDraftFindUnique,
  aiDraftUpdate,
  questFindUnique,
  leanFindById,
  updateDocument,
  createQuest,
  sendExpoNotification,
  saveNotification,
  getAllUsersTokens,
  removeExpoTokens,
} = vi.hoisted(() => ({
  aiDraftFindUnique: vi.fn(),
  aiDraftUpdate: vi.fn(),
  questFindUnique: vi.fn(),
  leanFindById: vi.fn(),
  updateDocument: vi.fn(),
  createQuest: vi.fn(),
  sendExpoNotification: vi.fn(),
  saveNotification: vi.fn(),
  getAllUsersTokens: vi.fn(),
  removeExpoTokens: vi.fn(),
}))

vi.mock('@/config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/config')>()
  return {
    ...actual,
    prisma: {
      aiDraft: {
        findUnique: aiDraftFindUnique,
        update: aiDraftUpdate,
        findMany: vi.fn(),
        count: vi.fn(),
      },
      quest: { findUnique: questFindUnique },
    },
  }
})

vi.mock('@/models/document.model', () => ({
  DocumentModel: { findById: () => ({ lean: leanFindById }) },
}))

vi.mock('@/services/admin.service', () => ({
  adminService: { updateDocument },
}))

vi.mock('@/services/quest.service', () => ({ createQuest }))
vi.mock('@/services/expo.service', () => ({ sendExpoNotification }))
vi.mock('@/services/notification.service', () => ({ saveNotification }))
vi.mock('@/services/user.service', () => ({
  getAllUsersTokens,
  removeExpoTokens,
}))

import { approveDraft, rejectDraft } from '@/services/ai/draft.service'
import { AppError } from '@/types/errors'

const DOC_ID = '507f1f77bcf86cd799439011'
const REVIEWER = 'user_owner'

const draftRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'draft_1',
  kind: 'quiz',
  status: 'pending',
  sourceId: DOC_ID,
  payload: {},
  model: 'test-model',
  createdBy: 'user_admin',
  reviewedBy: null,
  reviewedAt: null,
  appliedId: null,
  error: null,
  createdAt: new Date(),
  ...overrides,
})

const validQuestPayload = {
  title: 'Load Balancer Basics',
  description: 'Answer two questions on load balancing.',
  type: 'mcq',
  gems: 10,
  active: true,
  startsAt: '2026-09-01T00:00:00.000Z',
  endsAt: '2026-09-30T00:00:00.000Z',
  payload: {
    passScore: 1,
    questions: [
      { key: 'q1', que: 'What is it?', options: ['A', 'B'], ans: 'A' },
    ],
  },
}

describe('AI draft review', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    aiDraftUpdate.mockImplementation(async ({ data }) => ({
      ...draftRow(),
      ...data,
    }))
    questFindUnique.mockResolvedValue(null)
    createQuest.mockResolvedValue({ id: 'quest_1' })
    getAllUsersTokens.mockResolvedValue(['ExponentPushToken[abc]'])
    sendExpoNotification.mockResolvedValue({
      success: true,
      sent: 1,
      failed: 0,
      ticketIds: [],
      invalidTokens: [],
      errors: [],
    })
    saveNotification.mockResolvedValue({ id: 'notif_1' })
    updateDocument.mockResolvedValue({})
  })

  describe('approving a quiz draft', () => {
    it('should append questions under fresh keys instead of overwriting', async () => {
      // ARRANGE
      // Both the document and the generated quiz number from q1. Merging by
      // key would replace the two existing questions rather than add to them.
      aiDraftFindUnique.mockResolvedValue(
        draftRow({
          kind: 'quiz',
          payload: {
            quiz: {
              q1: { que: 'New one?', ans: 'Yes', options: ['Yes', 'No'] },
            },
          },
        })
      )
      leanFindById.mockResolvedValue({
        _id: DOC_ID,
        quiz: {
          q1: { que: 'Old one?', ans: 'A', options: ['A', 'B'] },
          q2: { que: 'Older?', ans: 'C', options: ['C', 'D'] },
        },
      })

      // ACT
      await approveDraft('draft_1', REVIEWER)

      // ASSERT
      const [, update] = updateDocument.mock.calls[0]
      expect(Object.keys(update.quiz)).toEqual(['q1', 'q2', 'q3'])
      expect(update.quiz.q1.que).toBe('Old one?')
      expect(update.quiz.q3.que).toBe('New one?')
    })
  })

  describe('approving a notes draft', () => {
    it('should replace the summary and keep existing key notes', async () => {
      // ARRANGE
      aiDraftFindUnique.mockResolvedValue(
        draftRow({
          kind: 'key_notes',
          payload: {
            summary: 'A newly written summary of the load balancing material.',
            key_notes: { Generated: 'A generated note.' },
          },
        })
      )
      leanFindById.mockResolvedValue({
        _id: DOC_ID,
        key_notes: { Handwritten: 'A note somebody wrote.' },
      })

      // ACT
      await approveDraft('draft_1', REVIEWER)

      // ASSERT
      const [, update] = updateDocument.mock.calls[0]
      expect(update.summary).toContain('newly written')
      // Approving generated notes must not silently delete hand written ones.
      expect(update.key_notes).toEqual({
        Handwritten: 'A note somebody wrote.',
        Generated: 'A generated note.',
      })
    })
  })

  describe('approving a quest draft', () => {
    it('should create the quest and record its id', async () => {
      // ARRANGE
      aiDraftFindUnique.mockResolvedValue(
        draftRow({ kind: 'quest', payload: validQuestPayload })
      )

      // ACT
      const result = await approveDraft('draft_1', REVIEWER)

      // ASSERT
      expect(createQuest).toHaveBeenCalledTimes(1)
      expect(result.appliedId).toBe('quest_1')
      expect(aiDraftUpdate.mock.calls[0][0].data.status).toBe('approved')
    })

    it('should raise 409 on a duplicate title and leave the draft pending', async () => {
      // ARRANGE
      // Quest.title is unique with no dedup inside createQuest, so without the
      // pre-check this is an unactionable Prisma P2002.
      aiDraftFindUnique.mockResolvedValue(
        draftRow({ kind: 'quest', payload: validQuestPayload })
      )
      questFindUnique.mockResolvedValue({ id: 'quest_existing' })

      // ACT
      const failure = await approveDraft('draft_1', REVIEWER).catch(
        (error: AppError) => error
      )

      // ASSERT
      expect((failure as AppError).statusCode).toBe(409)
      expect((failure as AppError).code).toBe('QUEST_TITLE_TAKEN')
      expect(createQuest).not.toHaveBeenCalled()

      // The only write is the recorded reason. The draft stays pending so it
      // can be approved again with a different title.
      expect(aiDraftUpdate).toHaveBeenCalledTimes(1)
      const data = aiDraftUpdate.mock.calls[0][0].data
      expect(data.error).toContain('already exists')
      expect(data.status).toBeUndefined()
    })

    it('should apply an overridden title', async () => {
      // ARRANGE
      aiDraftFindUnique.mockResolvedValue(
        draftRow({ kind: 'quest', payload: validQuestPayload })
      )

      // ACT
      await approveDraft('draft_1', REVIEWER, {
        title: 'Load Balancer Basics II',
      })

      // ASSERT
      expect(createQuest.mock.calls[0][0].title).toBe('Load Balancer Basics II')
      // The stored payload becomes what was applied, not what was generated.
      expect(aiDraftUpdate.mock.calls[0][0].data.payload.title).toBe(
        'Load Balancer Basics II'
      )
    })

    it('should reject an override that breaks the schema', async () => {
      // ARRANGE
      aiDraftFindUnique.mockResolvedValue(
        draftRow({ kind: 'quest', payload: validQuestPayload })
      )

      // ACT
      // gems must be a positive integer. An unvalidated override would put a
      // string into the quest table.
      const failure = await approveDraft('draft_1', REVIEWER, {
        gems: 'lots',
      }).catch((error: AppError) => error)

      // ASSERT
      expect((failure as AppError).statusCode).toBe(400)
      expect((failure as AppError).code).toBe('DRAFT_INVALID')
      expect(createQuest).not.toHaveBeenCalled()
    })
  })

  describe('approving a notification draft', () => {
    it('should send, prune retired tokens and write the audit row', async () => {
      // ARRANGE
      aiDraftFindUnique.mockResolvedValue(
        draftRow({
          kind: 'notification',
          payload: {
            title: 'New material on load balancing',
            message: 'Three ways traffic gets spread across servers.',
            target: { kind: 'content', id: DOC_ID },
          },
        })
      )
      sendExpoNotification.mockResolvedValue({
        success: true,
        sent: 1,
        failed: 1,
        ticketIds: [],
        invalidTokens: ['ExponentPushToken[dead]'],
        errors: [],
      })

      // ACT
      const result = await approveDraft('draft_1', REVIEWER)

      // ASSERT
      expect(sendExpoNotification).toHaveBeenCalledTimes(1)
      expect(removeExpoTokens).toHaveBeenCalledWith(['ExponentPushToken[dead]'])
      expect(saveNotification.mock.calls[0][0].sentBy).toBe(REVIEWER)
      expect(result.appliedId).toBe('notif_1')
    })

    it('should not send when no device is registered', async () => {
      // ARRANGE
      aiDraftFindUnique.mockResolvedValue(
        draftRow({
          kind: 'notification',
          payload: { title: 'A title', message: 'A message' },
        })
      )
      getAllUsersTokens.mockResolvedValue([])

      // ACT
      const failure = await approveDraft('draft_1', REVIEWER).catch(
        (error: AppError) => error
      )

      // ASSERT
      expect((failure as AppError).statusCode).toBe(404)
      expect(sendExpoNotification).not.toHaveBeenCalled()
    })
  })

  describe('guards', () => {
    it('should refuse to approve a draft that is not pending', async () => {
      // ARRANGE
      aiDraftFindUnique.mockResolvedValue(draftRow({ status: 'approved' }))

      // ACT
      const failure = await approveDraft('draft_1', REVIEWER).catch(
        (error: AppError) => error
      )

      // ASSERT
      // Without this an approved quest draft could be applied twice, creating
      // a second quest under a title the first one already holds.
      expect((failure as AppError).code).toBe('DRAFT_NOT_PENDING')
      expect(updateDocument).not.toHaveBeenCalled()
    })

    it('should refuse to reject a draft that is not pending', async () => {
      // ARRANGE
      aiDraftFindUnique.mockResolvedValue(draftRow({ status: 'rejected' }))

      // ACT
      const failure = await rejectDraft('draft_1', REVIEWER).catch(
        (error: AppError) => error
      )

      // ASSERT
      expect((failure as AppError).code).toBe('DRAFT_NOT_PENDING')
    })

    it('should raise 404 for an unknown draft', async () => {
      // ARRANGE
      aiDraftFindUnique.mockResolvedValue(null)

      // ACT
      const failure = await approveDraft('nope', REVIEWER).catch(
        (error: AppError) => error
      )

      // ASSERT
      expect((failure as AppError).statusCode).toBe(404)
    })
  })
})
