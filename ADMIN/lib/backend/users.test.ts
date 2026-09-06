import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockBackendFetch = vi.fn()
vi.mock('./client', () => ({
  backendFetch: (...args: unknown[]) => mockBackendFetch(...args),
}))

import { listUsers, listUserEmails } from './users'

describe('users backend client', () => {
  beforeEach(() => mockBackendFetch.mockReset())

  it('listUsers reads /admin/users with paging', async () => {
    mockBackendFetch.mockResolvedValue({
      users: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    })

    await listUsers({ page: 1, limit: 20 })

    expect(mockBackendFetch).toHaveBeenCalledWith('/admin/users?page=1&limit=20')
  })

  it('listUserEmails unwraps the data envelope', async () => {
    mockBackendFetch.mockResolvedValue({
      data: ['a@b.com', 'c@d.com'],
      meta: { total: 2 },
    })

    const result = await listUserEmails()

    expect(mockBackendFetch).toHaveBeenCalledWith('/admin/users/emails')
    expect(result).toEqual(['a@b.com', 'c@d.com'])
  })
})
