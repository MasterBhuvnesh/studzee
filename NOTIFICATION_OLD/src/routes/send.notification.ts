import axios from 'axios';
import { Request, Response, Router } from 'express';

import db from '@/config/firebase';
import { authenticate } from '@/middleware/auth';
import { notificationRateLimit } from '@/middleware/rate-limit';
import { logger } from '@/utils/logger';

const router = Router();

/**
 * @route   GET /send
 * @desc    Send a push notification to all registered Expo tokens
 * @access  Protected
 */
router.post(
  '/send',
  notificationRateLimit,
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { title, body, imageUrl } = req.body;

      const snapshot = await db.collection('tokens').get();
      if (snapshot.empty) {
        return res.status(200).json({ message: 'No tokens to send.' });
      }

      const tokens: string[] = [];
      snapshot.forEach((doc) => tokens.push(doc.id));

      const messages = tokens.map((token) => {
        const notification: any = {
          to: token,
          sound: 'default',
          title: title || 'Machine Learning',
          body:
            body ||
            'Deep learning enables neural networks to learn patterns efficiently.',
        };

        if (imageUrl) {
          notification.richContent = {
            image: imageUrl,
          };
        }

        return notification;
      });

      const response = await axios.post(
        'https://exp.host/--/api/v2/push/send',
        messages,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      type ExpoPushResponse = { data: any[] };
      const responseData = response.data as ExpoPushResponse;
      const results = responseData.data;
      const invalidTokens: string[] = [];

      results.forEach((result: any, index: number) => {
        if (
          result.status === 'error' &&
          result.details?.error === 'DeviceNotRegistered'
        ) {
          const invalidToken = tokens[index];
          invalidTokens.push(invalidToken);
        }
      });

      // Delete invalid tokens from Firestore
      const deleteOps = invalidTokens.map((token) =>
        db.collection('tokens').doc(token).delete(),
      );
      await Promise.all(deleteOps);

      logger.log(`✅ Sent to ${tokens.length - invalidTokens.length} devices`);
      if (invalidTokens.length > 0) {
        logger.warn(`🧹 Deleted ${invalidTokens.length} invalid tokens`);
      }

      res.status(200).json({
        message: `Notifications sent to ${
          tokens.length - invalidTokens.length
        } devices`,
        deleted: invalidTokens.length > 0 ? invalidTokens : undefined,
      });
    } catch (err: any) {
      logger.error('❌ Failed to send notifications:', err.message);
      res.status(500).json({ message: 'Failed to send notifications' });
    }
  },
);

export default router;
