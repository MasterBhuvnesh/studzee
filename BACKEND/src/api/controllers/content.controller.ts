import { NextFunction, Request, Response } from 'express'
import { z } from 'zod'
import * as ContentService from '../../core/services/content.service'

const listContentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

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

export const getDocumentById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // The user ID is available on req.auth.userId
    // TypeScript now understands this because of the new express.d.ts file.
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
