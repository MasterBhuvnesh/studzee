import { Router } from 'express'
import { clerkAuthMiddleware, requireAuth } from '@/middleware/auth'
import { validateQuery } from '@/middleware/validation'
import {
  listContentQuerySchema,
  getPaginatedContent,
  getTopics,
  getDocumentById,
  getTodayContent,
} from '@/api/controllers/content.controller'

const router = Router()

/**
 * @route GET /content
 * @description Get a paginated list of documents, optionally filtered by topic.
 * @access Public
 */
router.get('/', validateQuery(listContentQuerySchema), getPaginatedContent)

/**
 * @route GET /content/topics
 * @description List the fixed topic registry. Registered before '/:id' so the
 * literal path is never captured as an ID.
 * @access Public
 */
router.get('/topics', getTopics)

/**
 * @route GET /content/today
 * @description Get documents created today (IST timezone).
 * @access Public
 */
router.get('/today', getTodayContent)

/**
 * @route GET /content/:id
 * @description Get a single document by its ID.
 * @access Authenticated
 */
router.get('/:id', clerkAuthMiddleware, requireAuth, getDocumentById)

export default router
