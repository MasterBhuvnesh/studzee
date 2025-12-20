import { Request, Response, NextFunction } from 'express'
import { AppError } from '../types/errors'
import logger from '../utils/logger'

/**
 * 404 Not Found handler.
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const error: AppError = new Error(`Not Found - ${req.originalUrl}`)
  error.statusCode = 404
  next(error)
}

/**
 * Generic error handler.
 */
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500

  logger.error(
    {
      message: err.message,
      stack: err.stack,
      statusCode,
      path: req.path,
    },
    'Error caught by error handler'
  )

  res.status(statusCode).json({
    message: statusCode === 500 ? 'Internal Server Error' : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}
