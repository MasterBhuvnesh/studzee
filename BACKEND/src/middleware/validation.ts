import { NextFunction, Request, Response } from 'express'
import { ZodSchema } from 'zod'

/**
 * Validate and replace the request body with the parsed result, so handlers
 * receive coerced and stripped data rather than whatever was posted.
 */
export const validateBody =
  (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)

    if (!result.success) {
      return res.status(400).json({
        message: 'Validation error',
        errors: result.error.flatten().fieldErrors,
      })
    }

    req.body = result.data
    next()
  }

/**
 * Validate the query string. The parsed value is attached to res.locals because
 * req.query is a getter on Express 4 and cannot be reassigned.
 */
export const validateQuery =
  (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query)

    if (!result.success) {
      return res.status(400).json({
        message: 'Invalid query parameters',
        errors: result.error.flatten().fieldErrors,
      })
    }

    res.locals.query = result.data
    next()
  }
