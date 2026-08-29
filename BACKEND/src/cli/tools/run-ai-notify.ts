import {
  connectDB,
  connectPostgres,
  disconnectDB,
  disconnectPostgres,
} from '@/config'
import { draftNewContentNotifications } from '@/jobs/ai-notify'
import logger from '@/utils/logger'

/**
 * Run the notification drafting job now rather than waiting for 01:00 UTC.
 *
 * Running it twice in a row is the check that dedupe works: the second run
 * should report everything skipped and draft nothing.
 */
const run = async () => {
  logger.info('Connecting to databases...')
  await connectDB()
  await connectPostgres()

  logger.info('Manually triggering notification drafting...')
  const summary = await draftNewContentNotifications()

  logger.info('Disconnecting from databases...')
  await disconnectDB()
  await disconnectPostgres()

  logger.info(summary, 'Job finished.')
  process.exit(0)
}

run().catch((error) => {
  logger.error(error, 'Error running the notification drafting job')
  process.exit(1)
})
