import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockBackendFetch = vi.fn()
vi.mock('./client', () => ({
  backendFetch: (...args: unknown[]) => mockBackendFetch(...args),
}))

import { sendNotification, listNotifications } from './notifications'

describe('notifications backend client', () => {
  beforeEach(() => mockBackendFetch.mockReset())

  it('sendNotification posts to /admin/notifications/send and returns delivery stats', async () => {
    mockBackendFetch.mockResolvedValue({
      message: 'Notification sent',
      data: { targeted: 10, sent: 10, failed: 0, prunedTokens: 0 },
    })

    const result = await sendNotification({ title: 'x', message: 'y', sendToAll: true })

    expect(mockBackendFetch).toHaveBeenCalledWith('/admin/notifications/send', {
      method: 'POST',
      body: { title: 'x', message: 'y', sendToAll: true },
    })
    expect(result.data.sent).toBe(10)
  })

  it('sendNotification returns partial delivery stats on HTTP 207', async () => {
    mockBackendFetch.mockResolvedValue({
      message: 'Notification partially delivered',
      data: { targeted: 10, sent: 8, failed: 2, prunedTokens: 1 },
    })

    const result = await sendNotification({ title: 'x', message: 'y', sendToAll: true })

    expect(result.message).toBe('Notification partially delivered')
    expect(result.data.sent).toBe(8)
    expect(result.data.failed).toBe(2)
  })

  it('listNotifications reads /admin/notifications with paging', async () => {
    mockBackendFetch.mockResolvedValue({
      notifications: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    })

    await listNotifications({ page: 2, limit: 10 })

    expect(mockBackendFetch).toHaveBeenCalledWith(
      '/admin/notifications?page=2&limit=10&order=desc'
    )
  })
})
