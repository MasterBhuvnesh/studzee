/**
 * UNIT TEST FOR THE QUEST ROUTES
 *
 * The router applies auth once at router level, like progress.route.ts. What
 * is pinned here:
 *
 * 1. Auth runs before body validation and controllers, so an unauthenticated
 *    caller gets 401 and learns nothing else.
 * 2. The completion body must be one well formed response sheet; anything
 *    malformed never reaches the controller.
 * 3. Unknown method path pairs fall through to 404.
 *
 * Clerk itself is not involved. The auth middleware is replaced with stubs
 * whose behaviour each test controls. Rate limiter and validator run for real.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import express from 'express'
import request from 'supertest'

const {
  clerkAuthMiddleware,
  requireAuth,
  listQuests,
  submitQuestCompletion,
  order,
} = vi.hoisted(() => {
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
    listQuests: vi.fn((_req: express.Request, res: express.Response) => {
      order.push('listController')
      res.status(200).json({ success: true, data: [] })
    }),
    submitQuestCompletion: vi.fn(
      (_req: express.Request, res: express.Response) => {
        order.push('completeController')
        res.status(200).json({ success: true, data: {} })
      }
    ),
  }
})

vi.mock('@/middleware/auth', () => ({ clerkAuthMiddleware, requireAuth }))
vi.mock('@/api/controllers/quest.controller', () => ({
  listQuests,
  submitQuestCompletion,
}))

const buildApp = async () => {
  const { default: questRoute } = await import('@/api/routes/quest.route')
  return express().use(express.json()).use('/quests', questRoute)
}

describe('/quests routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    order.length = 0
    // The 401 test below replaces this implementation; restore it so later
    // tests see the pass through stub again.
    requireAuth.mockImplementation((_req, _res, next) => {
      order.push('requireAuth')
      next()
    })
  })

  describe('GET /quests', () => {
    it('reaches the list controller behind router level auth', async () => {
      const res = await request(await buildApp()).get('/quests')

      expect(res.status).toBe(200)
      expect(listQuests).toHaveBeenCalledTimes(1)
      expect(order).toEqual(['auth', 'requireAuth', 'listController'])
    })
  })

  describe('POST /quests/:id/complete', () => {
    it('runs auth ahead of validation and the controller', async () => {
      const res = await request(await buildApp())
        .post('/quests/q1/complete')
        .send({ responses: { q1: 0 } })

      expect(res.status).toBe(200)
      expect(order.indexOf('auth')).toBeLessThan(order.indexOf('requireAuth'))
      expect(order.indexOf('requireAuth')).toBeLessThan(
        order.indexOf('completeController')
      )
    })

    it.each([
      ['an empty read_blog sheet', {}],
      ['numeric option indices', { responses: { q1: 0 } }],
      ['free text answers', { responses: { q1: 'partition' } }],
    ])('accepts %s', async (_label, body) => {
      const res = await request(await buildApp())
        .post('/quests/q1/complete')
        .send(body)

      expect(res.status).toBe(200)
      expect(submitQuestCompletion).toHaveBeenCalledTimes(1)
    })

    it.each([
      ['a boolean response value', { responses: { q1: true } }],
      ['a non object response sheet', { responses: 'none' }],
    ])('answers 400 for %s', async (_label, body) => {
      const res = await request(await buildApp())
        .post('/quests/q1/complete')
        .send(body)

      expect(res.status).toBe(400)
      expect(res.body.message).toBe('Validation error')
      expect(submitQuestCompletion).not.toHaveBeenCalled()
    })

    it('answers 401 without validating when unauthenticated', async () => {
      requireAuth.mockImplementation((_req, res) => {
        order.push('requireAuth')
        res.status(401).json({ message: 'Unauthenticated' })
      })

      const res = await request(await buildApp())
        .post('/quests/q1/complete')
        .send({ responses: { q1: true } })

      expect(res.status).toBe(401)
      expect(res.body.message).toBe('Unauthenticated')
      expect(submitQuestCompletion).not.toHaveBeenCalled()
    })
  })

  it('answers 404 for an unknown method path pair on the mount', async () => {
    const res = await request(await buildApp()).delete('/quests')

    expect(res.status).toBe(404)
    expect(listQuests).not.toHaveBeenCalled()
    expect(submitQuestCompletion).not.toHaveBeenCalled()
  })
})
