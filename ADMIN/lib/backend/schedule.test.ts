import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockBackendFetch = vi.fn()
vi.mock('./client', () => ({
  backendFetch: (...args: unknown[]) => mockBackendFetch(...args),
}))

import { listSchedules, scheduleContent, cancelSchedule } from './schedule'

describe('schedule backend client', () => {
  beforeEach(() => mockBackendFetch.mockReset())

  it('listSchedules reads /admin/ai/schedule with filters', async () => {
    mockBackendFetch.mockResolvedValue({
      schedules: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    })

    await listSchedules({ status: 'pending' })

    expect(mockBackendFetch).toHaveBeenCalledWith(
      '/admin/ai/schedule?page=1&limit=20&status=pending'
    )
  })

  it('scheduleContent posts the booking', async () => {
    mockBackendFetch.mockResolvedValue({ message: 'ok', data: {} })

    await scheduleContent({ title: 'Mitosis', runAt: '2026-09-11T10:00' })

    expect(mockBackendFetch).toHaveBeenCalledWith('/admin/ai/schedule/content', {
      method: 'POST',
      body: { title: 'Mitosis', runAt: '2026-09-11T10:00' },
    })
  })

  it('cancelSchedule deletes the booking', async () => {
    mockBackendFetch.mockResolvedValue({ message: 'ok', data: {} })

    await cancelSchedule('s1')

    expect(mockBackendFetch).toHaveBeenCalledWith('/admin/ai/schedule/s1', {
      method: 'DELETE',
    })
  })
})
