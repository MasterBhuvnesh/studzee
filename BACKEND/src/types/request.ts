import { Request } from 'express'

/**
 * Request-related type definitions
 */

// Extend Express Request to include multer file property
export interface MulterRequest extends Request {
  file?: Express.Multer.File
}
