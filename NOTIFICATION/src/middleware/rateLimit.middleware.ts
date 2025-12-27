import rateLimit from 'express-rate-limit';

export const rateLimitMiddleware = (options: {
  windowMs: number;
  max: number;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      success: false,
      message: 'Too many requests, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};
