import { Router } from 'express'
import {
  listQuests,
  submitQuestCompletion,
} from '@/api/controllers/quest.controller'
import { clerkAuthMiddleware, requireAuth } from '@/middleware/auth'
import { rateLimitMiddleware } from '@/middleware/rateLimit'
import { validateBody } from '@/middleware/validation'
import { QuestSubmissionSchema } from '@/models/quest.validation'

const router = Router()

// Every route below requires an authenticated Clerk user.
router.use(clerkAuthMiddleware, requireAuth)

/**
 * @route GET /quests
 * @description Live quests for the caller, each flagged with whether it was
 *              already completed inside its window.
 * @access Authenticated
 */
router.get('/', listQuests)

/**
 * @route POST /quests/:id/complete
 * @description Attempt one completion. Graded types are checked against the
 *              stored payload; read_blog awards on submission.
 * @access Authenticated
 */
router.post(
  '/:id/complete',
  rateLimitMiddleware({ windowMs: 60_000, max: 30 }),
  validateBody(QuestSubmissionSchema),
  submitQuestCompletion
)

export default router
