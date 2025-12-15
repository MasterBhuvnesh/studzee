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

    // Find all documents that have a PDF URL
    const [documents, total] = await Promise.all([
      DocumentModel.find(
        { pdfUrl: { $ne: null } },
        '_id title pdfUrl updatedAt'
      )
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      DocumentModel.countDocuments({ pdfUrl: { $ne: null } }),
    ])

    const data = documents.map((doc) => ({
      documentId: doc._id.toString(),
      title: doc.title,
      pdfUrl: doc.pdfUrl,
      uploadedAt: doc.updatedAt,
    }))

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
