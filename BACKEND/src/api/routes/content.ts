import { Router } from 'express'
import { clerkAuthMiddleware, requireAuth } from '../../middleware/auth'
import * as ContentController from '../controllers/content.controller'

const router = Router()

/**
 * @route GET /content
 * @description Get a paginated list of documents.
 * @access Public
 */
router.get('/', ContentController.getPaginatedContent)

/**
 * @route GET /content/today
 * @description Get documents created today (IST timezone).
 * @access Public
 */
router.get('/today', ContentController.getTodayContent)

/**
 * @route GET /content/:id
 * @description Get a single document by its ID.
 * @access Authenticated
 */
router.get(
  '/:id',
  clerkAuthMiddleware,
  requireAuth,
  ContentController.getDocumentById
)

export default router
