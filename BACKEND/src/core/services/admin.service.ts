import { DocumentModel } from '@/models/document.model'
import { DocumentSchema } from '@/models/document.validation'
import { TDocument } from '@/types/document'
import { invalidateAllCache } from '@/utils/cache'
import logger from '@/utils/logger'
import { z } from 'zod'

const documentUpdateSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  tags: z.array(z.string()).optional(),
})

export class AdminService {
  /**
   * Create a new document
   */
  async createDocument(data: TDocument) {
    try {
      const parsed = DocumentSchema.parse(data)
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

      logger.info(`Document created: ${doc._id}`)
      return doc
    } catch (error) {
      logger.error(error, 'Error creating document')
      throw error
    }
  }

  /**
   * Update an existing document
   */
  async updateDocument(id: string, data: unknown) {
    try {
      const updatedDocument = documentUpdateSchema.parse(data)
      const document = await DocumentModel.findByIdAndUpdate(
        id,
        updatedDocument,
        { new: true }
      )

      if (!document) {
        throw new Error('Document not found')
      }

      // Invalidate cache after updating document
      await invalidateAllCache()

      logger.info(`Document updated: ${id}`)
      return document
    } catch (error) {
      logger.error(error, `Error updating document: ${id}`)
      throw error
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(id: string) {
    try {
      const document = await DocumentModel.findByIdAndDelete(id)

      if (!document) {
        throw new Error('Document not found')
      }

      // Invalidate cache after deleting document
      await invalidateAllCache()

      logger.info(`Document deleted: ${id}`)
      return document
    } catch (error) {
      logger.error(error, `Error deleting document: ${id}`)
      throw error
    }
  }
}

export const adminService = new AdminService()
