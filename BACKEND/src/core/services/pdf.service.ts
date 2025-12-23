import { DocumentModel } from '@/models/document.model'
import logger from '@/utils/logger'
import { z } from 'zod'

const listPdfsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export class PdfService {
  /**
   * List all PDFs with pagination
   */
  async listPdfs(query: unknown) {
    try {
      const { page, limit } = listPdfsQuerySchema.parse(query)

      const skip = (page - 1) * limit

      // Find all documents that have a PDF URL array with at least one item
      const [documents, total] = await Promise.all([
        DocumentModel.find(
          { pdfUrl: { $exists: true, $ne: [] } },
          '_id title pdfUrl updatedAt'
        )
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        DocumentModel.countDocuments({ pdfUrl: { $exists: true, $ne: [] } }),
      ])

      // Flatten the PDFs from all documents
      const data = documents.flatMap((doc) => {
        if (!doc.pdfUrl || !Array.isArray(doc.pdfUrl)) {
          return []
        }
        return doc.pdfUrl.map((pdf) => ({
          documentId: doc._id.toString(),
          title: doc.title,
          pdfName: pdf.name,
          pdfUrl: pdf.url,
          uploadedAt: pdf.uploadedAt,
          size: pdf.size,
        }))
      })

      logger.info(`Listed ${data.length} PDFs (page ${page})`)

      return {
        data,
        meta: {
          page,
          limit,
          total,
        },
      }
    } catch (error) {
      logger.error(error, 'Error listing PDFs')
      throw error
    }
  }
}

export const pdfService = new PdfService()
