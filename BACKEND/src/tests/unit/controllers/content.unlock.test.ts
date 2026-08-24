/**
 * UNIT TESTS FOR THE UNLOCK GATE IN getDocumentById
 *
 * The gate is the one place a content read depends on Postgres state, so its
 * behaviour is pinned separately from the main content controller suite:
 *
 * 1. A document with unlockPoints above the caller's total answers 403
 *    CONTENT_LOCKED through next(), so the error handler formats it like any
 *    other AppError.
 * 2. The check runs only after the cache backed lookup resolved, and only for
 *    callers that actually carry a user id. Everything else behaves exactly as
 *    it did before the gate existed.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppError } from '@/types/errors'
import { NextFunction, Request, Response } from 'express'

vi.mock('@/services/content.service')
vi.mock('@/services/progress.service', () => ({
  getUserTotalPoints: vi.fn(),
}))

import * as ContentController from '@/api/controllers/content.controller'
import { getContentById } from '@/services/content.service'
import { getUserTotalPoints } from '@/services/progress.service'

const DOC_ID = '507f1f77bcf86cd799439011'

const buildDocument = (unlockPoints?: number) => ({
  _id: DOC_ID,
  title: 'Gated Doc',
  summary: 'Summary',
  content: { text: 'Body' },
  quiz: {},
  ...(unlockPoints === undefined ? {} : { unlockPoints }),
})

describe('getDocumentById unlock gate', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()

    mockReq = {
      params: { id: DOC_ID },
      auth: vi.fn().mockReturnValue({ userId: 'clerk_user_1' }),
    }
    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    }
    mockNext = vi.fn()
  })

  const call = () =>
    ContentController.getDocumentById(
      mockReq as Request,
      mockRes as Response,
      mockNext as unknown as NextFunction
    )

  it('answers 403 CONTENT_LOCKED when points are below the cost', async () => {
    vi.mocked(getContentById).mockResolvedValue(buildDocument(50) as never)
    vi.mocked(getUserTotalPoints).mockResolvedValue(10)

    await call()

    expect(mockNext).toHaveBeenCalledTimes(1)
    const error = mockNext.mock.calls[0][0] as AppError
    expect(error.statusCode).toBe(403)
    expect(error.code).toBe('CONTENT_LOCKED')
    expect(error.message).toContain('50')
    expect(error.message).toContain('10')
    expect(mockRes.json).not.toHaveBeenCalled()
  })

  it('serves the document once the total reaches the cost', async () => {
    const document = buildDocument(100)
    vi.mocked(getContentById).mockResolvedValue(document as never)
    vi.mocked(getUserTotalPoints).mockResolvedValue(120)

    await call()

    expect(mockNext).not.toHaveBeenCalled()
    expect(mockRes.json).toHaveBeenCalledWith(document)
  })

  it('checks points only after the cache backed lookup resolved', async () => {
    vi.mocked(getContentById).mockResolvedValue(buildDocument(50) as never)
    vi.mocked(getUserTotalPoints).mockResolvedValue(0)

    await call()

    expect(vi.mocked(getContentById).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(getUserTotalPoints).mock.invocationCallOrder[0]
    )
  })

  it('does not consult points at all when the document has no cost', async () => {
    const document = buildDocument()
    vi.mocked(getContentById).mockResolvedValue(document as never)
    vi.mocked(getUserTotalPoints).mockResolvedValue(0)

    await call()

    expect(mockRes.json).toHaveBeenCalledWith(document)
    expect(getUserTotalPoints).not.toHaveBeenCalled()
  })

  it('leaves requests without an authenticated identity ungated', async () => {
    mockReq.auth = vi.fn().mockReturnValue({ userId: null })
    const document = buildDocument(50)
    vi.mocked(getContentById).mockResolvedValue(document as never)
    vi.mocked(getUserTotalPoints).mockResolvedValue(0)

    await call()

    expect(mockRes.json).toHaveBeenCalledWith(document)
    expect(getUserTotalPoints).not.toHaveBeenCalled()
  })
})
