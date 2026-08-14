/**
 * UNIT TESTS FOR THE AUTH MIDDLEWARE
 *
 * This is the file that decides who reaches an authenticated route and who
 * reaches the admin surface, so the cases that matter are the refusals rather
 * than the happy paths.
 *
 * No real Clerk token is involved and none should be. Both Clerk entry points
 * are replaced at the module boundary: clerkMiddleware from @clerk/express and
 * clerkClient from @clerk/clerk-sdk-node. A real session JWT would make the
 * suite network dependent and would expire within a minute of being minted.
 * The live token path is verified separately by hand against a running server.
 *
 * auth.ts reads config.NODE_ENV once at module load, into isDevelopmentMode, so
 * each environment has to be exercised through a fresh import rather than by
 * reassigning a value after the fact.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextFunction, Request, Response } from 'express'

const DEV_TOKEN = 'dev-token-for-tests'

const clerkMiddlewareInner = vi.fn()
const clerkMiddleware = vi.fn(() => clerkMiddlewareInner)
const getUser = vi.fn()

/**
 * Import auth.ts against a specific config. resetModules is what makes the
 * module level isDevelopmentMode pick up the new value.
 */
const loadAuth = async (
  configOverrides: Record<string, unknown> = {}
): Promise<typeof import('@/middleware/auth')> => {
  vi.resetModules()

  vi.doMock('@/config', () => ({
    config: { NODE_ENV: 'development', DEV_TOKEN, ...configOverrides },
  }))
  vi.doMock('@clerk/express', () => ({ clerkMiddleware }))
  vi.doMock('@clerk/clerk-sdk-node', () => ({
    clerkClient: { users: { getUser } },
  }))
  vi.doMock('@/utils/logger', () => ({
    default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
  }))

  return import('@/middleware/auth')
}

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

const buildReq = (authHeader?: string, auth?: () => { userId: string | null }) =>
  ({
    headers: authHeader ? { authorization: authHeader } : {},
    auth,
  }) as unknown as Request

describe('clerkAuthMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should accept the DEV_TOKEN in development and skip Clerk entirely', async () => {
    const { clerkAuthMiddleware } = await loadAuth()
    const req = buildReq(`Bearer ${DEV_TOKEN}`)
    const next = vi.fn()

    clerkAuthMiddleware(req, buildRes(), next as unknown as NextFunction)

    expect(next).toHaveBeenCalledTimes(1)
    expect(clerkMiddleware).not.toHaveBeenCalled()
    // It installs a stand-in auth() so downstream requireAuth has something to read.
    expect(req.auth().userId).toBe('dev-user-id')
  })

  it('should ignore the DEV_TOKEN outside development', async () => {
    const { clerkAuthMiddleware } = await loadAuth({ NODE_ENV: 'production' })
    const req = buildReq(`Bearer ${DEV_TOKEN}`)

    clerkAuthMiddleware(req, buildRes(), vi.fn() as unknown as NextFunction)

    // The bypass must not exist in production even with the right value.
    expect(clerkMiddleware).toHaveBeenCalledTimes(1)
  })

  it('should ignore the DEV_TOKEN when none is configured', async () => {
    const { clerkAuthMiddleware } = await loadAuth({ DEV_TOKEN: undefined })
    const req = buildReq('Bearer anything')

    clerkAuthMiddleware(req, buildRes(), vi.fn() as unknown as NextFunction)

    expect(clerkMiddleware).toHaveBeenCalledTimes(1)
  })

  it('should fall through to Clerk when the token does not match', async () => {
    const { clerkAuthMiddleware } = await loadAuth()
    const req = buildReq('Bearer some-other-token')

    clerkAuthMiddleware(req, buildRes(), vi.fn() as unknown as NextFunction)

    expect(clerkMiddleware).toHaveBeenCalledTimes(1)
    expect(clerkMiddlewareInner).toHaveBeenCalledTimes(1)
  })

  it('should fall through to Clerk when no Authorization header is present', async () => {
    const { clerkAuthMiddleware } = await loadAuth()

    clerkAuthMiddleware(
      buildReq(),
      buildRes(),
      vi.fn() as unknown as NextFunction
    )

    expect(clerkMiddleware).toHaveBeenCalledTimes(1)
  })
})

describe('requireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call next when a userId is present', async () => {
    const { requireAuth } = await loadAuth()
    const next = vi.fn()
    const res = buildRes()

    requireAuth(
      buildReq(undefined, () => ({ userId: 'user_123' })),
      res,
      next as unknown as NextFunction
    )

    expect(next).toHaveBeenCalledTimes(1)
    expect(res.status).not.toHaveBeenCalled()
  })

  it('should answer 401 when there is no userId', async () => {
    const { requireAuth } = await loadAuth()
    const next = vi.fn()
    const res = buildRes()

    requireAuth(
      buildReq(undefined, () => ({ userId: null })),
      res,
      next as unknown as NextFunction
    )

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthenticated' })
    expect(next).not.toHaveBeenCalled()
  })
})

describe('requireAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should grant admin to the dev user in development without asking Clerk', async () => {
    const { requireAdmin } = await loadAuth()
    const next = vi.fn()

    await requireAdmin(
      buildReq(undefined, () => ({ userId: 'dev-user-id' })),
      buildRes(),
      next as unknown as NextFunction
    )

    expect(next).toHaveBeenCalledTimes(1)
    expect(getUser).not.toHaveBeenCalled()
  })

  it('should not grant the dev bypass in production', async () => {
    const { requireAdmin } = await loadAuth({ NODE_ENV: 'production' })
    getUser.mockResolvedValue({ publicMetadata: { role: 'user' } })
    const res = buildRes()

    await requireAdmin(
      buildReq(undefined, () => ({ userId: 'dev-user-id' })),
      res,
      vi.fn() as unknown as NextFunction
    )

    // Even the magic id has to prove its role once the bypass is off.
    expect(getUser).toHaveBeenCalledWith('dev-user-id')
    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should allow a user whose Clerk metadata says admin', async () => {
    const { requireAdmin } = await loadAuth({ NODE_ENV: 'production' })
    getUser.mockResolvedValue({ publicMetadata: { role: 'admin' } })
    const next = vi.fn()
    const res = buildRes()

    await requireAdmin(
      buildReq(undefined, () => ({ userId: 'user_admin' })),
      res,
      next as unknown as NextFunction
    )

    expect(next).toHaveBeenCalledTimes(1)
    expect(res.status).not.toHaveBeenCalled()
  })

  it('should answer 403 for a non admin role', async () => {
    const { requireAdmin } = await loadAuth({ NODE_ENV: 'production' })
    getUser.mockResolvedValue({ publicMetadata: { role: 'editor' } })
    const res = buildRes()
    const next = vi.fn()

    await requireAdmin(
      buildReq(undefined, () => ({ userId: 'user_editor' })),
      res,
      next as unknown as NextFunction
    )

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden: admin only' })
    expect(next).not.toHaveBeenCalled()
  })

  it('should answer 403 when publicMetadata carries no role at all', async () => {
    const { requireAdmin } = await loadAuth({ NODE_ENV: 'production' })
    getUser.mockResolvedValue({ publicMetadata: {} })
    const res = buildRes()

    await requireAdmin(
      buildReq(undefined, () => ({ userId: 'user_plain' })),
      res,
      vi.fn() as unknown as NextFunction
    )

    // This is the default state of a freshly created Clerk user. Admin is
    // granted by hand in the dashboard, so absent must mean denied.
    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should answer 401 when there is no userId', async () => {
    const { requireAdmin } = await loadAuth({ NODE_ENV: 'production' })
    const res = buildRes()

    await requireAdmin(
      buildReq(undefined, () => ({ userId: null })),
      res,
      vi.fn() as unknown as NextFunction
    )

    expect(res.status).toHaveBeenCalledWith(401)
    expect(getUser).not.toHaveBeenCalled()
  })

  it('should answer 500 rather than passing through when Clerk is unreachable', async () => {
    const { requireAdmin } = await loadAuth({ NODE_ENV: 'production' })
    getUser.mockRejectedValue(new Error('clerk unreachable'))
    const res = buildRes()
    const next = vi.fn()

    await requireAdmin(
      buildReq(undefined, () => ({ userId: 'user_123' })),
      res,
      next as unknown as NextFunction
    )

    // A Clerk outage must not become an open admin surface.
    expect(res.status).toHaveBeenCalledWith(500)
    expect(next).not.toHaveBeenCalled()
  })
})
