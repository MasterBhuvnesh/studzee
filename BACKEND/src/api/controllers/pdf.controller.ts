import { Request, Response } from 'express'
import { z } from 'zod'
import { pdfService } from '@/services/pdf.service'

/**
 * List all PDFs with pagination
 */
export const listPdfs = async (req: Request, res: Response) => {
  try {
    const result = await pdfService.listPdfs(req.query)
    return res.status(200).json(result)
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
