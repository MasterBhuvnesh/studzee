import { Router } from 'express';

import { handleClerkWebhook } from '@/controllers/webhook.controller';

const router = Router();

/**
 * @route   POST /api/webhooks/clerk
 * @desc    Handle Clerk webhook events (user.created, etc.)
 * @access  Public (verified via webhook signature)
 *
 * Note: This route is intentionally public because webhook requests
 * come from Clerk's servers and do not include user auth tokens.
 * Security is ensured via SVIX signature verification.
 */
router.post('/clerk', handleClerkWebhook);

export default router;
