import { Response } from 'express'
import { MulterRequest } from '@/types/request'
import { uploadService } from '@/services/upload.service'
import logger from '@/utils/logger'

/**
 * Upload image file to S3 and attach to document
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

    // Check if file was uploaded
    if (!req.file) {
      logger.warn('No file uploaded in request')
      return res.status(400).json({
        message: 'No file uploaded',
        details: 'Please include a file in the request with field name "file"',
      })
    }

    // Delegate to service
    const result = await uploadService.uploadDocumentImage(id, {
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    })

    return res.status(200).json({
      message: 'Image uploaded successfully',
      ...result,
    })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Invalid document ID format') {
        return res.status(400).json({
          message: 'Invalid document ID format',
          details: 'Document ID must be a valid 24-character MongoDB ObjectId',
        })
      }
      if (error.message === 'Document not found') {
        return res.status(404).json({ message: 'Document not found' })
      }
    }
    logger.error(error, 'Error uploading image')
    return res
      .status(500)
      .json({ message: 'Failed to upload image', error: String(error) })
  }
}

/**
 * Upload PDF file to S3 and attach to document
 */
export const uploadDocumentPdf = async (req: MulterRequest, res: Response) => {
  try {
    const { id } = req.params

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    // Delegate to service
    const result = await uploadService.uploadDocumentPdf(id, {
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    })

    return res.status(200).json({
      message: 'PDF uploaded successfully',
      ...result,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Document not found') {
      return res.status(404).json({ message: 'Document not found' })
    }
    logger.error(error, 'Error uploading PDF')
    return res
      .status(500)
      .json({ message: 'Failed to upload PDF', error: String(error) })
  }
}
