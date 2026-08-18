/**
 * UNIT TESTS FOR THE PDF CONTROLLER
 *
 * The odd one out among the controllers: it handles its own errors rather than
 * calling next, because the route mounts no validation middleware and the
 * service parses the query itself. So the ZodError branch here is the only
 * thing turning a bad query string into a 400 instead of a 500.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Request, Response } from 'express'
import { z } from 'zod'
import { listPdfs } from '@/api/controllers/pdf.controller'

const { listPdfsService } = vi.hoisted(() => ({ listPdfsService: vi.fn() }))

vi.mock('@/services/pdf.service', () => ({
  pdfService: { listPdfs: listPdfsService },
}))

const buildRes = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  }
  return res as unknown as Response & {
    status: ReturnType<typeof vi.fn>
    json: ReturnType<typeof vi.fn>
  }
}

describe('listPdfs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should answer 200 with the service result', async () => {
    const payload = { data: [{ name: 'a.pdf' }], meta: { total: 1 } }
    listPdfsService.mockResolvedValue(payload)
    const res = buildRes()

    await listPdfs({ query: { page: '1' } } as unknown as Request, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(payload)
  })

  it('should hand the raw query to the service, which parses it', async () => {
    listPdfsService.mockResolvedValue({ data: [], meta: {} })

    await listPdfs(
      { query: { page: '2', limit: '5' } } as unknown as Request,
      buildRes()
    )

    expect(listPdfsService).toHaveBeenCalledWith({ page: '2', limit: '5' })
  })

  it('should turn a ZodError into a 400 rather than a 500', async () => {
    const schema = z.object({ page: z.coerce.number().int().positive() })
    const parsed = schema.safeParse({ page: 'abc' })
    listPdfsService.mockRejectedValue(
      parsed.success ? new Error('unreachable') : parsed.error
    )
    const res = buildRes()

    await listPdfs({ query: { page: 'abc' } } as unknown as Request, res)

    // This route has no validation middleware, so the branch below is the only
    // thing separating a client mistake from a reported server fault.
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Invalid query parameters' })
    )
  })

  it('should answer 500 on any other failure', async () => {
    listPdfsService.mockRejectedValue(new Error('mongo unreachable'))
    const res = buildRes()

    await listPdfs({ query: {} } as unknown as Request, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Failed to list PDFs' })
    )
  })

  it('should not call next, because this handler owns its errors', async () => {
    listPdfsService.mockRejectedValue(new Error('boom'))
    const res = buildRes()

    // The signature takes no next at all. Answering here rather than delegating
    // is why this controller does not reach the shared error handler.
    await listPdfs({ query: {} } as unknown as Request, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})
