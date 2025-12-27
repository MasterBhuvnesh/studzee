import axios from 'axios';
import cron from 'node-cron';

import logger from '@/utils/logger';
import { prisma } from '@/utils/prisma';

export const startTokenCleanupJob = () => {
  if (
    process.env.NODE_ENV !== 'production' &&
    process.env.NODE_ENV !== 'test'
  ) {
    logger.info('Skipping token cleanup cron: Not in production.');
    return;
  }

  logger.info('Scheduling token cleanup job daily at 2 AM');

  // Run every day at 2 AM
  cron.schedule('0 2 * * *', async () => {
    logger.info('Running token cleanup job.. .');

    try {
      const users = await prisma.user.findMany();

      for (const user of users) {
        // Validate tokens (you can call Expo API or remove old ones)
        const validTokens = user.expoTokens.filter((token) =>
          token.startsWith('ExponentPushToken['),
        );

        if (validTokens.length !== user.expoTokens.length) {
          await prisma.user.update({
            where: { id: user.id },
            data: { expoTokens: validTokens },
          });
          logger.info({ userId: user.id }, 'Cleaned up invalid tokens');
        }
      }

      logger.info('Token cleanup completed');
    } catch (error: any) {
      logger.error({ error: error.message }, 'Token cleanup failed');
    }
  });
};
