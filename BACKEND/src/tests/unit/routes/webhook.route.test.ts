/**
 * UNIT TEST FOR THE CLERK WEBHOOK ROUTE
 *
 * This route exists to solve exactly one problem: the handler must receive the
 * exact bytes Clerk signed. express.raw is mounted here, and src/index.ts mounts
 * this router ahead of the global JSON parser for the same reason.
 *
 * If either of those slips, req.body arrives as a parsed object. Re-serialising
 * it would not reproduce the original key order, whitespace or unicode escaping,
 * so signature verification would fail, or worse, pass by accident. The
 * controller refuses a non Buffer body for that reason, and this test proves the
 * route hands it one.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import express from 'express'
import request from 'supertest'

const { handleClerkWebhook } = vi.hoisted(() => ({
  handleClerkWebhook: vi.fn((req: express.Request, res: express.Response) => {
    res.status(200).json({
      isBuffer: Buffer.isBuffer(req.body),
      raw: Buffer.isBuffer(req.body) ? req.body.toString('utf8') : null,
    })
  }),
}))

vi.mock('@/api/controllers/webhook.controller', () => ({ handleClerkWebhook }))

const buildApp = async () => {
  const { default: webhookRoute } = await import('@/api/routes/webhook.route')
  return express().use('/webhooks', webhookRoute)
}

describe('POST /webhooks/clerk', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should deliver the body to the handler as a raw Buffer', async () => {
    const res = await request(await buildApp())
      .post('/webhooks/clerk')
      .set('Content-Type', 'application/json')
      .send('{"type":"user.created"}')

    expect(res.status).toBe(200)
    expect(res.body.isBuffer).toBe(true)
  })

  it('should preserve the bytes exactly, including key order and spacing', async () => {
    // Deliberately not what JSON.stringify would emit: unusual spacing and a
    // unicode escape. Both must survive untouched or the signature is void.
    const payload = '{ "b":1,  "a":"\\u00e9" }'

    const res = await request(await buildApp())
      .post('/webhooks/clerk')
      .set('Content-Type', 'application/json')
      .send(payload)

    expect(res.body.raw).toBe(payload)
  })

  it('should route to the webhook handler', async () => {
    await request(await buildApp())
      .post('/webhooks/clerk')
      .set('Content-Type', 'application/json')
      .send('{}')

    expect(handleClerkWebhook).toHaveBeenCalledTimes(1)
  })

  it('should not accept a GET', async () => {
    const res = await request(await buildApp()).get('/webhooks/clerk')

    expect(res.status).toBe(404)
    expect(handleClerkWebhook).not.toHaveBeenCalled()
  })

  it('should mount no auth middleware, since svix is the authentication', async () => {
    // The endpoint is public on purpose. Clerk sends no user token, so adding
    // requireAuth here would break every delivery.
    const res = await request(await buildApp())
      .post('/webhooks/clerk')
      .set('Content-Type', 'application/json')
      .send('{}')

    expect(res.status).toBe(200)
  })
})
