import { Router } from 'express'
import {
  getMyProgressSummary,
  recordAttempt,
} from '@/api/controllers/progress.controller'
import { clerkAuthMiddleware, requireAuth } from '@/middleware/auth'
import { rateLimitMiddleware } from '@/middleware/rateLimit'
import { validateBody } from '@/middleware/validation'
import { RecordAttemptSchema } from '@/models/progress.validation'

const router = Router()

// Every route below requires an authenticated Clerk user.
router.use(clerkAuthMiddleware, requireAuth)

/**
 * @route POST /progress/attempts
 * @description Grade a quiz submission and record points, streak and badges.
 * @access Authenticated
 */
router.post(
  '/attempts',
  rateLimitMiddleware({ windowMs: 60_000, max: 30 }),
  validateBody(RecordAttemptSchema),
  recordAttempt
)

/**
 * @route GET /progress/me
 * @description Tracker summary for the caller: points, level, streak, badges
 *              and recent attempts.
 * @access Authenticated
 */
router.get('/me', getMyProgressSummary)

export default router
