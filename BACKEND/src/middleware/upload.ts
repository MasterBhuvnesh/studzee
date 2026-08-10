import multer, { FileFilterCallback } from 'multer'
import { Request, Response, NextFunction } from 'express'

// Use memory storage for Cloudinary uploads
const storage = multer.memoryStorage()

/**
 * File filter for image uploads
 */
const imageFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(
      new Error(
        'Invalid file type. Only JPG, PNG, and WebP images are allowed.'
      )
    )
  }
}

/**
 * File filter for PDF uploads
 */
const pdfFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type. Only PDF files are allowed.'))
  }
}

/**
 * Multer middleware for image uploads
 * Max size: 10MB
 */
const imageUpload = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
}).single('file')

/**
 * Multer middleware for PDF uploads
 * Max size: 50MB
 */
const pdfUpload = multer({
  storage,
  fileFilter: pdfFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
}).single('file')

/**
 * Wrapper to handle multer errors
 */
const handleMulterError = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  upload: (req: Request, res: Response, callback: (error: any) => void) => void
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Multer only parses multipart/form-data and ignores anything else, which
    // reaches the controller as a missing file. Saying so here is more useful
    // than the generic "no file uploaded" that follows, because the caller has
    // sent the wrong kind of request rather than forgotten the field.
    const contentType = req.headers['content-type'] ?? ''
    if (!contentType.toLowerCase().startsWith('multipart/form-data')) {
      return res.status(400).json({
        message: 'Uploads must be sent as multipart/form-data',
        details: `Received Content-Type: ${contentType || '(none)'}. Attach the file as a form field named "file" rather than sending a JSON body.`,
      })
    }

    upload(req, res, (err: Error | null) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            message:
              'File size exceeded. Maximum allowed size is 10MB for images and 50MB for PDFs.',
          })
        }
        // The commonest case is LIMIT_UNEXPECTED_FILE, which means the form
        // field was named something other than "file". Multer's own message
        // for it is just "Unexpected field", which does not say what to fix.
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            message: `Unexpected form field "${err.field}"`,
            details: 'The file must be sent in a form field named "file".',
          })
        }
        return res.status(400).json({ message: err.message })
      } else if (err) {
        // Custom errors from fileFilter
        return res.status(400).json({ message: err.message })
      }
      next()
    })
  }
}

export const uploadImage = handleMulterError(imageUpload)
export const uploadPdf = handleMulterError(pdfUpload)
