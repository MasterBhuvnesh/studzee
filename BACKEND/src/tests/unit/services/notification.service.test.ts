/**
 * UNIT TESTS FOR THE NOTIFICATION SERVICE
 *
 * The service is a thin layer over Prisma, so these tests target the two places
 * where it makes decisions of its own rather than delegating:
 *
 * 1. resolveSortField, which is an allowlist. The sort column arrives from the
 *    query string and is interpolated into the Prisma orderBy object, so an
 *    unchecked value would reach the query builder.
 * 2. The paging arithmetic, where an off by one in the skip calculation either
 *    hides the first record of every page or repeats it.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

const notification = {
  create: vi.fn(),
  findMany: vi.fn(),
  count: vi.fn(),
}

const emailLog = {
  create: vi.fn(),
  findMany: vi.fn(),
  count: vi.fn(),
}

// The service imports only prisma from the config barrel. Replacing the whole
// module keeps the real config out of the test, so no environment is required.
vi.mock('@/config', () => ({ prisma: { notification, emailLog } }))

const {
  getEmailLogs,
  getNotifications,
  resolveSortField,
  saveEmailLog,
  saveNotification,
} = await import('@/services/notification.service')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('resolveSortField', () => {
  it.each(['createdAt', 'status', 'sentBy'])('accepts %s', (field) => {
    expect(resolveSortField(field)).toBe(field)
  })

  it('falls back to createdAt when the field is absent', () => {
    expect(resolveSortField(undefined)).toBe('createdAt')
  })

  it.each([
    ['an unknown column', 'password'],
    ['a nested relation path', 'user.email'],
    ['an empty string', ''],
    ['a prototype key', '__proto__'],
  ])('rejects %s', (_label, field) => {
    expect(resolveSortField(field)).toBe('createdAt')
  })
})

describe('getNotifications', () => {
  beforeEach(() => {
    notification.findMany.mockResolvedValue([])
    notification.count.mockResolvedValue(0)
  })

  it('does not skip any rows on the first page', async () => {
    await getNotifications(1, 20, 'createdAt', 'desc')

    expect(notification.findMany).toHaveBeenCalledWith({
      skip: 0,
      take: 20,
      orderBy: { createdAt: 'desc' },
    })
  })

  it('skips the pages before the one requested', async () => {
    await getNotifications(3, 20, 'status', 'asc')

    expect(notification.findMany).toHaveBeenCalledWith({
      skip: 40,
      take: 20,
      orderBy: { status: 'asc' },
    })
  })

  it('rounds the page count up so a partial last page is reachable', async () => {
    notification.count.mockResolvedValue(41)

    const result = await getNotifications(1, 20, 'createdAt', 'desc')

    expect(result.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 41,
      totalPages: 3,
    })
  })

  it('reports no pages when there are no rows', async () => {
    const result = await getNotifications(1, 20, 'createdAt', 'desc')

    expect(result.pagination.totalPages).toBe(0)
    expect(result.notifications).toEqual([])
  })

  it('returns the rows Prisma produced', async () => {
    const rows = [{ id: 'n1' }, { id: 'n2' }]
    notification.findMany.mockResolvedValue(rows)
    notification.count.mockResolvedValue(2)

    const result = await getNotifications(1, 20, 'createdAt', 'desc')

    expect(result.notifications).toBe(rows)
  })
})

describe('getEmailLogs', () => {
  beforeEach(() => {
    emailLog.findMany.mockResolvedValue([])
    emailLog.count.mockResolvedValue(0)
  })

  it('applies the same paging arithmetic as the notification listing', async () => {
    await getEmailLogs(2, 15, 'sentBy', 'asc')

    expect(emailLog.findMany).toHaveBeenCalledWith({
      skip: 15,
      take: 15,
      orderBy: { sentBy: 'asc' },
    })
  })

  it('returns the rows under the logs key', async () => {
    const rows = [{ id: 'e1' }]
    emailLog.findMany.mockResolvedValue(rows)
    emailLog.count.mockResolvedValue(1)

    const result = await getEmailLogs(1, 20, 'createdAt', 'desc')

    expect(result.logs).toBe(rows)
    expect(result.pagination.totalPages).toBe(1)
  })
})

describe('audit writes', () => {
  it('stores the notification record as given', async () => {
    const record = {
      title: 'Exam update',
      message: 'Timetable published',
      sentBy: 'user_admin',
      sentTo: [],
      sentToAll: true,
      status: 'sent',
    }

    await saveNotification(record)

    expect(notification.create).toHaveBeenCalledWith({ data: record })
  })

  it('stores the email log record as given', async () => {
    const record = {
      subject: 'Results',
      message: 'Attached',
      pdfUrls: ['https://example.test/a.pdf'],
      sentBy: 'user_admin',
      sentTo: ['student@example.test'],
      status: 'sent',
    }

    await saveEmailLog(record)

    expect(emailLog.create).toHaveBeenCalledWith({ data: record })
  })
})
