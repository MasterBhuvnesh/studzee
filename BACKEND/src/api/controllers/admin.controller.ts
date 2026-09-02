import { NextFunction, Request, Response } from 'express'
import { adminService } from '@/services/admin.service'
import * as ContentService from '@/services/content.service'
import { z } from 'zod'

/**
 * Create new document with validation
 */
export const createDocument = async (req: Request, res: Response) => {
  try {
    const doc = await adminService.createDocument(req.body)
    return res
      .status(201)
      .json({ message: 'Document created successfully', doc })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: 'Invalid document data', errors: error.errors })
    }
    res.status(500).json({ message: 'Error creating document', error })
  }
}

/**
 * Update existing document by ID
 */
export const updateDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const document = await adminService.updateDocument(id, req.body)
    res.status(200).json(document)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: 'Invalid document data', errors: error.errors })
    }
    if (error instanceof Error && error.message === 'Document not found') {
      return res.status(404).json({ message: 'Document not found' })
    }
    res.status(500).json({ message: 'Error updating document', error })
  }
}

/**
 * Delete document by ID
 */
export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    await adminService.deleteDocument(id)
    res.status(204).send()
  } catch (error) {
    if (error instanceof Error && error.message === 'Document not found') {
      return res.status(404).json({ message: 'Document not found' })
    }
    res.status(500).json({ message: 'Error deleting document', error })
  }
}

/**
 * Read one document for the admin console.
 *
 * GET /content/:id cannot serve this: it gates on unlockPoints against the
 * caller's progress points, and an admin has none, so every gated document
 * would 403 for the one person allowed to edit it. The list route is
 * projected and carries no content or quiz. This route is the ungated read
 * the admin surface was missing; it reuses the cached service read, so it
 * costs nothing extra against Mongo.
 */
export const getDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const document = await ContentService.getContentById(req.params.id)

    if (!document) {
      return res.status(404).json({ message: 'Document not found' })
    }

    return res.json(document)
  } catch (error) {
    next(error)
  }
}
