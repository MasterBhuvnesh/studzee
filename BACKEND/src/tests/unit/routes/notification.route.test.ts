/**
 * UNIT TEST FOR THE DEVICE REGISTRATION ROUTE
 *
 * The only route in the tree with four middleware ahead of its handler, and the
 * order is the thing worth pinning. Auth runs before validation, so an
 * unauthenticated caller gets 401 and learns nothing about the schema. If those
 * two were swapped, an anonymous request with a malformed body would come back
 * 400 with the field names, which is a free description of the API to someone
 * who has not authenticated.
 *
 * Clerk itself is not involved. The auth middleware is replaced with a stub
 * whose behaviour each test controls.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import express from 'express'
import request from 'supertest'

const { clerkAuthMiddleware, requireAuth, registerDevice, order } = vi.hoisted(
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
      registerDevice: vi.fn((_req: express.Request, res: express.Response) => {
        order.push('controller')
        res.status(200).json({ message: 'Device registered successfully' })
      }),
    }
  }
)

vi.mock('@/middleware/auth', () => ({ clerkAuthMiddleware, requireAuth }))
vi.mock('@/api/controllers/notification.controller', () => ({ registerDevice }))

const buildApp = async () => {
  const { default: notificationRoute } =
    await import('@/api/routes/notification.route')
  return express().use(express.json()).use('/notifications', notificationRoute)
}

const valid = {
  email: 'a@example.test',
  expoToken: 'ExponentPushToken[abcdef]',
}

describe('POST /notifications/register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    order.length = 0
    requireAuth.mockImplementation((_req, _res, next) => {
      order.push('requireAuth')
      next()
    })
  })

  it('should reach the controller with a valid authenticated request', async () => {
    const res = await request(await buildApp())
      .post('/notifications/register')
      .send(valid)

    expect(res.status).toBe(200)
    expect(registerDevice).toHaveBeenCalledTimes(1)
  })

  it('should run auth before the body is validated', async () => {
    await request(await buildApp())
      .post('/notifications/register')
      .send(valid)

    expect(order.indexOf('auth')).toBeLessThan(order.indexOf('controller'))
    expect(order.indexOf('requireAuth')).toBeLessThan(
      order.indexOf('controller')
    )
  })

  it('should answer 401 without validating when the caller is unauthenticated', async () => {
    requireAuth.mockImplementation((_req, res) => {
      order.push('requireAuth')
      res.status(401).json({ message: 'Unauthenticated' })
    })

    const res = await request(await buildApp())
      .post('/notifications/register')
      .send({ email: 'nonsense', expoToken: '' })

    // 401 rather than 400: the schema is never described to an anonymous caller.
    expect(res.status).toBe(401)
    expect(res.body.message).toBe('Unauthenticated')
    expect(registerDevice).not.toHaveBeenCalled()
  })

  it('should answer 400 on an invalid body once authenticated', async () => {
    const res = await request(await buildApp())
      .post('/notifications/register')
      .send({ email: 'not-an-email', expoToken: 'fcm-token' })

    expect(res.status).toBe(400)
    expect(res.body.message).toBe('Validation error')
    expect(registerDevice).not.toHaveBeenCalled()
  })

  it('should name both offending fields', async () => {
    const res = await request(await buildApp())
      .post('/notifications/register')
      .send({ email: 'not-an-email', expoToken: 'fcm-token' })

    expect(Object.keys(res.body.errors)).toEqual(
      expect.arrayContaining(['email', 'expoToken'])
    )
  })

  it('should not accept a GET', async () => {
    const res = await request(await buildApp()).get('/notifications/register')

    expect(res.status).toBe(404)
    expect(clerkAuthMiddleware).not.toHaveBeenCalled()
  })
})
