import { prisma } from '@/config'
import logger from '@/utils/logger'

/**
 * Create the user on first sight, or attach a new device token to an existing
 * one. Tokens are deduplicated so a device that re-registers does not add a
 * second entry.
 */
export const registerOrUpdateUser = async (
  clerkId: string,
  email: string,
  expoToken: string
) => {
  const existingUser = await prisma.user.findUnique({ where: { clerkId } })

  if (!existingUser) {
    return prisma.user.create({
      data: { clerkId, email, expoTokens: [expoToken] },
    })
  }

  const expoTokens = existingUser.expoTokens.includes(expoToken)
    ? existingUser.expoTokens
    : [...existingUser.expoTokens, expoToken]

  return prisma.user.update({
    where: { clerkId },
    data: { email, expoTokens },
  })
}

export const getUsersByEmails = async (emails: string[]) =>
  prisma.user.findMany({ where: { email: { in: emails } } })

/**
 * Every push token across every user, for a send-to-all broadcast.
 */
export const getAllUsersTokens = async (): Promise<string[]> => {
  const users = await prisma.user.findMany({ select: { expoTokens: true } })
  return users.flatMap((user) => user.expoTokens)
}

export const getUsers = async (page: number, limit: number) => {
  const skip = (page - 1) * limit

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count(),
  ])

  return {
    users,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}

export const getUserEmails = async (): Promise<string[]> => {
  const users = await prisma.user.findMany({ select: { email: true } })
  return users.map((user) => user.email)
}

/**
 * Remove push tokens Expo has reported as retired.
 *
 * Called after a broadcast and by the nightly cleanup job, so tokens for
 * uninstalled apps stop accumulating and stop being counted as recipients.
 */
export const removeExpoTokens = async (tokens: string[]): Promise<number> => {
  if (tokens.length === 0) return 0

  const affected = await prisma.user.findMany({
    where: { expoTokens: { hasSome: tokens } },
    select: { id: true, expoTokens: true },
  })

  let removed = 0

  for (const user of affected) {
    const remaining = user.expoTokens.filter((token) => !tokens.includes(token))
    removed += user.expoTokens.length - remaining.length
    await prisma.user.update({
      where: { id: user.id },
      data: { expoTokens: remaining },
    })
  }

  if (removed > 0) {
    logger.info(`Removed ${removed} retired Expo token(s)`)
  }

  return removed
}
