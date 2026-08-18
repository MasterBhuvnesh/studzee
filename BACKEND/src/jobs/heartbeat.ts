import axios from 'axios'
import cron from 'node-cron'
import { config } from '@/config'
import logger from '@/utils/logger'

/**
 * Ping the service's own health endpoint so the host does not idle the
 * instance out.
 *
 * The previous implementation returned unless NODE_ENV was 'test', which meant
 * the keepalive never ran in the one environment that needs it. It now runs
 * whenever HEALTHCHECK_URL is configured and the process is not under test.
 */
export const startHeartbeatJob = () => {
  if (config.NODE_ENV === 'test') {
    return
  }

  if (!config.HEALTHCHECK_URL) {
    logger.info('HEALTHCHECK_URL not set, skipping the heartbeat job')
    return
  }

  logger.info('Scheduling the heartbeat job every 14 minutes')

  cron.schedule('*/14 * * * *', async () => {
    try {
      const response = await axios.get(config.HEALTHCHECK_URL!, {
        timeout: 10000,
      })
      logger.debug(`Heartbeat succeeded with status ${response.status}`)
    } catch (error) {
      logger.error(error, 'Heartbeat failed')
    }
  })
}
