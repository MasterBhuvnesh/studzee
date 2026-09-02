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

  it('listUserEmails reads /admin/users/emails', async () => {
    mockBackendFetch.mockResolvedValue(['a@b.com'])

    const result = await listUserEmails()

    expect(mockBackendFetch).toHaveBeenCalledWith('/admin/users/emails')
    expect(result).toEqual(['a@b.com'])
  })
})
