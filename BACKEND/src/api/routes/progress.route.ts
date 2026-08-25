import { Router } from 'express'
import {
  getMyActivity,
  getMyProgressSummary,
  recordAttempt,
} from '@/api/controllers/progress.controller'
import { clerkAuthMiddleware, requireAuth } from '@/middleware/auth'
import { rateLimitMiddleware } from '@/middleware/rateLimit'
import { validateBody, validateQuery } from '@/middleware/validation'
import { RecordAttemptSchema } from '@/models/progress.validation'
import { z } from 'zod'

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
 *              and recent attempts. Rate limited so a misbehaving client
 *              degrades on this endpoint instead of the whole app.
 * @access Authenticated
 */
router.get(
  '/me',
  rateLimitMiddleware({ windowMs: 60_000, max: 60 }),
  getMyProgressSummary
)

/**
 * @route GET /progress/activity?year=
 * @description Active day map for one year, the data behind the streak
 *              heatmap. Defaults to the current year.
 * @access Authenticated
 */
router.get(
  '/activity',
  validateQuery(
    z.object({
      year: z.coerce
        .number()
        .int()
        .min(2020)
        .max(new Date().getUTCFullYear() + 1)
        .default(new Date().getUTCFullYear()),
    })
  ),
  getMyActivity
)

export default router
