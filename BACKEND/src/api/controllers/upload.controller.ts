import { Request, Response } from 'express'
import { DocumentModel } from '../../models/document.model'

// Extend Express Request to include multer file property
interface MulterRequest extends Request {
  file?: Express.Multer.File
}
import { uploadToS3, deleteFromS3, getKeyFromUrl } from '../../config/s3'
import logger from '../../utils/logger'
import { invalidateAllCache, invalidateDocumentCache } from '../../utils/cache'

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

/**
 * Upload an image for a document
 * POST /admin/documents/:id/upload-image
 */
export const uploadDocumentImage = async (
  req: MulterRequest,
  res: Response
) => {
  try {
    const { id } = req.params

    // Debug logging - More detailed
    logger.info('Upload image request received', {
      documentId: id,
      hasFile: !!req.file,
      contentType: req.headers['content-type'],
      body: req.body,
      fileDetails: req.file
        ? {
            fieldname: req.file.fieldname,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
          }
        : null,
    })

    // Validate document ID format
    if (!id || id.length !== 24) {
      logger.warn('Invalid document ID format', { id })
      return res.status(400).json({
        message: 'Invalid document ID format',
        details: 'Document ID must be a valid 24-character MongoDB ObjectId',
      })
    }

    // Check if file was uploaded
    if (!req.file) {
      logger.warn('No file uploaded in request')
      return res.status(400).json({
        message: 'No file uploaded',
        details: 'Please include a file in the request with field name "file"',
      })
    }

    // Find the document
    const document = await DocumentModel.findById(id)
    if (!document) {
      return res.status(404).json({ message: 'Document not found' })
    }

    // Delete old image if it exists
    if (document.imageUrl) {
      try {
        const key = getKeyFromUrl(document.imageUrl)
        await deleteFromS3(key)
      } catch (error) {
        logger.error(error, 'Failed to delete old image from S3')
        // Continue with upload even if deletion fails
      }
    }

    // Upload new image to S3
    // Determine file extension from mimetype
    const ext = req.file.mimetype.split('/')[1] || 'jpg'
    const { url } = await uploadToS3(
      req.file.buffer,
      'images',
      `${id}.${ext}`, // Use document ID with extension as filename
      req.file.mimetype
    )

    // Update document with new image URL
    document.imageUrl = url
    await document.save()

    // Invalidate cache after uploading image
    await invalidateDocumentCache(id)

    logger.info(`Image uploaded for document ${id}: ${url}`)

    return res.status(200).json({
      message: 'Image uploaded successfully',
      imageUrl: url,
      documentId: id,
    })
  } catch (error) {
    logger.error(error, 'Error uploading image')
    return res
      .status(500)
      .json({ message: 'Failed to upload image', error: String(error) })
  }
}

/**
 * Upload a PDF for a document
 * POST /admin/documents/:id/upload-pdf
 */
export const uploadDocumentPdf = async (req: MulterRequest, res: Response) => {
  try {
    const { id } = req.params

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    // Find the document
    const document = await DocumentModel.findById(id)
    if (!document) {
      return res.status(404).json({ message: 'Document not found' })
    }

    // Sanitize document title for use as filename
    const sanitizedTitle = sanitizeFilename(document.title)
    const originalFilename = req.file.originalname

    // Upload new PDF to S3 (add .pdf extension to filename)
    const { url, uploadedAt, size } = await uploadToS3(
      req.file.buffer,
      'pdfs',
      `${sanitizedTitle}.pdf`, // Include .pdf extension in filename
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

    logger.info(`PDF uploaded for document ${id}: ${url}`)

    return res.status(200).json({
      message: 'PDF uploaded successfully',
      pdf: pdfObject,
      documentId: id,
      title: document.title,
    })
  } catch (error) {
    logger.error(error, 'Error uploading PDF')
    return res
      .status(500)
      .json({ message: 'Failed to upload PDF', error: String(error) })
  }
}
