import { Request, Response } from 'express'
import { DocumentModel } from '@/models/document.model'
import { DocumentSchema } from '@/models/document.schema'
import { TDocument } from '@/types/document'
import { invalidateAllCache } from '@/utils/cache'

import { z } from 'zod'

const documentSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  tags: z.array(z.string()).optional(),
})

export const createDocument = async (req: Request, res: Response) => {
  try {
    const parsed = DocumentSchema.parse(req.body) as TDocument
    const quizMap = new Map(Object.entries(parsed.quiz))
    const keyNotesMap = new Map(Object.entries(parsed.key_notes ?? {}))
    const doc = await DocumentModel.create({
      title: parsed.title,
      content: parsed.content,
      quiz: quizMap,
      facts: parsed.facts,
      summary: parsed.summary,
      key_notes: keyNotesMap,
      imageUrl: parsed.imageUrl ?? null,
      pdfUrl: parsed.pdfUrl ?? [],
    })

    // Invalidate cache after creating document
    await invalidateAllCache()

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

export const updateDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const updatedDocument = documentSchema.parse(req.body)
    const document = await DocumentModel.findByIdAndUpdate(
      id,
      updatedDocument,
      { new: true }
    )
    if (!document) {
      return res.status(404).json({ message: 'Document not found' })
    }

    // Invalidate cache after updating document
    await invalidateAllCache()

    res.status(200).json(document)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: 'Invalid document data', errors: error.errors })
    }
    res.status(500).json({ message: 'Error updating document', error })
  }
}

export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const document = await DocumentModel.findByIdAndDelete(id)
    if (!document) {
      return res.status(404).json({ message: 'Document not found' })
    }

    // Invalidate cache after deleting document
    await invalidateAllCache()

    res.status(204).send()
  } catch (error) {
    res.status(500).json({ message: 'Error deleting document', error })
  }
}
