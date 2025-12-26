import { Request } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

const safeIpKeyGenerator = (req: Request): string => ipKeyGenerator(req as any);

// General API rate limiting - CAN BE USED FOR LATER ENDPOINTS
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    statusCode: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiting for sensitive endpoints
export const strictRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10,
  message: {
    error:
      'Rate limit exceeded for this endpoint. Please wait before trying again.',
    statusCode: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Very strict rate limiting for notification sending
export const notificationRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  message: {
    error:
      'Notification sending rate limit exceeded. Please wait before sending again.',
    statusCode: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      return `token:${token}`;
    }
    return safeIpKeyGenerator(req);
  },
});

// Rate limiting for token registration
export const tokenRegisterRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: {
    error: 'Too many token registration attempts. Please try again later.',
    statusCode: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
});
