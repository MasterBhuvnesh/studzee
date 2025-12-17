import { Request, Response } from 'express'
import { z } from 'zod'
import { DocumentModel } from '../../models/document.model'

const listPdfsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

/**
 * List all PDFs with pagination
 * GET /pdfs
 */
export const listPdfs = async (req: Request, res: Response) => {
  try {
    const { page, limit } = listPdfsQuerySchema.parse(req.query)

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

    return res.status(200).json({
      data,
      meta: {
        page,
        limit,
        total,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: 'Invalid query parameters', errors: error.errors })
    }
    return res
      .status(500)
      .json({ message: 'Failed to list PDFs', error: String(error) })
  }
}
