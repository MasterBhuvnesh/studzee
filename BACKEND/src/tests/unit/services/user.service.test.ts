/**
 * UNIT TESTS FOR THE USER SERVICE
 *
 * Mostly thin Prisma delegation, so these target the three places it makes a
 * decision of its own:
 *
 * 1. registerOrUpdateUser deduplicates device tokens. Without that, a device
 *    that re-registers on every app launch accumulates duplicate entries and is
 *    counted more than once as a broadcast recipient.
 * 2. The paging arithmetic in getUsers, where an off by one either hides the
 *    first record of every page or repeats it.
 * 3. removeExpoTokens, which computes how many tokens it actually removed. The
 *    nightly cleanup job and the post-broadcast prune both report that number.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getAllUsersTokens,
  getUserEmails,
  getUsers,
  getUsersByEmails,
  registerOrUpdateUser,
  removeExpoTokens,
} from '@/services/user.service'

const { user } = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
}))

vi.mock('@/config', () => ({ prisma: { user } }))

describe('registerOrUpdateUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create the user on first sight with the token in an array', async () => {
    user.findUnique.mockResolvedValue(null)
    user.create.mockResolvedValue({ id: 1 })

    await registerOrUpdateUser('clerk_1', 'a@example.test', 'ExponentPushToken[a]')

    expect(user.create).toHaveBeenCalledWith({
      data: {
        clerkId: 'clerk_1',
        email: 'a@example.test',
        expoTokens: ['ExponentPushToken[a]'],
      },
    })
    expect(user.update).not.toHaveBeenCalled()
  })

  it('should append a new token to an existing user', async () => {
    user.findUnique.mockResolvedValue({
      clerkId: 'clerk_1',
      expoTokens: ['ExponentPushToken[a]'],
    })
    user.update.mockResolvedValue({ id: 1 })

    await registerOrUpdateUser('clerk_1', 'a@example.test', 'ExponentPushToken[b]')

    expect(user.update).toHaveBeenCalledWith({
      where: { clerkId: 'clerk_1' },
      data: {
        email: 'a@example.test',
        expoTokens: ['ExponentPushToken[a]', 'ExponentPushToken[b]'],
      },
    })
    expect(user.create).not.toHaveBeenCalled()
  })

  it('should not duplicate a token the user already has', async () => {
    user.findUnique.mockResolvedValue({
      clerkId: 'clerk_1',
      expoTokens: ['ExponentPushToken[a]'],
    })
    user.update.mockResolvedValue({ id: 1 })

    await registerOrUpdateUser('clerk_1', 'a@example.test', 'ExponentPushToken[a]')

    // Re-registering the same device is the common case, on every app launch.
    expect(user.update.mock.calls[0][0].data.expoTokens).toEqual([
      'ExponentPushToken[a]',
    ])
  })

  it('should refresh the email on an existing user', async () => {
    user.findUnique.mockResolvedValue({ clerkId: 'clerk_1', expoTokens: [] })
    user.update.mockResolvedValue({ id: 1 })

    await registerOrUpdateUser('clerk_1', 'new@example.test', 'ExponentPushToken[a]')

    expect(user.update.mock.calls[0][0].data.email).toBe('new@example.test')
  })
})

describe('getUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not skip anything on page 1', async () => {
    user.findMany.mockResolvedValue([])
    user.count.mockResolvedValue(0)

    await getUsers(1, 20)

    expect(user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 20 })
    )
  })

  it('should skip (page - 1) * limit on a later page', async () => {
    user.findMany.mockResolvedValue([])
    user.count.mockResolvedValue(0)

    await getUsers(4, 25)

    expect(user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 75, take: 25 })
    )
  })

  it('should round the page count up on a partial last page', async () => {
    user.findMany.mockResolvedValue([])
    user.count.mockResolvedValue(21)

    const result = await getUsers(1, 20)

    expect(result.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 21,
      totalPages: 2,
    })
  })

  it('should report zero pages for an empty table', async () => {
    user.findMany.mockResolvedValue([])
    user.count.mockResolvedValue(0)

    const result = await getUsers(1, 20)

    expect(result.pagination.totalPages).toBe(0)
  })

  it('should order newest first', async () => {
    user.findMany.mockResolvedValue([])
    user.count.mockResolvedValue(0)

    await getUsers(1, 20)

    expect(user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: 'desc' } })
    )
  })
})

describe('token and email lookups', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should flatten every user token into one list', async () => {
    user.findMany.mockResolvedValue([
      { expoTokens: ['a', 'b'] },
      { expoTokens: ['c'] },
      { expoTokens: [] },
    ])

    expect(await getAllUsersTokens()).toEqual(['a', 'b', 'c'])
  })

  it('should return an empty list when nobody has registered', async () => {
    user.findMany.mockResolvedValue([])

    expect(await getAllUsersTokens()).toEqual([])
  })

  it('should map rows down to email strings', async () => {
    user.findMany.mockResolvedValue([
      { email: 'a@example.test' },
      { email: 'b@example.test' },
    ])

    expect(await getUserEmails()).toEqual(['a@example.test', 'b@example.test'])
  })

  it('should look users up by the supplied email list', async () => {
    user.findMany.mockResolvedValue([])

    await getUsersByEmails(['a@example.test', 'b@example.test'])

    expect(user.findMany).toHaveBeenCalledWith({
      where: { email: { in: ['a@example.test', 'b@example.test'] } },
    })
  })
})

describe('removeExpoTokens', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should do nothing and touch no query for an empty list', async () => {
    expect(await removeExpoTokens([])).toBe(0)
    expect(user.findMany).not.toHaveBeenCalled()
    expect(user.update).not.toHaveBeenCalled()
  })

  it('should strip the retired tokens and keep the rest', async () => {
    user.findMany.mockResolvedValue([{ id: 1, expoTokens: ['dead', 'alive'] }])
    user.update.mockResolvedValue({})

    const removed = await removeExpoTokens(['dead'])

    expect(removed).toBe(1)
    expect(user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { expoTokens: ['alive'] },
    })
  })

  it('should count removals across several users', async () => {
    user.findMany.mockResolvedValue([
      { id: 1, expoTokens: ['dead1', 'alive'] },
      { id: 2, expoTokens: ['dead1', 'dead2'] },
    ])
    user.update.mockResolvedValue({})

    expect(await removeExpoTokens(['dead1', 'dead2'])).toBe(3)
    expect(user.update).toHaveBeenCalledTimes(2)
  })

  it('should leave a user untouched in the returned count when nothing matched', async () => {
    user.findMany.mockResolvedValue([{ id: 1, expoTokens: ['alive'] }])
    user.update.mockResolvedValue({})

    expect(await removeExpoTokens(['dead'])).toBe(0)
  })

  it('should return 0 when no user holds any of the tokens', async () => {
    user.findMany.mockResolvedValue([])

    expect(await removeExpoTokens(['dead'])).toBe(0)
    expect(user.update).not.toHaveBeenCalled()
  })
})
