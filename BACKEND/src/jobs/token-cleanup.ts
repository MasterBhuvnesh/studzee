import cron from 'node-cron'
import { prisma } from '@/config'
import { config } from '@/config'
import logger from '@/utils/logger'
import { removeExpoTokens } from '@/services/user.service'

/**
 * Drop push tokens that are no longer usable.
 *
 * Structural validation only catches malformed entries. Tokens for uninstalled
 * apps look valid, so the real pruning happens in the notification controller,
 * which removes any token Expo reports as DeviceNotRegistered at send time.
 * This job is the backstop for anything malformed that got stored anyway.
 */
export const cleanupExpoTokens = async (): Promise<number> => {
  const users = await prisma.user.findMany({
    select: { id: true, expoTokens: true },
  })

  const malformed = users.flatMap((user) =>
    user.expoTokens.filter((token) => !token.startsWith('ExponentPushToken['))
  )

  if (malformed.length === 0) {
    logger.info('Token cleanup: nothing to remove')
    return 0
  }

  return removeExpoTokens(malformed)
}

export const startTokenCleanupJob = () => {
  if (config.NODE_ENV !== 'production') {
    logger.info('Skipping the token cleanup job outside production')
    return
  }

  logger.info('Scheduling the token cleanup job daily at 02:00 UTC')

  cron.schedule(
    '0 2 * * *',
    async () => {
      try {
        const removed = await cleanupExpoTokens()
        logger.info(`Token cleanup finished, removed ${removed} token(s)`)
      } catch (error) {
        logger.error(error, 'Token cleanup failed')
      }
    },
    { timezone: 'UTC' }
  )
}
