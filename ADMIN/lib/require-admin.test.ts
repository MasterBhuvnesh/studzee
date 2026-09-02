import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockAuth = vi.fn()
const mockClerkClient = { users: { getUser: vi.fn() } }

vi.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
  clerkClient: () => Promise.resolve(mockClerkClient),
}))

import { requireAdminUser } from './require-admin'

describe('requireAdminUser', () => {
  beforeEach(() => {
    mockAuth.mockReset()
    mockClerkClient.users.getUser.mockReset()
  })

  it('returns the user and primary email when publicMetadata.role is admin', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_1' })
    mockClerkClient.users.getUser.mockResolvedValue({
      id: 'user_1',
      publicMetadata: { role: 'admin' },
      primaryEmailAddressId: 'idn_2',
      emailAddresses: [
        { id: 'idn_1', emailAddress: 'old@studzee.in' },
        { id: 'idn_2', emailAddress: 'admin@studzee.in' },
      ],
    })

    const result = await requireAdminUser()

    expect(result).toEqual({
      ok: true,
      user: { id: 'user_1', email: 'admin@studzee.in' },
    })
  })

  it('returns not-admin when publicMetadata.role is not admin', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_2' })
    mockClerkClient.users.getUser.mockResolvedValue({
      id: 'user_2',
      publicMetadata: {},
      primaryEmailAddressId: null,
      emailAddresses: [],
    })

    const result = await requireAdminUser()

    expect(result).toEqual({ ok: false, reason: 'not-admin' })
  })

  it('returns unauthenticated when there is no signed-in user', async () => {
    mockAuth.mockResolvedValue({ userId: null })

    const result = await requireAdminUser()

    expect(result).toEqual({ ok: false, reason: 'unauthenticated' })
    expect(mockClerkClient.users.getUser).not.toHaveBeenCalled()
  })
})
