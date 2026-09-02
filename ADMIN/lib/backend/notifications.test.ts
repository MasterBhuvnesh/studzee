import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockBackendFetch = vi.fn()
vi.mock('./client', () => ({
  backendFetch: (...args: unknown[]) => mockBackendFetch(...args),
}))

import { sendNotification, listNotifications } from './notifications'

describe('notifications backend client', () => {
  beforeEach(() => mockBackendFetch.mockReset())

  it('sendNotification posts to /admin/notifications/send', async () => {
    mockBackendFetch.mockResolvedValue({ message: 'ok' })

    await sendNotification({ title: 'x', message: 'y', sendToAll: true })

    expect(mockBackendFetch).toHaveBeenCalledWith('/admin/notifications/send', {
      method: 'POST',
      body: { title: 'x', message: 'y', sendToAll: true },
    })
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
