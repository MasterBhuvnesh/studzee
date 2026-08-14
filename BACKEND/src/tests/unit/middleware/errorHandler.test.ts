/**
 * UNIT TESTS FOR THE ERROR HANDLING MIDDLEWARE
 *
 * This pair sits behind every route in the application, so it decides what a
 * client sees when anything fails. Two behaviours matter enough to pin:
 *
 * 1. A 500 must not leak the underlying error message. Anything else should
 *    report its own message, because those are deliberate and useful.
 * 2. The stack trace is attached only outside production. Shipping a stack to a
 *    client hands over absolute paths and the internal module layout.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextFunction, Request, Response } from 'express'
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler'
import type { AppError } from '@/types/errors'

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

const buildReq = (overrides: Partial<Request> = {}) =>
  ({ path: '/content', originalUrl: '/content', ...overrides }) as Request

const mockNext = vi.fn() as unknown as NextFunction

// errorHandler reads process.env.NODE_ENV directly rather than the parsed
// config, so the development branch is only reachable by setting it here.
const originalNodeEnv = process.env.NODE_ENV

describe('notFoundHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should forward a 404 error naming the URL that missed', () => {
    const next = vi.fn()
    notFoundHandler(
      buildReq({ originalUrl: '/does-not-exist' }),
      buildRes(),
      next as unknown as NextFunction
    )

    expect(next).toHaveBeenCalledTimes(1)
    const error = next.mock.calls[0][0] as AppError
    expect(error.statusCode).toBe(404)
    expect(error.message).toBe('Not Found - /does-not-exist')
  })

  it('should not answer the request itself', () => {
    const res = buildRes()
    notFoundHandler(buildReq(), res, vi.fn() as unknown as NextFunction)

    // It hands off to the error handler rather than responding, so a single
    // place is responsible for the response shape.
    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).not.toHaveBeenCalled()
  })
})

describe('errorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv
  })

  it('should default to 500 when the error carries no status code', () => {
    const res = buildRes()
    errorHandler(new Error('boom') as AppError, buildReq(), res, mockNext)

    expect(res.status).toHaveBeenCalledWith(500)
  })

  it('should hide the underlying message on a 500', () => {
    const res = buildRes()
    const err = new Error('connect ECONNREFUSED 10.0.0.4:5432') as AppError

    errorHandler(err, buildReq(), res, mockNext)

    // The real message names internal hosts and ports. A client gets the
    // generic text instead.
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Internal Server Error' })
    )
    const body = res.json.mock.calls[0][0]
    expect(body.message).not.toContain('ECONNREFUSED')
  })

  it('should pass through the message on a non 500 status', () => {
    const res = buildRes()
    const err = new Error('Document not found') as AppError
    err.statusCode = 404

    errorHandler(err, buildReq(), res, mockNext)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Document not found' })
    )
  })

  it('should omit the stack outside development', () => {
    process.env.NODE_ENV = 'production'
    const res = buildRes()

    errorHandler(new Error('boom') as AppError, buildReq(), res, mockNext)

    expect(res.json.mock.calls[0][0]).not.toHaveProperty('stack')
  })

  it('should include the stack in development', () => {
    process.env.NODE_ENV = 'development'
    const res = buildRes()
    const err = new Error('boom') as AppError
    err.stack = 'Error: boom\n    at somewhere'

    errorHandler(err, buildReq(), res, mockNext)

    expect(res.json.mock.calls[0][0]).toHaveProperty(
      'stack',
      'Error: boom\n    at somewhere'
    )
  })

  it('should keep the stack out of the response under NODE_ENV=test', () => {
    // The suite runs as 'test', so this is the configuration the rest of the
    // tests observe. Pinned so a change to the branch cannot go unnoticed.
    process.env.NODE_ENV = 'test'
    const res = buildRes()

    errorHandler(new Error('boom') as AppError, buildReq(), res, mockNext)

    expect(res.json.mock.calls[0][0]).not.toHaveProperty('stack')
  })
})
