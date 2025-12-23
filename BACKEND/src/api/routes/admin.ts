import { Router } from 'express'
import * as AdminController from '@/api/controllers/admin.controller'
import * as UploadController from '@/api/controllers/upload.controller'
import {
  clerkAuthMiddleware,
  requireAuth,
  requireAdmin,
} from '@/middleware/auth'
import { uploadImage, uploadPdf } from '@/middleware/upload'

const router = Router()

// Auth middleware chain for routes that need admin access
const adminAuth = [clerkAuthMiddleware, requireAuth, requireAdmin]

/**
 * @route POST /admin/documents
 * @description Create a new document.
 * @access Admin
 */
router.post('/documents', ...adminAuth, AdminController.createDocument)

/**
 * @route PUT /admin/documents/:id
 * @description Update a document by its ID.
 * @access Admin
 */
router.put('/documents/:id', ...adminAuth, AdminController.updateDocument)

/**
 * @route DELETE /admin/documents/:id
 * @description Delete a document by its ID.
 * @access Admin
 */
router.delete('/documents/:id', ...adminAuth, AdminController.deleteDocument)

/**
 * @route POST /admin/documents/:id/upload-image
 * @description Upload an image for a document.
 * @access Admin
 */
router.post(
  '/documents/:id/upload-image',
  ...adminAuth,
  uploadImage,
  UploadController.uploadDocumentImage
)

/**
 * @route POST /admin/documents/:id/upload-pdf
 * @description Upload a PDF for a document.
 * @access Admin
 */
router.post(
  '/documents/:id/upload-pdf',
  ...adminAuth,
  uploadPdf,
  UploadController.uploadDocumentPdf
)

export default router
