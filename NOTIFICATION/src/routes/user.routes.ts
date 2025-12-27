import { Router } from 'express';

import { registerUser } from '@/controllers/user.controller';
import {
  clerkAuthMiddleware,
  requireAuth,
} from '@/middleware/clerk.middleware';
import { rateLimitMiddleware } from '@/middleware/rateLimit.middleware';
import { validateRequest } from '@/middleware/validation.middleware';
import { registerUserSchema } from '@/utils/validation';

const router = Router();

/**
 * @route   POST /api/register
 * @desc    Register user or update expo token
 * @access  Private (requires Clerk auth)
 */
router.post(
  '/register',
  clerkAuthMiddleware,
  requireAuth,
  rateLimitMiddleware({ windowMs: 60000, max: 10 }), // 10 req/min
  validateRequest(registerUserSchema),
  registerUser,
);

export default router;
