import { Request, Response, NextFunction } from 'express';

import { logger } from '@/utils/logger';

const expectedToken = process.env.AUTH_TOKEN;

/**
 * Simple middleware to check for a custom bearer token.
 * Format: Authorization: Bearer <token>
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res
      .status(401)
      .json({ message: 'Authorization header missing or malformed' });
  }

  const token = authHeader.split(' ')[1];

  if (token !== expectedToken) {
    logger.error('Unauthorized access attempt with token:', token);
    return res.status(403).json({ message: 'Forbidden: Invalid token' });
  }

  logger.log('Authenticated request with valid token');
  next();
};
