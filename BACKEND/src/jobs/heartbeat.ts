import axios from 'axios'
import cron from 'node-cron'

import logger from '@/utils/logger'

export const startHeartbeatJob = () => {
  if (process.env.NODE_ENV !== 'production') {
    logger.info('⏱️  - Skipping heartbeat cron: Not in production.')
    return
  }

  const healthUrl = process.env.HEALTHCHECK_URL

  if (!healthUrl) {
    logger.error('HEALTHCHECK_URL not set in .env')
    return
  }

  logger.info('✅  Scheduling heartbeat job every 14 minutes')

  cron.schedule('*/14 * * * *', async () => {
    logger.info('🫀  - Running heartbeat check...')
    try {
      const response = await axios.get(healthUrl)
      logger.info(`✅  - Healthcheck successful: ${response.status}`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      logger.error('❌  - Healthcheck failed:', err.message)
    }
  })
}
