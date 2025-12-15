import { Request, Response } from 'express'
import { DocumentModel } from '../../models/document.model'

// Extend Express Request to include multer file property
interface MulterRequest extends Request {
  file?: Express.Multer.File
}
import {
  uploadToCloudinary,
  deleteFromCloudinary,
  getPublicIdFromUrl,
} from '../../config/cloudinary'
import logger from '../../utils/logger'

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

    // Debug logging
    logger.info('Upload image request received', {
      documentId: id,
      hasFile: !!req.file,
      contentType: req.headers['content-type'],
      body: req.body,
    })

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    // Find the document
    const document = await DocumentModel.findById(id)
    if (!document) {
      return res.status(404).json({ message: 'Document not found' })
    }

    // Delete old image if it exists
    if (document.imageUrl) {
      try {
        const publicId = getPublicIdFromUrl(document.imageUrl)
        await deleteFromCloudinary(publicId, 'image')
      } catch (error) {
        logger.error(error, 'Failed to delete old image from Cloudinary')
        // Continue with upload even if deletion fails
      }
    }

    // Upload new image to Cloudinary (include file extension)
    // Extract file extension from mimetype
    const { url } = await uploadToCloudinary(
      req.file.buffer,
      'images',
      id, // Use document ID with extension as filename
      'image'
    )

    // Update document with new image URL
    document.imageUrl = url
    await document.save()

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

    // Delete old PDF if it exists
    if (document.pdfUrl) {
      try {
        const publicId = getPublicIdFromUrl(document.pdfUrl)
        await deleteFromCloudinary(publicId, 'raw')
      } catch (error) {
        logger.error(error, 'Failed to delete old PDF from Cloudinary')
        // Continue with upload even if deletion fails
      }
    }

    // Sanitize document title for use as filename
    const sanitizedTitle = sanitizeFilename(document.title)

    // Upload new PDF to Cloudinary (add .pdf extension to filename)
    const { url } = await uploadToCloudinary(
      req.file.buffer,
      'pdfs',
      `${sanitizedTitle}.pdf`, // Include .pdf extension in filename
      'raw' // PDFs are uploaded as 'raw' resource type
    )

    // Update document with new PDF URL
    document.pdfUrl = url
    await document.save()

    logger.info(`PDF uploaded for document ${id}: ${url}`)

    return res.status(200).json({
      message: 'PDF uploaded successfully',
      pdfUrl: url,
      documentId: id,
      title: document.title,
      publicId: getPublicIdFromUrl(url),
    })
  } catch (error) {
    logger.error(error, 'Error uploading PDF')
    return res
      .status(500)
      .json({ message: 'Failed to upload PDF', error: String(error) })
  }
}
