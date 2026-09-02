import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as AdminController from '@/api/controllers/admin.controller'
import * as ContentService from '@/services/content.service'
import { Request, Response, NextFunction } from 'express'

vi.mock('@/services/content.service')

describe('AdminController - getDocument', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: NextFunction

  beforeEach(() => {
    vi.clearAllMocks()
    mockReq = { params: { id: 'doc1' } }
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    }
    mockNext = vi.fn() as unknown as NextFunction
  })

  it('returns the whole document regardless of unlockPoints', async () => {
    // ARRANGE: a gated document. The admin read must not consult points.
    const gated = { title: 'Gated', unlockPoints: 500, quiz: {}, content: {} }
    vi.mocked(ContentService.getContentById).mockResolvedValue(gated as never)

    // ACT
    await AdminController.getDocument(
      mockReq as Request,
      mockRes as Response,
      mockNext
    )

    // ASSERT
    expect(ContentService.getContentById).toHaveBeenCalledWith('doc1')
    expect(mockRes.json).toHaveBeenCalledWith(gated)
    expect(mockNext).not.toHaveBeenCalled()
  })

  it('returns 404 when the document does not exist', async () => {
    // ARRANGE
    vi.mocked(ContentService.getContentById).mockResolvedValue(null)

    // ACT
    await AdminController.getDocument(
      mockReq as Request,
      mockRes as Response,
      mockNext
    )

    // ASSERT
    expect(mockRes.status).toHaveBeenCalledWith(404)
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Document not found' })
  })

  it('passes an unexpected error to next rather than swallowing it', async () => {
    // ARRANGE
    const boom = new Error('mongo is down')
    vi.mocked(ContentService.getContentById).mockRejectedValue(boom)

    // ACT
    await AdminController.getDocument(
      mockReq as Request,
      mockRes as Response,
      mockNext
    )

    // ASSERT
    expect(mockNext).toHaveBeenCalledWith(boom)
  })
})
