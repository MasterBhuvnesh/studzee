import axios from 'axios';
import cron from 'node-cron';

// Update the import path to a relative path based on your project structure
import { logger } from '@/utils/logger';

export const startHeartbeatJob = () => {
  if (process.env.NODE_ENV !== 'production') {
    logger.log('⏱️  - Skipping heartbeat cron: Not in production.');
    return;
  }

  const healthUrl = process.env.HEALTHCHECK_URL;

  if (!healthUrl) {
    logger.error('HEALTHCHECK_URL not set in .env');
    return;
  }

  console.log('✅  Scheduling heartbeat job every 14 minutes');

  cron.schedule('*/14 * * * *', async () => {
    console.log('🫀  - Running heartbeat check...');
    try {
      const response = await axios.get(healthUrl);
      console.log(`✅  - Healthcheck successful: ${response.status}`);
    } catch (err: any) {
      console.error('❌  - Healthcheck failed:', err.message);
    }
  });
};
