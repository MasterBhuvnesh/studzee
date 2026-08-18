/**
 * UNIT TESTS FOR THE REQUEST VALIDATION MIDDLEWARE
 *
 * These two sit in front of every route that accepts input. The behaviour worth
 * pinning is not that they reject bad input, which Zod does, but what they do
 * with good input:
 *
 * - validateBody replaces req.body with the parsed result, so handlers receive
 *   coerced and stripped data. If that assignment were dropped, unknown keys
 *   posted by a client would reach the handler untouched.
 * - validateQuery writes to res.locals instead, because req.query is a getter on
 *   Express 4 and assigning to it throws. A handler reading req.query after this
 *   middleware gets the raw strings, not the coerced values.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextFunction, Request, Response } from 'express'
import { z } from 'zod'
import { validateBody, validateQuery } from '@/middleware/validation'

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

const bodySchema = z.object({
  email: z.string().email(),
  title: z.string().min(1),
})

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

describe('validateBody', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call next and not respond when the body is valid', () => {
    const req = { body: { email: 'a@example.test', title: 'Hello' } } as Request
    const res = buildRes()
    const next = vi.fn()

    validateBody(bodySchema)(req, res, next as unknown as NextFunction)

    expect(next).toHaveBeenCalledTimes(1)
    expect(res.status).not.toHaveBeenCalled()
  })

  it('should strip keys the schema does not declare', () => {
    const req = {
      body: { email: 'a@example.test', title: 'Hello', isAdmin: true },
    } as Request
    const res = buildRes()

    validateBody(bodySchema)(req, res, vi.fn() as unknown as NextFunction)

    // The handler must not see isAdmin. This is the assignment on line 19 of
    // the middleware doing its job; without it the raw body passes through.
    expect(req.body).toEqual({ email: 'a@example.test', title: 'Hello' })
    expect(req.body).not.toHaveProperty('isAdmin')
  })

  it('should answer 400 and not call next when the body is invalid', () => {
    const req = { body: { email: 'not-an-email', title: '' } } as Request
    const res = buildRes()
    const next = vi.fn()

    validateBody(bodySchema)(req, res, next as unknown as NextFunction)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(next).not.toHaveBeenCalled()
  })

  it('should name the offending fields in the error response', () => {
    const req = { body: { email: 'not-an-email', title: '' } } as Request
    const res = buildRes()

    validateBody(bodySchema)(req, res, vi.fn() as unknown as NextFunction)

    const body = res.json.mock.calls[0][0]
    expect(body.message).toBe('Validation error')
    expect(Object.keys(body.errors)).toEqual(
      expect.arrayContaining(['email', 'title'])
    )
  })

  it('should reject a missing body rather than throwing', () => {
    const req = { body: undefined } as unknown as Request
    const res = buildRes()

    validateBody(bodySchema)(req, res, vi.fn() as unknown as NextFunction)

    expect(res.status).toHaveBeenCalledWith(400)
  })
})

describe('validateQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should put the coerced result on res.locals, not req.query', () => {
    const req = { query: { page: '3', limit: '50' } } as unknown as Request
    const res = buildRes()

    validateQuery(querySchema)(req, res, vi.fn() as unknown as NextFunction)

    // Numbers on res.locals, strings still on req.query. A handler reading
    // req.query here would be doing arithmetic on strings.
    expect(res.locals.query).toEqual({ page: 3, limit: 50 })
    expect(req.query).toEqual({ page: '3', limit: '50' })
  })

  it('should apply schema defaults when the query is empty', () => {
    const req = { query: {} } as unknown as Request
    const res = buildRes()
    const next = vi.fn()

    validateQuery(querySchema)(req, res, next as unknown as NextFunction)

    expect(res.locals.query).toEqual({ page: 1, limit: 20 })
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('should answer 400 on a value outside the allowed range', () => {
    const req = { query: { limit: '500' } } as unknown as Request
    const res = buildRes()
    const next = vi.fn()

    validateQuery(querySchema)(req, res, next as unknown as NextFunction)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Invalid query parameters' })
    )
    expect(next).not.toHaveBeenCalled()
  })

  it('should answer 400 on a non numeric page', () => {
    const req = { query: { page: 'abc' } } as unknown as Request
    const res = buildRes()

    validateQuery(querySchema)(req, res, vi.fn() as unknown as NextFunction)

    expect(res.status).toHaveBeenCalledWith(400)
  })
})
