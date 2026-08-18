/**
 * UNIT TESTS FOR THE PER ROUTE RATE LIMITER
 *
 * A thin factory over express-rate-limit, so there is exactly one thing to
 * check: that the caller's window and ceiling reach the library, and that the
 * header options are the ones intended. Getting `standardHeaders` wrong is
 * silent, the limiter still works and clients simply lose the RateLimit headers
 * they use to back off.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { rateLimitMiddleware } from '@/middleware/rateLimit'

// The argument type is declared on vi.fn rather than as a parameter, so
// mock.calls is a one element tuple that can be indexed below without leaving
// an unused binding behind.
const { rateLimit } = vi.hoisted(() => ({
  rateLimit: vi.fn<[Record<string, unknown>], string>(
    () => 'middleware-instance'
  ),
}))

vi.mock('express-rate-limit', () => ({ default: rateLimit }))

describe('rateLimitMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should pass the caller window and max straight through', () => {
    rateLimitMiddleware({ windowMs: 60_000, max: 5 })

    expect(rateLimit).toHaveBeenCalledWith(
      expect.objectContaining({ windowMs: 60_000, max: 5 })
    )
  })

  it('should send standard headers and not the legacy ones', () => {
    rateLimitMiddleware({ windowMs: 1000, max: 1 })

    expect(rateLimit).toHaveBeenCalledWith(
      expect.objectContaining({ standardHeaders: true, legacyHeaders: false })
    )
  })

  it('should return a JSON message rather than the library default string', () => {
    rateLimitMiddleware({ windowMs: 1000, max: 1 })

    // The rest of the API answers with a { message } object. A bare string here
    // would be the one response shape a client cannot parse the same way.
    expect(rateLimit.mock.calls[0][0].message).toEqual({
      message: 'Too many requests, please try again later.',
    })
  })

  it('should return whatever the library builds', () => {
    expect(rateLimitMiddleware({ windowMs: 1000, max: 1 })).toBe(
      'middleware-instance'
    )
  })
})
