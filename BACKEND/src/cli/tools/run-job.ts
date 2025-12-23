import logger from '@/utils/logger'
import {
  connectDB,
  disconnectDB,
  connectRedis,
  disconnectRedis,
} from '@/config'
import { refreshCacheJob } from '@/jobs/cache-refresh'

const run = async () => {
  logger.info('Connecting to databases...')
  await connectDB()
  await connectRedis()

  logger.info('Manually triggering cache refresh job...')
  await refreshCacheJob()

  logger.info('Disconnecting from databases...')
  await disconnectDB()
  await disconnectRedis()

  logger.info('Job finished.')
  process.exit(0)
}

run().catch((err) => {
  logger.error('Error running manual job:', err)
  process.exit(1)
})
