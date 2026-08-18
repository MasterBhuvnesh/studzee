/**
 * UNIT TEST FOR THE ROOT HEALTHCHECK ROUTE
 *
 * Mounted at '/' in src/index.ts, so this serves GET /healthcheck. It is the
 * shallowest of the three health endpoints: it touches no dependency and only
 * proves the process is accepting connections. That is exactly what makes it
 * the wrong thing to point a load balancer at, and why /health/readiness
 * exists alongside it.
 */

import { describe, expect, it } from 'vitest'
import express from 'express'
import request from 'supertest'
import healthcheckRoute from '@/api/routes/healthcheck.route'

const app = express().use('/', healthcheckRoute)

describe('GET /healthcheck', () => {
  it('should answer 200 with an ok status', async () => {
    const res = await request(app).get('/healthcheck')

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  })

  it('should carry a parseable ISO timestamp', async () => {
    const res = await request(app).get('/healthcheck')

    expect(Number.isNaN(Date.parse(res.body.timestamp))).toBe(false)
  })

  it('should answer without touching Mongo, Postgres or Redis', async () => {
    // No mocks are registered in this file and nothing is running, so a green
    // response here is itself the proof that the handler has no dependencies.
    const res = await request(app).get('/healthcheck')

    expect(res.status).toBe(200)
  })

  it('should 404 anything else on the router', async () => {
    expect((await request(app).get('/health')).status).toBe(404)
  })
})
