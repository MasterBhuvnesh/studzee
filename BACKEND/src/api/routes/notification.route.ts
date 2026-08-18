import { Router } from 'express'
import { registerDevice } from '@/api/controllers/notification.controller'
import { clerkAuthMiddleware, requireAuth } from '@/middleware/auth'
import { rateLimitMiddleware } from '@/middleware/rateLimit'
import { validateBody } from '@/middleware/validation'
import { RegisterUserSchema } from '@/models/notification.validation'

const router = Router()

/**
 * @route POST /notifications/register
 * @description Register the caller's device for push notifications, or attach
 *              another device token to an existing registration.
 * @access Authenticated
 */
router.post(
  '/register',
  clerkAuthMiddleware,
  requireAuth,
  rateLimitMiddleware({ windowMs: 60_000, max: 10 }),
  validateBody(RegisterUserSchema),
  registerDevice
)

export default router
