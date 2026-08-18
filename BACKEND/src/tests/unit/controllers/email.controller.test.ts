/**
 * UNIT TESTS FOR THE EMAIL CONTROLLER
 *
 * Field validation lives on the route, so the controller only coordinates the
 * send and the audit log. Three things there are worth pinning:
 *
 * 1. The audit row is written whether or not delivery succeeded. A failed send
 *    that leaves no trace is the case an admin cannot investigate afterwards.
 * 2. sentBy comes from the verified token, never from the request body, so a
 *    caller cannot attribute a send to someone else.
 * 3. A delivery failure is a 502, not a 200 with a quiet error field.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextFunction, Request, Response } from 'express'
import { listEmailLogs, sendEmail } from '@/api/controllers/email.controller'

const {
  sendEmailWithAttachments,
  getEmailLogs,
  saveEmailLog,
  resolveSortField,
} = vi.hoisted(() => ({
  sendEmailWithAttachments: vi.fn(),
  getEmailLogs: vi.fn(),
  saveEmailLog: vi.fn(),
  resolveSortField: vi.fn((v: string | undefined) => v ?? 'createdAt'),
}))

vi.mock('@/services/email.service', () => ({ sendEmailWithAttachments }))
vi.mock('@/services/notification.service', () => ({
  getEmailLogs,
  saveEmailLog,
  resolveSortField,
}))

const buildRes = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    locals: {} as Record<string, unknown>,
  }
  return res as unknown as Response & {
    status: ReturnType<typeof vi.fn>
    json: ReturnType<typeof vi.fn>
    locals: Record<string, unknown>
  }
}

const mockNext = vi.fn() as unknown as NextFunction

const body = (overrides: Record<string, unknown> = {}) => ({
  emails: ['a@example.test', 'b@example.test'],
  subject: 'Term results',
  title: 'Results are out',
  body: 'Log in to view them.',
  ...overrides,
})

const buildReq = (overrides: Record<string, unknown> = {}) =>
  ({
    body: body(),
    auth: () => ({ userId: 'user_admin' }),
    ...overrides,
  }) as unknown as Request

describe('sendEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    saveEmailLog.mockResolvedValue({})
  })

  it('should answer 200 with the recipient count on a successful send', async () => {
    sendEmailWithAttachments.mockResolvedValue({
      success: true,
      messageId: 'msg_1',
    })
    const res = buildRes()

    await sendEmail(buildReq(), res, mockNext)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Email sent',
      data: { recipients: 2, messageId: 'msg_1' },
    })
  })

  it('should answer 502 when delivery fails', async () => {
    sendEmailWithAttachments.mockResolvedValue({
      success: false,
      error: 'SMTP timeout',
    })
    const res = buildRes()

    await sendEmail(buildReq(), res, mockNext)

    // A transport failure is upstream, not a client error and not a silent 200.
    expect(res.status).toHaveBeenCalledWith(502)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Email delivery failed',
      error: 'SMTP timeout',
    })
  })

  it('should record the audit row as sent on success', async () => {
    sendEmailWithAttachments.mockResolvedValue({
      success: true,
      messageId: 'm',
    })

    await sendEmail(buildReq(), buildRes(), mockNext)

    expect(saveEmailLog).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Term results',
        message: 'Log in to view them.',
        sentTo: ['a@example.test', 'b@example.test'],
        status: 'sent',
      })
    )
  })

  it('should still record an audit row when delivery fails', async () => {
    sendEmailWithAttachments.mockResolvedValue({ success: false, error: 'x' })

    await sendEmail(buildReq(), buildRes(), mockNext)

    // The failed send is the one an admin most needs to find afterwards.
    expect(saveEmailLog).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'failed' })
    )
  })

  it('should take sentBy from the token, not the request body', async () => {
    sendEmailWithAttachments.mockResolvedValue({
      success: true,
      messageId: 'm',
    })
    const req = buildReq({
      body: body({ sentBy: 'user_someone_else' }),
      auth: () => ({ userId: 'user_admin' }),
    })

    await sendEmail(req, buildRes(), mockNext)

    expect(saveEmailLog.mock.calls[0][0].sentBy).toBe('user_admin')
  })

  it('should default pdfUrls to an empty array in the audit row', async () => {
    sendEmailWithAttachments.mockResolvedValue({
      success: true,
      messageId: 'm',
    })

    await sendEmail(buildReq(), buildRes(), mockNext)

    expect(saveEmailLog.mock.calls[0][0].pdfUrls).toEqual([])
  })

  it('should pass attachments through to the mail service', async () => {
    sendEmailWithAttachments.mockResolvedValue({
      success: true,
      messageId: 'm',
    })
    const req = buildReq({
      body: body({
        banner: 'https://cdn.test/b.png',
        footer: 'Studzee',
        pdfUrls: ['https://cdn.test/a.pdf'],
      }),
    })

    await sendEmail(req, buildRes(), mockNext)

    expect(sendEmailWithAttachments).toHaveBeenCalledWith(
      ['a@example.test', 'b@example.test'],
      'Term results',
      'Results are out',
      'Log in to view them.',
      'https://cdn.test/b.png',
      'Studzee',
      ['https://cdn.test/a.pdf']
    )
  })

  it('should forward an unexpected error to next', async () => {
    sendEmailWithAttachments.mockRejectedValue(new Error('boom'))
    const next = vi.fn()
    const res = buildRes()

    await sendEmail(buildReq(), res, next as unknown as NextFunction)

    expect(next).toHaveBeenCalledWith(expect.any(Error))
    expect(res.status).not.toHaveBeenCalled()
  })
})

describe('listEmailLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resolveSortField.mockImplementation(
      (v: string | undefined) => v ?? 'createdAt'
    )
  })

  it('should read paging from res.locals rather than req.query', async () => {
    getEmailLogs.mockResolvedValue({ data: [], meta: {} })
    const res = buildRes()
    res.locals.query = { page: 2, limit: 50, sortBy: 'status', order: 'asc' }

    await listEmailLogs(
      { query: { page: '999' } } as unknown as Request,
      res,
      mockNext
    )

    // req.query still holds raw strings; the validated values are on res.locals.
    expect(getEmailLogs).toHaveBeenCalledWith(2, 50, 'status', 'asc')
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('should push the sort column through the allowlist', async () => {
    getEmailLogs.mockResolvedValue({ data: [], meta: {} })
    const res = buildRes()
    res.locals.query = {
      page: 1,
      limit: 20,
      sortBy: 'DROP TABLE',
      order: 'desc',
    }

    await listEmailLogs({} as Request, res, mockNext)

    expect(resolveSortField).toHaveBeenCalledWith('DROP TABLE')
  })

  it('should forward an error to next', async () => {
    getEmailLogs.mockRejectedValue(new Error('db down'))
    const res = buildRes()
    res.locals.query = { page: 1, limit: 20, order: 'desc' }
    const next = vi.fn()

    await listEmailLogs({} as Request, res, next as unknown as NextFunction)

    expect(next).toHaveBeenCalledWith(expect.any(Error))
  })
})
