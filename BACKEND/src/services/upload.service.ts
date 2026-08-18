import { DocumentModel } from '@/models/document.model'
import { config, uploadToS3, deleteFromS3, getObjectRef } from '@/config'
import { invalidateAllCache, invalidateDocumentCache } from '@/utils/cache'
import logger from '@/utils/logger'

/**
 * Sanitize a string to be used as a filename
 * Removes special characters and replaces spaces with hyphens
 */
const sanitizeFilename = (filename: string): string => {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim()
}

export interface UploadedFile {
  buffer: Buffer
  originalname: string
  mimetype: string
  size: number
}

export class UploadService {
  /**
   * Upload an image for a document
   */
  async uploadDocumentImage(documentId: string, file: UploadedFile) {
    try {
      // Validate document ID format
      if (!documentId || documentId.length !== 24) {
        throw new Error('Invalid document ID format')
      }

      // Find the document
      const document = await DocumentModel.findById(documentId)
      if (!document) {
        throw new Error('Document not found')
      }

      // Delete old image if it exists
      if (document.imageUrl) {
        try {
          await deleteFromS3(getObjectRef(document.imageUrl))
        } catch (error) {
          logger.error(error, 'Failed to delete the previous image')
          // Continue with the upload even if the deletion fails
        }
      }

      // Upload the new image. The document ID is the key, so a re-upload with
      // the same extension overwrites rather than accumulating orphans.
      const ext = file.mimetype.split('/')[1] || 'jpg'
      const { url } = await uploadToS3(
        file.buffer,
        config.S3_BUCKET_IMAGES,
        `${documentId}.${ext}`,
        file.mimetype
      )

      // Update document with new image URL
      document.imageUrl = url
      await document.save()

      // Invalidate cache after uploading image
      await invalidateDocumentCache(documentId)

      logger.info(`Image uploaded for document ${documentId}: ${url}`)

      return {
        imageUrl: url,
        documentId,
      }
    } catch (error) {
      logger.error(error, `Error uploading image for document ${documentId}`)
      throw error
    }
  }

  /**
   * Upload a PDF for a document
   */
  async uploadDocumentPdf(documentId: string, file: UploadedFile) {
    try {
      // Find the document
      const document = await DocumentModel.findById(documentId)
      if (!document) {
        throw new Error('Document not found')
      }

      // Sanitize document title for use as filename
      const sanitizedTitle = sanitizeFilename(document.title)
      const originalFilename = file.originalname

      // Upload the PDF into the pdfs bucket, keyed by the sanitised title.
      const { url, uploadedAt, size } = await uploadToS3(
        file.buffer,
        config.S3_BUCKET_PDFS,
        `${sanitizedTitle}.pdf`,
        'application/pdf',
        originalFilename
      )

      // Create PDF object with metadata
      const pdfObject = {
        name: originalFilename,
        url,
        uploadedAt,
        size,
      }

      // Initialize pdfUrl as array if it doesn't exist or is not an array
      if (!Array.isArray(document.pdfUrl)) {
        document.pdfUrl = []
      }

      // Add new PDF to the array
      document.pdfUrl.push(pdfObject)
      await document.save()

      // Invalidate cache after uploading PDF
      await invalidateAllCache()

      logger.info(`PDF uploaded for document ${documentId}: ${url}`)

      return {
        pdf: pdfObject,
        documentId,
        title: document.title,
      }
    } catch (error) {
      logger.error(error, `Error uploading PDF for document ${documentId}`)
      throw error
    }
  }
}

export const uploadService = new UploadService()
