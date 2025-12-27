import axios from 'axios';
import cron from 'node-cron';

import { config } from '@/config';
import logger from '@/utils/logger';

export const startHeartbeatJob = () => {
  if (!config.HEALTHCHECK_URL) {
    logger.warn('HEALTHCHECK_URL not set, skipping heartbeat job.');
    return;
  }

  if (process.env.NODE_ENV === 'test') {
    logger.info('Scheduling heartbeat job to run every 5 minutes');

    cron.schedule('*/5 * * * *', async () => {
      try {
        logger.info('Sending heartbeat...');
        const response = await axios.get(config.HEALTHCHECK_URL!);
        if (response.status === 200) {
          logger.info('Heartbeat successful');
        } else {
          logger.warn(`Heartbeat check failed with status: ${response.status}`);
        }
      } catch (error: any) {
        logger.error({ error: error.message }, 'Heartbeat failed');
      }
    });
  }
};
