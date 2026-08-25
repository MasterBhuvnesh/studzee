import { beforeEach, describe, expect, it, vi } from 'vitest'

import { prisma } from '@/config'
import { getActivityMap } from '@/services/progress.service'

vi.mock('@/config', () => ({
  prisma: {
    dailyActivity: {
      findMany: vi.fn(),
    },
  },
}))

const USER = 'user-1'

const dayAt = (isoDate: string) => ({
  id: `${isoDate}-id`,
  userId: USER,
  date: new Date(`${isoDate}T00:00:00.000Z`),
})

describe('getActivityMap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns ascending day keys and the total for the requested year', async () => {
    vi.mocked(prisma.dailyActivity.findMany).mockResolvedValue([
      dayAt('2026-01-01'),
      dayAt('2026-03-15'),
      dayAt('2026-12-31'),
    ])

    const result = await getActivityMap(USER, 2026)

    expect(result).toEqual({
      year: 2026,
      activeDays: ['2026-01-01', '2026-03-15', '2026-12-31'],
      totalActive: 3,
    })

    // The window must cover exactly the requested calendar year
    expect(prisma.dailyActivity.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: USER,
          date: {
            gte: new Date(Date.UTC(2026, 0, 1)),
            lt: new Date(Date.UTC(2027, 0, 1)),
          },
        },
      })
    )
  })

  it('returns an empty map for a year with no activity', async () => {
    vi.mocked(prisma.dailyActivity.findMany).mockResolvedValue([])

    const result = await getActivityMap(USER, 2024)

    expect(result).toEqual({ year: 2024, activeDays: [], totalActive: 0 })
  })
})
