import { NextFunction, Request, Response } from 'express'
import { z } from 'zod'
import * as ContentService from '@/services/content.service'
import { getUserTotalPoints } from '@/services/progress.service'
import { TopicSchema } from '@/models/topics'
import { AppError } from '@/types/errors'

/**
 * Query contract for GET /content. The topic key must be one of the registry
 * entries; anything else is rejected by validateQuery with a 400 whose errors
 * name every allowed topic.
 */
export const listContentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  topic: TopicSchema.optional(),
})

export type TListContentQuery = z.infer<typeof listContentQuerySchema>

/**
 * Get paginated list of documents with topic filtering.
 * The validated values are read from res.locals.query, where the
 * validateQuery middleware left them.
 */
export const getPaginatedContent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, limit, topic } = res.locals.query as TListContentQuery
    const result = await ContentService.listContent(page, limit, topic)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

/**
 * Get the fixed topic registry, public so clients can render filters without
 * hardcoding topic keys.
 */
export const getTopics = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res.json({ data: ContentService.getTopics() })
  } catch (error) {
    next(error)
  }
}

/**
 * Fetch document by ID, requires authentication.
 *
 * Documents carrying an unlockPoints cost are gated after the cache lookup:
 * the cached read stays untouched, and a caller whose total points are below
 * the cost gets a 403 CONTENT_LOCKED error instead of the document. Requests
 * without an authenticated identity behave exactly as before the gate existed,
 * which keeps any path that reaches this handler unauthenticated unchanged
 * (the route middleware is what rejects those today).
 */
export const getDocumentById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params
    const document = await ContentService.getContentById(id)

    if (!document) {
      return res.status(404).json({ message: 'Document not found' })
    }

    const requiredPoints = document.unlockPoints ?? 0
    const userId =
      typeof req.auth === 'function' ? req.auth().userId : undefined

    if (userId && requiredPoints > 0) {
      const userPoints = await getUserTotalPoints(userId)
      if (userPoints < requiredPoints) {
        const error: AppError = new Error(
          `This content needs ${requiredPoints} points to unlock. You have ` +
            `${userPoints} points. Earn more by completing quizzes.`
        )
        error.statusCode = 403
        error.code = 'CONTENT_LOCKED'
        throw error
      }
    }

    res.json(document)
  } catch (error) {
    next(error)
  }
}

/**
 * Get documents created today in IST timezone
 */
export const getTodayContent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await ContentService.getTodayContent()
    res.json(result)
  } catch (error) {
    next(error)
  }
}
