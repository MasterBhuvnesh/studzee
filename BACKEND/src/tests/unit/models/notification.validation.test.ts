/**
 * UNIT TESTS FOR THE NOTIFICATION AND EMAIL SCHEMAS
 *
 * These are the single source of truth for the request shapes on the
 * notification and admin routes, so they are the outermost trust boundary the
 * service has. Two of them carry logic beyond field types and are the reason
 * this file is worth testing at all:
 *
 * - SendNotificationSchema has a refine, so `sendToAll: false` with no
 *   recipients is rejected. Without it a broadcast silently goes to nobody and
 *   reports success.
 * - ListQuerySchema coerces and bounds the paging values. The limit ceiling is
 *   what stops a client asking for the entire table in one request.
 */

import { describe, expect, it } from 'vitest'
import {
  ListQuerySchema,
  RegisterUserSchema,
  SendEmailSchema,
  SendNotificationSchema,
} from '@/models/notification.validation'

describe('RegisterUserSchema', () => {
  it('should accept a well formed registration', () => {
    const result = RegisterUserSchema.safeParse({
      email: 'a@example.test',
      expoToken: 'ExponentPushToken[abcdef]',
    })

    expect(result.success).toBe(true)
  })

  it('should reject an invalid email address', () => {
    const result = RegisterUserSchema.safeParse({
      email: 'not-an-email',
      expoToken: 'ExponentPushToken[abcdef]',
    })

    expect(result.success).toBe(false)
  })

  it('should reject a token that is not an Expo push token', () => {
    const result = RegisterUserSchema.safeParse({
      email: 'a@example.test',
      expoToken: 'fcm-token-from-the-wrong-provider',
    })

    // Expo rejects a malformed token at send time, long after registration, so
    // catching the shape here is what keeps the token table usable.
    expect(result.success).toBe(false)
  })

  it('should reject an empty token', () => {
    expect(
      RegisterUserSchema.safeParse({ email: 'a@example.test', expoToken: '' })
        .success
    ).toBe(false)
  })
})

describe('SendNotificationSchema', () => {
  const base = { title: 'Results', message: 'Out now' }

  it('should accept a broadcast with no recipient list', () => {
    expect(
      SendNotificationSchema.safeParse({ ...base, sendToAll: true }).success
    ).toBe(true)
  })

  it('should accept a targeted send with recipients', () => {
    expect(
      SendNotificationSchema.safeParse({
        ...base,
        sendToAll: false,
        emails: ['a@example.test'],
      }).success
    ).toBe(true)
  })

  it('should reject a targeted send with no recipients', () => {
    const result = SendNotificationSchema.safeParse({
      ...base,
      sendToAll: false,
    })

    // Otherwise the send resolves against an empty device set and reports
    // success while reaching nobody.
    expect(result.success).toBe(false)
  })

  it('should reject a targeted send with an empty recipient array', () => {
    expect(
      SendNotificationSchema.safeParse({
        ...base,
        sendToAll: false,
        emails: [],
      }).success
    ).toBe(false)
  })

  it('should report the refine failure against the emails field', () => {
    const result = SendNotificationSchema.safeParse({
      ...base,
      sendToAll: false,
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors).toHaveProperty('emails')
    }
  })

  it('should reject an empty title or message', () => {
    expect(
      SendNotificationSchema.safeParse({ ...base, title: '', sendToAll: true })
        .success
    ).toBe(false)
    expect(
      SendNotificationSchema.safeParse({ ...base, message: '', sendToAll: true })
        .success
    ).toBe(false)
  })

  it('should reject an imageUrl that is not a URL', () => {
    expect(
      SendNotificationSchema.safeParse({
        ...base,
        sendToAll: true,
        imageUrl: 'not-a-url',
      }).success
    ).toBe(false)
  })
})

describe('SendEmailSchema', () => {
  const base = {
    emails: ['a@example.test'],
    subject: 'Subject',
    title: 'Title',
    body: 'Body',
  }

  it('should accept the minimum required fields', () => {
    expect(SendEmailSchema.safeParse(base).success).toBe(true)
  })

  it('should reject an empty recipient list', () => {
    expect(SendEmailSchema.safeParse({ ...base, emails: [] }).success).toBe(
      false
    )
  })

  it('should reject a non URL banner or attachment', () => {
    expect(
      SendEmailSchema.safeParse({ ...base, banner: 'not-a-url' }).success
    ).toBe(false)
    expect(
      SendEmailSchema.safeParse({ ...base, pdfUrls: ['not-a-url'] }).success
    ).toBe(false)
  })

  it('should accept optional attachments when they are URLs', () => {
    expect(
      SendEmailSchema.safeParse({
        ...base,
        banner: 'https://cdn.test/b.png',
        footer: 'Studzee',
        pdfUrls: ['https://cdn.test/a.pdf'],
      }).success
    ).toBe(true)
  })
})

describe('ListQuerySchema', () => {
  it('should default an empty query to page 1, limit 20, newest first', () => {
    const result = ListQuerySchema.parse({})

    expect(result).toEqual({ page: 1, limit: 20, order: 'desc' })
  })

  it('should coerce numeric strings from the query string', () => {
    const result = ListQuerySchema.parse({ page: '3', limit: '50' })

    // Everything on req.query is a string, so without coercion the paging
    // arithmetic downstream produces NaN rather than failing loudly.
    expect(result.page).toBe(3)
    expect(result.limit).toBe(50)
  })

  it('should cap the limit at 100', () => {
    expect(ListQuerySchema.safeParse({ limit: '1000' }).success).toBe(false)
  })

  it('should reject a page below 1', () => {
    expect(ListQuerySchema.safeParse({ page: '0' }).success).toBe(false)
    expect(ListQuerySchema.safeParse({ page: '-2' }).success).toBe(false)
  })

  it('should reject a non integer page', () => {
    expect(ListQuerySchema.safeParse({ page: '1.5' }).success).toBe(false)
  })

  it('should only allow asc or desc for order', () => {
    expect(ListQuerySchema.safeParse({ order: 'asc' }).success).toBe(true)
    expect(ListQuerySchema.safeParse({ order: 'sideways' }).success).toBe(false)
  })

  it('should leave sortBy free, because the service allowlists it', () => {
    // The schema deliberately does not constrain this. resolveSortField in the
    // notification service is what stops an arbitrary column reaching Prisma.
    expect(ListQuerySchema.safeParse({ sortBy: 'anything' }).success).toBe(true)
  })
})
