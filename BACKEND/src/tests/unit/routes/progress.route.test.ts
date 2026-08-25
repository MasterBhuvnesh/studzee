/**
 * UNIT TEST FOR THE PROGRESS ROUTES
 *
 * Unlike the notification route, which carries its middleware per route, this
 * router applies auth once at router level like admin.route.ts does. Two
 * properties are worth pinning:
 *
 * 1. Auth runs before body validation, so an unauthenticated caller gets 401
 *    and learns nothing about the schema.
 * 2. The attempt body is validated: a malformed contentId or a negative option
 *    index never reaches the controller.
 *
 * Clerk itself is not involved. The auth middleware is replaced with stubs
 * whose behaviour each test controls. The rate limiter and validator run for
 * real, matching how notification.route.test.ts exercises them indirectly.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import express from 'express'
import request from 'supertest'

const { clerkAuthMiddleware, requireAuth, recordAttempt, order } = vi.hoisted(
  () => {
    const order: string[] = []
    return {
      order,
      clerkAuthMiddleware: vi.fn(
        (
          _req: express.Request,
          _res: express.Response,
          next: express.NextFunction
        ) => {
          order.push('auth')
          next()
        }
      ),
      requireAuth: vi.fn(
        (
          _req: express.Request,
          _res: express.Response,
          next: express.NextFunction
        ) => {
          order.push('requireAuth')
          next()
        }
      ),
      recordAttempt: vi.fn((_req: express.Request, res: express.Response) => {
        order.push('controller')
        res.status(200).json({ success: true, data: {} })
      }),
    }
  }
)

const getMyProgressSummary = vi.fn(
  (_req: express.Request, res: express.Response) => {
    order.push('summaryController')
    res.status(200).json({ success: true, data: {} })
  }
)

const getMyActivity = vi.fn((_req: express.Request, res: express.Response) => {
  order.push('activityController')
  res.status(200).json({ success: true, data: {} })
})

vi.mock('@/middleware/auth', () => ({ clerkAuthMiddleware, requireAuth }))
vi.mock('@/api/controllers/progress.controller', () => ({
  recordAttempt,
  getMyProgressSummary,
  getMyActivity,
}))

const buildApp = async () => {
  const { default: progressRoute } = await import('@/api/routes/progress.route')
  return express().use(express.json()).use('/progress', progressRoute)
}

const validBody = {
  contentId: '507f1f77bcf86cd799439011',
  responses: { q1: 0 },
}

describe('/progress routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    order.length = 0
    requireAuth.mockImplementation((_req, _res, next) => {
      order.push('requireAuth')
      next()
    })
  })

  describe('POST /progress/attempts', () => {
    it('reaches the controller with a valid authenticated request', async () => {
      const res = await request(await buildApp())
        .post('/progress/attempts')
        .send(validBody)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(recordAttempt).toHaveBeenCalledTimes(1)
    })

    it('runs router level auth ahead of the controller', async () => {
      await request(await buildApp())
        .post('/progress/attempts')
        .send(validBody)

      expect(order.indexOf('auth')).toBeLessThan(order.indexOf('requireAuth'))
      expect(order.indexOf('requireAuth')).toBeLessThan(
        order.indexOf('controller')
      )
    })

    it('answers 401 without validating when unauthenticated', async () => {
      requireAuth.mockImplementation((_req, res) => {
        order.push('requireAuth')
        res.status(401).json({ message: 'Unauthenticated' })
      })

      const res = await request(await buildApp())
        .post('/progress/attempts')
        .send({ contentId: 'nonsense', responses: { q1: -1 } })

      expect(res.status).toBe(401)
      expect(res.body.message).toBe('Unauthenticated')
      expect(recordAttempt).not.toHaveBeenCalled()
    })

    it.each([
      ['a short contentId', { ...validBody, contentId: 'abc123' }],
      ['a negative option index', { ...validBody, responses: { q1: -1 } }],
      [
        'a non numeric option value',
        { ...validBody, responses: { q1: 'top' } },
      ],
      ['missing responses', { contentId: '507f1f77bcf86cd799439011' }],
    ])('answers 400 for %s', async (_label, body) => {
      const res = await request(await buildApp())
        .post('/progress/attempts')
        .send(body)

      expect(res.status).toBe(400)
      expect(res.body.message).toBe('Validation error')
      expect(recordAttempt).not.toHaveBeenCalled()
    })
  })

  describe('GET /progress/me', () => {
    it('reaches the summary controller behind the same auth', async () => {
      const res = await request(await buildApp()).get('/progress/me')

      expect(res.status).toBe(200)
      expect(getMyProgressSummary).toHaveBeenCalledTimes(1)
      expect(order).toEqual(['auth', 'requireAuth', 'summaryController'])
    })
  })

  describe('GET /progress/activity', () => {
    it('reaches the activity controller behind the same auth and defaults the year', async () => {
      const res = await request(await buildApp()).get('/progress/activity')

      expect(res.status).toBe(200)
      expect(getMyActivity).toHaveBeenCalledTimes(1)
      expect(order).toEqual(['auth', 'requireAuth', 'activityController'])
    })

    it.each([
      ['a year before the floor', '?year=2019'],
      ['a non numeric year', '?year=recent'],
      ['a fractional year', '?year=2024.5'],
    ])('answers 400 for %s', async (_label, qs) => {
      const res = await request(await buildApp()).get(`/progress/activity${qs}`)

      expect(res.status).toBe(400)
      expect(res.body.message).toBe('Invalid query parameters')
      expect(getMyActivity).not.toHaveBeenCalled()
    })
  })

  it('answers 404 for an unknown method path pair on the mount', async () => {
    const res = await request(await buildApp()).get('/progress/attempts')

    expect(res.status).toBe(404)
    expect(recordAttempt).not.toHaveBeenCalled()
  })
})
