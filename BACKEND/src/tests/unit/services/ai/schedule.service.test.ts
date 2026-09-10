/**
 * UNIT TESTS FOR SCHEDULED DRAFTS
 *
 * What are we testing?
 * - Booking a content generation for later, listing and canceling bookings,
 *   and the per minute runner that turns due rows into pending drafts
 *
 * What is mocked?
 * - prisma and the content generator, so no database and no model are needed
 *
 * The behaviours pinned here are the ones with a cost attached. A due row
 * whose input no longer validates must be marked failed rather than
 * generated, because the immediate route would reject that same input. One
 * bad row must not stop the rest, and a failure must stay failed rather than
 * retrying on every tick and spending money in a loop.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

const {
  scheduledFindMany,
  scheduledFindUnique,
  scheduledCreate,
  scheduledUpdate,
  scheduledCount,
  generateContentDraft,
} = vi.hoisted(() => ({
  scheduledFindMany: vi.fn(),
  scheduledFindUnique: vi.fn(),
  scheduledCreate: vi.fn(),
  scheduledUpdate: vi.fn(),
  scheduledCount: vi.fn(),
  generateContentDraft: vi.fn(),
}))

vi.mock('@/config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/config')>()
  return {
    ...actual,
    prisma: {
      scheduledDraft: {
        findMany: scheduledFindMany,
        findUnique: scheduledFindUnique,
        create: scheduledCreate,
        update: scheduledUpdate,
        count: scheduledCount,
      },
    },
  }
})

vi.mock('@/services/ai/generate.service', () => ({ generateContentDraft }))

import {
  cancelScheduledDraft,
  listSchedules,
  runDueSchedules,
  scheduleContentDraft,
} from '@/services/ai/schedule.service'
import { AppError } from '@/types/errors'

const future = () => new Date(Date.now() + 60 * 60 * 1000)

describe('scheduled drafts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('scheduleContentDraft', () => {
    it('should store the generation input with the run time', async () => {
      // ARRANGE
      const runAt = future()
      scheduledCreate.mockImplementation(async ({ data }) => ({
        id: 'sched_1',
        ...data,
      }))

      // ACT
      const result = await scheduleContentDraft(
        { title: 'Photosynthesis', sections: 5, quizCount: 5, runAt },
        'user_admin'
      )

      // ASSERT
      expect(scheduledCreate).toHaveBeenCalledOnce()
      const stored = scheduledCreate.mock.calls[0][0].data
      expect(stored).toMatchObject({
        kind: 'document',
        runAt,
        createdBy: 'user_admin',
      })
      expect(stored.input).toMatchObject({ title: 'Photosynthesis' })
      expect(result.id).toBe('sched_1')
    })
  })

  describe('listSchedules', () => {
    it('should page through bookings soonest first', async () => {
      // ARRANGE
      scheduledFindMany.mockResolvedValue([])
      scheduledCount.mockResolvedValue(0)

      // ACT
      const result = await listSchedules({ page: 1, limit: 20 })

      // ASSERT
      expect(scheduledFindMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 20,
        orderBy: { runAt: 'asc' },
      })
      expect(result.pagination).toMatchObject({ page: 1, total: 0 })
    })
  })

  describe('cancelScheduledDraft', () => {
    it('should cancel a pending booking', async () => {
      // ARRANGE
      scheduledFindUnique.mockResolvedValue({ id: 's1', status: 'pending' })
      scheduledUpdate.mockImplementation(async ({ data }) => ({
        id: 's1',
        ...data,
      }))

      // ACT
      const result = await cancelScheduledDraft('s1')

      // ASSERT
      expect(scheduledUpdate).toHaveBeenCalledWith({
        where: { id: 's1' },
        data: { status: 'canceled' },
      })
      expect(result.status).toBe('canceled')
    })

    it('should raise 404 for an unknown id', async () => {
      // ARRANGE
      scheduledFindUnique.mockResolvedValue(null)

      // ACT
      const failure = await cancelScheduledDraft('missing').catch(
        (error: AppError) => error
      )

      // ASSERT
      expect((failure as AppError).statusCode).toBe(404)
    })

    it('should raise 409 for a settled row', async () => {
      // ARRANGE
      scheduledFindUnique.mockResolvedValue({ id: 's1', status: 'done' })

      // ACT
      const failure = await cancelScheduledDraft('s1').catch(
        (error: AppError) => error
      )

      // ASSERT
      expect((failure as AppError).statusCode).toBe(409)
      expect((failure as AppError).code).toBe('SCHEDULE_SETTLED')
    })
  })

  describe('runDueSchedules', () => {
    it('should generate a draft for each due row and mark it done', async () => {
      // ARRANGE
      const rows = [
        {
          id: 's1',
          input: { title: 'Mitosis', sections: 5, quizCount: 5 },
          createdBy: 'user_admin',
        },
        {
          id: 's2',
          input: { title: 'Meiosis', sections: 5, quizCount: 5 },
          createdBy: 'user_admin',
        },
      ]
      scheduledFindMany.mockResolvedValue(rows)
      generateContentDraft.mockImplementation(async (input: unknown) => ({
        id: `draft_for_${(input as { title: string }).title}`,
      }))
      scheduledUpdate.mockImplementation(async ({ data }) => data)

      // ACT
      const summary = await runDueSchedules()

      // ASSERT
      expect(summary).toEqual({ due: 2, drafted: 2, failed: 0 })
      expect(generateContentDraft).toHaveBeenCalledTimes(2)
      expect(scheduledUpdate).toHaveBeenCalledWith({
        where: { id: 's1' },
        data: { status: 'done', draftId: 'draft_for_Mitosis' },
      })
    })

    it('should fail a row whose input no longer validates without stopping the rest', async () => {
      // ARRANGE
      const rows = [
        { id: 'bad', input: { title: 'x' }, createdBy: 'user_admin' },
        {
          id: 'good',
          input: { title: 'Valid Title Here', sections: 5, quizCount: 5 },
          createdBy: 'user_admin',
        },
      ]
      scheduledFindMany.mockResolvedValue(rows)
      generateContentDraft.mockResolvedValue({ id: 'draft_ok' })
      scheduledUpdate.mockImplementation(async ({ data }) => data)

      // ACT
      const summary = await runDueSchedules()

      // ASSERT
      expect(summary).toEqual({ due: 2, drafted: 1, failed: 1 })
      expect(generateContentDraft).toHaveBeenCalledTimes(1)
      expect(scheduledUpdate).toHaveBeenCalledWith({
        where: { id: 'bad' },
        data: {
          status: 'failed',
          error: 'Scheduled input no longer validates, booking kept as record',
        },
      })
    })

    it('should record a generation failure and continue', async () => {
      // ARRANGE
      const rows = [
        {
          id: 's1',
          input: { title: 'First Valid Title', sections: 5, quizCount: 5 },
          createdBy: 'user_admin',
        },
        {
          id: 's2',
          input: { title: 'Second Valid Title', sections: 5, quizCount: 5 },
          createdBy: 'user_admin',
        },
      ]
      scheduledFindMany.mockResolvedValue(rows)
      generateContentDraft
        .mockRejectedValueOnce(new Error('model endpoint returned 503'))
        .mockResolvedValueOnce({ id: 'draft_ok' })
      scheduledUpdate.mockImplementation(async ({ data }) => data)

      // ACT
      const summary = await runDueSchedules()

      // ASSERT
      expect(summary).toEqual({ due: 2, drafted: 1, failed: 1 })
      expect(scheduledUpdate).toHaveBeenCalledWith({
        where: { id: 's1' },
        data: { status: 'failed', error: 'model endpoint returned 503' },
      })
    })

    it('should do nothing when nothing is due', async () => {
      // ARRANGE
      scheduledFindMany.mockResolvedValue([])

      // ACT
      const summary = await runDueSchedules()

      // ASSERT
      expect(summary).toEqual({ due: 0, drafted: 0, failed: 0 })
      expect(generateContentDraft).not.toHaveBeenCalled()
    })
  })
})
