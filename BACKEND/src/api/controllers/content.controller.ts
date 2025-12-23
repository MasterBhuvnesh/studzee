import { NextFunction, Request, Response } from 'express'
import { z } from 'zod'
import * as ContentService from '@/services/content.service'

const listContentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

/**
 * Get paginated list of documents with query validation
 */
export const getPaginatedContent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, limit } = listContentQuerySchema.parse(req.query)
    const result = await ContentService.listContent(page, limit)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

/**
 * Fetch document by ID, requires authentication
 */
export const getDocumentById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.auth().userId
    console.log(`User ${userId} is requesting document ${req.params.id}`)

    const { id } = req.params
    const document = await ContentService.getContentById(id)

    if (!document) {
      return res.status(404).json({ message: 'Document not found' })
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
