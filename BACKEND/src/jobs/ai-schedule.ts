import cron from 'node-cron'
import { config } from '@/config'
import { runDueSchedules } from '@/services/ai/schedule.service'
import logger from '@/utils/logger'

/**
 * SCHEDULED DRAFT RUNNER
 *
 * Drains the one shot content bookings an admin made through
 * POST /admin/ai/schedule/content. Due rows become pending AiDrafts, which is
 * where the automation stops: the house rule holds, nothing publishes without
 * an owner approving the draft first.
 *
 * Once a minute is the finest grain worth offering. Generation itself takes
 * tens of seconds, so scheduling to the second would be false precision, and
 * the datetime-local picker on the admin side only resolves to the minute.
 */
export const startAiScheduleJob = () => {
  if (!config.AI_ENABLED) {
    logger.info('Skipping the scheduled draft job, AI_ENABLED is false')
    return
  }

  if (config.NODE_ENV === 'test') {
    return
  }

  logger.info('Scheduling the scheduled draft job every minute (UTC)')

  cron.schedule(
    '* * * * *',
    async () => {
      try {
        await runDueSchedules()
      } catch (error) {
        logger.error(error, 'Scheduled draft job failed')
      }
    },
    { timezone: 'UTC' }
  )
}
