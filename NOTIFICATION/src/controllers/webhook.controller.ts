import { Request, Response } from 'express';
import { Webhook } from 'svix';

import { config } from '@/config';
import { sendWelcomeEmail } from '@/services/email.service';
import logger from '@/utils/logger';

interface ClerkUserEvent {
  data: {
    id: string;
    email_addresses: Array<{
      email_address: string;
      id: string;
    }>;
    first_name: string | null;
    last_name: string | null;
    username: string | null;
    created_at: number;
    updated_at: number;
  };
  type: string;
}

export const handleClerkWebhook = async (req: Request, res: Response) => {
  try {
    const WEBHOOK_SECRET = config.CLERK_WEBHOOK_SIGNING_SECRET;

    if (!WEBHOOK_SECRET) {
      logger.error('CLERK_WEBHOOK_SIGNING_SECRET is not configured');
      return res.status(500).json({
        success: false,
        message: 'Webhook secret not configured',
      });
    }

    const svix_id = req.headers['svix-id'] as string;
    const svix_timestamp = req.headers['svix-timestamp'] as string;
    const svix_signature = req.headers['svix-signature'] as string;

    if (!svix_id || !svix_timestamp || !svix_signature) {
      logger.warn('Missing svix headers in webhook request');
      return res.status(400).json({
        success: false,
        message: 'Missing required webhook headers',
      });
    }

    const body = JSON.stringify(req.body);

    const wh = new Webhook(WEBHOOK_SECRET);

    let evt: ClerkUserEvent;

    try {
      evt = wh.verify(body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      }) as ClerkUserEvent;
    } catch (err: any) {
      logger.error({ error: err.message }, 'Webhook verification failed');
      return res.status(400).json({
        success: false,
        message: 'Webhook verification failed',
      });
    }

    const eventType = evt.type;

    logger.info({ eventType, userId: evt.data.id }, 'Received Clerk webhook');

    if (eventType === 'user.created') {
      const { id, email_addresses, first_name, username } = evt.data;

      const primaryEmail = email_addresses[0]?.email_address;

      console.log('New user email:', primaryEmail);
      console.log('All email addresses:', email_addresses);

      if (!primaryEmail) {
        logger.warn({ userId: id }, 'No email found for new user');
        return res.status(200).json({
          success: true,
          message: 'Webhook received but no email to send welcome',
        });
      }

      const displayName =
        first_name || username || primaryEmail.split('@')[0] || 'User';

      logger.info(
        { userId: id, email: primaryEmail, displayName },
        'Sending welcome email to new user',
      );

      const result = await sendWelcomeEmail(primaryEmail, displayName);

      if (result.success) {
        logger.info(
          { userId: id, email: primaryEmail },
          'Welcome email sent successfully',
        );
      } else {
        logger.error(
          { userId: id, email: primaryEmail, error: result.error },
          'Failed to send welcome email',
        );
      }

      return res.status(200).json({
        success: true,
        message: 'Welcome email processed',
        emailSent: result.success,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Webhook received: ${eventType}`,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Webhook handler error');
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
