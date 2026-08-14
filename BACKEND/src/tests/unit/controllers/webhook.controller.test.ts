/**
 * UNIT TESTS FOR THE CLERK WEBHOOK CONTROLLER
 *
 * This endpoint is public. Clerk sends no user token, so the svix signature is
 * the only thing standing between the internet and the welcome email path.
 * The cases that matter are therefore the refusals, plus one structural check:
 * the handler must see a raw Buffer, because a body that has already been
 * through a JSON parser cannot be signature checked. Re-serialising it would
 * not reproduce the original key order, whitespace or unicode escaping.
 *
 * svix is mocked, so no signature is actually computed here. What is pinned is
 * that a verification failure becomes a 400 rather than an unhandled throw, and
 * that an unset secret is a hard failure rather than a skipped check.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Request, Response } from 'express'
import { handleClerkWebhook } from '@/api/controllers/webhook.controller'

const { config, verify, sendWelcomeEmail } = vi.hoisted(() => ({
  config: { CLERK_WEBHOOK_SIGNING_SECRET: 'whsec_test' as string | undefined },
  verify: vi.fn(),
  sendWelcomeEmail: vi.fn(),
}))

vi.mock('@/config', () => ({ config }))
vi.mock('svix', () => ({
  Webhook: class {
    verify = verify
  },
}))
vi.mock('@/services/email.service', () => ({ sendWelcomeEmail }))

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

const svixHeaders = {
  'svix-id': 'msg_1',
  'svix-timestamp': '1786699908',
  'svix-signature': 'v1,abc',
}

const buildReq = (
  overrides: { headers?: Record<string, string>; body?: unknown } = {}
) =>
  ({
    headers: overrides.headers ?? svixHeaders,
    body: 'body' in overrides ? overrides.body : Buffer.from('{}'),
  }) as unknown as Request

const userCreated = (data: Record<string, unknown> = {}) => ({
  type: 'user.created',
  data: {
    id: 'user_1',
    email_addresses: [{ email_address: 'a@example.test', id: 'idn_1' }],
    first_name: 'Ada',
    last_name: 'Lovelace',
    username: 'ada',
    ...data,
  },
})

describe('handleClerkWebhook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    config.CLERK_WEBHOOK_SIGNING_SECRET = 'whsec_test'
    sendWelcomeEmail.mockResolvedValue({ success: true })
  })

  it('should answer 500 when the signing secret is not configured', async () => {
    config.CLERK_WEBHOOK_SIGNING_SECRET = undefined
    const res = buildRes()

    await handleClerkWebhook(buildReq(), res)

    // An unset secret must not degrade into an unauthenticated open endpoint.
    expect(res.status).toHaveBeenCalledWith(500)
    expect(verify).not.toHaveBeenCalled()
  })

  it.each([
    ['svix-id', { 'svix-timestamp': '1', 'svix-signature': 'v1,a' }],
    ['svix-timestamp', { 'svix-id': 'm', 'svix-signature': 'v1,a' }],
    ['svix-signature', { 'svix-id': 'm', 'svix-timestamp': '1' }],
  ])('should answer 400 when %s is missing', async (_name, headers) => {
    const res = buildRes()

    await handleClerkWebhook(buildReq({ headers }), res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Missing required webhook headers',
    })
    expect(verify).not.toHaveBeenCalled()
  })

  it('should answer 500 when the body was parsed before it reached the handler', async () => {
    const res = buildRes()

    await handleClerkWebhook(buildReq({ body: { type: 'user.created' } }), res)

    // A plain object here means express.json ran ahead of express.raw, so the
    // bytes Clerk signed are gone and no signature check is possible.
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Webhook route misconfigured',
    })
    expect(verify).not.toHaveBeenCalled()
  })

  it('should answer 400 when the signature does not verify', async () => {
    verify.mockImplementation(() => {
      throw new Error('No matching signature found')
    })
    const res = buildRes()

    await handleClerkWebhook(buildReq(), res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Webhook verification failed',
    })
    expect(sendWelcomeEmail).not.toHaveBeenCalled()
  })

  it('should verify against the exact bytes received', async () => {
    verify.mockReturnValue(userCreated())
    const raw = Buffer.from('{"type":"user.created"}')

    await handleClerkWebhook(buildReq({ body: raw }), buildRes())

    expect(verify).toHaveBeenCalledWith('{"type":"user.created"}', svixHeaders)
  })

  it('should acknowledge and ignore an event type it does not handle', async () => {
    verify.mockReturnValue({ type: 'user.updated', data: { id: 'user_1' } })
    const res = buildRes()

    await handleClerkWebhook(buildReq(), res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Ignored event: user.updated',
    })
    expect(sendWelcomeEmail).not.toHaveBeenCalled()
  })

  it('should send the welcome email on user.created', async () => {
    verify.mockReturnValue(userCreated())
    const res = buildRes()

    await handleClerkWebhook(buildReq(), res)

    expect(sendWelcomeEmail).toHaveBeenCalledWith('a@example.test', 'Ada')
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Webhook processed',
      emailSent: true,
    })
  })

  it('should fall back to the username when there is no first name', async () => {
    verify.mockReturnValue(userCreated({ first_name: null }))

    await handleClerkWebhook(buildReq(), buildRes())

    expect(sendWelcomeEmail).toHaveBeenCalledWith('a@example.test', 'ada')
  })

  it('should fall back to the email local part when there is no name at all', async () => {
    verify.mockReturnValue(userCreated({ first_name: null, username: null }))

    await handleClerkWebhook(buildReq(), buildRes())

    expect(sendWelcomeEmail).toHaveBeenCalledWith('a@example.test', 'a')
  })

  it('should acknowledge without sending when the new user has no email', async () => {
    verify.mockReturnValue(userCreated({ email_addresses: [] }))
    const res = buildRes()

    await handleClerkWebhook(buildReq(), res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(sendWelcomeEmail).not.toHaveBeenCalled()
  })

  it('should still answer 200 when the welcome email fails', async () => {
    verify.mockReturnValue(userCreated())
    sendWelcomeEmail.mockResolvedValue({ success: false, error: 'SMTP down' })
    const res = buildRes()

    await handleClerkWebhook(buildReq(), res)

    // A non 2xx makes Clerk retry the delivery, which resends the email rather
    // than fixing the mail transport.
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Webhook processed',
      emailSent: false,
    })
  })
})
