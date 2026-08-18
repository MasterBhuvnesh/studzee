import rateLimit from 'express-rate-limit'

/**
 * Per route rate limiter.
 *
 * The global limiter in src/index.ts protects the service as a whole. This one
 * is for endpoints that are individually expensive, such as sending a broadcast
 * or dispatching email.
 */
export const rateLimitMiddleware = (options: {
  windowMs: number
  max: number
}) =>
  rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: { message: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  })
