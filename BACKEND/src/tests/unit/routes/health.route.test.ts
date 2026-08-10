/**
 * UNIT TESTS FOR THE HEALTH ROUTES
 *
 * Readiness previously reported only MongoDB and Redis, so a Postgres outage
 * left the endpoint answering 200 while every notification endpoint failed.
 * These tests pin that Postgres is probed and that any single failure fails the
 * whole check.
 *
 * They also pin that each probe is a real round trip. Reading
 * `mongoose.connection.readyState` or `redisClient.isOpen` only reports what
 * the driver believes about its socket, which stays optimistic through a
 * partition or a server that has stopped answering.
 */

import express from 'express'
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const ping = vi.fn()
const queryRaw = vi.fn()
const redisPing = vi.fn()
const redisState = { isOpen: true }
const mongoState = { readyState: 1 }

vi.mock('mongoose', () => ({
  default: {
    connection: {
      get readyState() {
        return mongoState.readyState
      },
      db: { admin: () => ({ ping }) },
    },
  },
}))

vi.mock('@/config', () => ({
  prisma: { $queryRaw: (...args: unknown[]) => queryRaw(...args) },
  redisClient: {
    get isOpen() {
      return redisState.isOpen
    },
    ping: () => redisPing(),
  },
}))

const buildApp = async () => {
  const healthRoutes = (await import('@/api/routes/health.route')).default
  const app = express()
  app.use('/health', healthRoutes)
  return app
}

describe('GET /health/liveness', () => {
  it('returns ok without touching any dependency', async () => {
    queryRaw.mockRejectedValue(new Error('postgres is down'))
    ping.mockRejectedValue(new Error('mongo is down'))

    const response = await request(await buildApp()).get('/health/liveness')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: 'ok' })
    expect(queryRaw).not.toHaveBeenCalled()
    expect(ping).not.toHaveBeenCalled()
  })
})

describe('GET /health/readiness', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mongoState.readyState = 1
    redisState.isOpen = true
    ping.mockResolvedValue({ ok: 1 })
    queryRaw.mockResolvedValue([{ '?column?': 1 }])
    redisPing.mockResolvedValue('PONG')
  })

  it('reports every backing store, including Postgres', async () => {
    const response = await request(await buildApp()).get('/health/readiness')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      status: 'ready',
      checks: { db: 'ok', postgres: 'ok', redis: 'ok' },
    })
  })

  it('issues a real round trip to each store rather than reading a flag', async () => {
    await request(await buildApp()).get('/health/readiness')

    expect(ping).toHaveBeenCalled()
    expect(queryRaw).toHaveBeenCalled()
    expect(redisPing).toHaveBeenCalled()
  })

  it('fails the check when Postgres is unreachable', async () => {
    queryRaw.mockRejectedValue(new Error('connection refused'))

    const response = await request(await buildApp()).get('/health/readiness')

    expect(response.status).toBe(503)
    expect(response.body.status).toBe('unavailable')
    expect(response.body.checks).toEqual({
      db: 'ok',
      postgres: 'error',
      redis: 'ok',
    })
  })

  it('fails the check when Mongo answers its socket but not a query', async () => {
    ping.mockRejectedValue(new Error('no primary available'))

    const response = await request(await buildApp()).get('/health/readiness')

    expect(response.status).toBe(503)
    expect(response.body.checks.db).toBe('error')
  })

  it('fails the check when Redis is closed', async () => {
    redisState.isOpen = false

    const response = await request(await buildApp()).get('/health/readiness')

    expect(response.status).toBe(503)
    expect(response.body.checks.redis).toBe('error')
  })

  it('reports every failure at once rather than stopping at the first', async () => {
    queryRaw.mockRejectedValue(new Error('down'))
    ping.mockRejectedValue(new Error('down'))
    redisPing.mockRejectedValue(new Error('down'))

    const response = await request(await buildApp()).get('/health/readiness')

    expect(response.status).toBe(503)
    expect(response.body.checks).toEqual({
      db: 'error',
      postgres: 'error',
      redis: 'error',
    })
  })
})
