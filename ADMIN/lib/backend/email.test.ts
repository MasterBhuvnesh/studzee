import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockBackendFetch = vi.fn()
vi.mock('./client', () => ({
  backendFetch: (...args: unknown[]) => mockBackendFetch(...args),
}))

import { sendEmail, listEmailLogs } from './email'

describe('email backend client', () => {
  beforeEach(() => mockBackendFetch.mockReset())

  it('sendEmail posts to /admin/emails/send and returns recipients and messageId', async () => {
    mockBackendFetch.mockResolvedValue({
      message: 'Email sent',
      data: { recipients: 1, messageId: 'msg-123' },
    })

    const result = await sendEmail({
      emails: ['a@b.com'],
      subject: 's',
      title: 't',
      body: 'b',
    })

    expect(mockBackendFetch).toHaveBeenCalledWith('/admin/emails/send', {
      method: 'POST',
      body: { emails: ['a@b.com'], subject: 's', title: 't', body: 'b' },
    })
    expect(result.data.recipients).toBe(1)
    expect(result.data.messageId).toBe('msg-123')
  })

  it('listEmailLogs reads /admin/emails/logs with paging', async () => {
    mockBackendFetch.mockResolvedValue({
      logs: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    })

    await listEmailLogs({ page: 1, limit: 20 })

    expect(mockBackendFetch).toHaveBeenCalledWith(
      '/admin/emails/logs?page=1&limit=20&order=desc'
    )
  })
})
