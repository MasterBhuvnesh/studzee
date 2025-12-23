import { Router } from 'express'
import * as PdfController from '@/api/controllers/pdf.controller'

const router = Router()

/**
 * @route GET /pdfs
 * @description List all PDFs with pagination.
 * @access Public
 */
router.get('/', PdfController.listPdfs)

export default router
