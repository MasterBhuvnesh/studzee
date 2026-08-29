import { Router } from 'express'
import * as AiController from '@/api/controllers/ai.controller'
import { clerkAuthMiddleware, requireAuth } from '@/middleware/auth'
import { rateLimitMiddleware } from '@/middleware/rateLimit'
import { validateBody } from '@/middleware/validation'
import { AskSupportSchema } from '@/models/ai.validation'

const router = Router()

// The support agent answers as the caller and counts against that account's
// daily allowance, so there is no anonymous access to it.
router.use(clerkAuthMiddleware, requireAuth)

/**
 * @route POST /support/ask
 * @description Answer one support question from the knowledge base. The
 *              per user daily ceiling lives in the service; this limiter only
 *              stops a client looping.
 */
router.post(
  '/ask',
  rateLimitMiddleware({ windowMs: 60_000, max: 10 }),
  validateBody(AskSupportSchema),
  AiController.askSupport
)

export default router
