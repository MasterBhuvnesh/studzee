import { Request, Response, NextFunction } from 'express';

import { logger } from '@/utils/logger';
import { ApiResponse } from '@/utils/responses/api-response';

import { AppError } from './custom-errors';

/**
 * Global error handler middleware
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  let appError = error;

  // Convert non-AppError instances to AppError
  if (!(error instanceof AppError)) {
    appError = new AppError('Internal server error', 500, false);
  }

  const { message, statusCode, isOperational } = appError as AppError;

  // Log error details
  if (!isOperational || statusCode >= 500) {
    logger.error('Error occurred:', {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query,
    });
  }

  // Send error response
  const response = ApiResponse.error(message, statusCode);
  res.status(statusCode).json(response);
};

/**
 * Handle async route errors
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
