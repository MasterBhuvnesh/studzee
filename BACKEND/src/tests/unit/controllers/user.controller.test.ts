/**
 * UNIT TESTS FOR THE USER CONTROLLER
 *
 * Both handlers delegate straight to the service, so the only decisions they
 * make are where the paging values come from and what the response envelope
 * looks like. The first matters because reading req.query instead of
 * res.locals.query silently yields strings, and `(page - 1) * limit` on a
 * string produces NaN rather than an error.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextFunction, Request, Response } from 'express'
import { listUserEmails, listUsers } from '@/api/controllers/user.controller'

const { getUsers, getUserEmails } = vi.hoisted(() => ({
  getUsers: vi.fn(),
  getUserEmails: vi.fn(),
}))

vi.mock('@/services/user.service', () => ({ getUsers, getUserEmails }))

const buildRes = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    locals: {} as Record<string, unknown>,
  }
  return res as unknown as Response & {
    status: ReturnType<typeof vi.fn>
    json: ReturnType<typeof vi.fn>
    locals: Record<string, unknown>
  }
}

const mockNext = vi.fn() as unknown as NextFunction

describe('listUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should take page and limit from res.locals.query', async () => {
    getUsers.mockResolvedValue({ users: [], pagination: {} })
    const res = buildRes()
    res.locals.query = { page: 3, limit: 25, order: 'desc' }

    await listUsers(
      { query: { page: '99' } } as unknown as Request,
      res,
      mockNext
    )

    // Numbers from the validated query, not the raw strings on req.query.
    expect(getUsers).toHaveBeenCalledWith(3, 25)
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('should return the service result unchanged', async () => {
    const payload = {
      users: [{ id: 1 }],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    }
    getUsers.mockResolvedValue(payload)
    const res = buildRes()
    res.locals.query = { page: 1, limit: 20, order: 'desc' }

    await listUsers({} as Request, res, mockNext)

    expect(res.json).toHaveBeenCalledWith(payload)
  })

  it('should forward an error to next rather than answering', async () => {
    getUsers.mockRejectedValue(new Error('db down'))
    const res = buildRes()
    res.locals.query = { page: 1, limit: 20, order: 'desc' }
    const next = vi.fn()

    await listUsers({} as Request, res, next as unknown as NextFunction)

    expect(next).toHaveBeenCalledWith(expect.any(Error))
    expect(res.status).not.toHaveBeenCalled()
  })
})

describe('listUserEmails', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should wrap the addresses with a total', async () => {
    getUserEmails.mockResolvedValue(['a@example.test', 'b@example.test'])
    const res = buildRes()

    await listUserEmails({} as Request, res, mockNext)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      data: ['a@example.test', 'b@example.test'],
      meta: { total: 2 },
    })
  })

  it('should report a total of zero when nobody has registered', async () => {
    getUserEmails.mockResolvedValue([])
    const res = buildRes()

    await listUserEmails({} as Request, res, mockNext)

    expect(res.json).toHaveBeenCalledWith({ data: [], meta: { total: 0 } })
  })

  it('should forward an error to next', async () => {
    getUserEmails.mockRejectedValue(new Error('db down'))
    const next = vi.fn()

    await listUserEmails(
      {} as Request,
      buildRes(),
      next as unknown as NextFunction
    )

    expect(next).toHaveBeenCalledWith(expect.any(Error))
  })
})
