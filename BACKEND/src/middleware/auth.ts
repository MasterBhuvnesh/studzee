import { clerkClient } from '@clerk/clerk-sdk-node'
import { clerkMiddleware } from '@clerk/express'
import { NextFunction, Request, Response } from 'express'
import { config } from '@/config'
import logger from '@/utils/logger'

const isDevelopmentMode = config.NODE_ENV === 'development'

/**
 * Clerk authentication with dev mode bypass (DEV_TOKEN support)
 */
export const clerkAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (isDevelopmentMode && config.DEV_TOKEN) {
    // In development mode, check for DEV_TOKEN in Authorization header
    const authHeader = req.headers.authorization
    const token = authHeader?.replace('Bearer ', '')

    if (token === config.DEV_TOKEN) {
      logger.info('Development mode: Using DEV_TOKEN authentication bypass')
      // Mock the auth object for development
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(req as any).auth = () => ({
        userId: 'dev-user-id',
      })
      return next()
    }
  }

  // Use Clerk middleware in production or if DEV_TOKEN doesn't match
  return clerkMiddleware()(req, res, next)
}

/**
 * Require authenticated user, returns 401 if not logged in
 */
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.auth().userId) {
    return res.status(401).json({ message: 'Unauthenticated' })
  }
  next()
}

/**
 * Require admin role from Clerk metadata, returns 403 if not admin
 */
export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.auth().userId
    logger.debug({ userId: req.auth().userId }, 'User ID retrieved')
    if (!userId) return res.status(401).json({ message: 'Unauthenticated' })

    // In development mode with DEV_TOKEN, automatically grant admin access
    if (isDevelopmentMode && config.DEV_TOKEN && userId === 'dev-user-id') {
      logger.info('Development mode: Granting admin access')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(req as any).userRole = 'admin'
      return next()
    }

    // Production mode: Check Clerk for admin role
    const user = await clerkClient.users.getUser(userId)
    // Clerk user object exposes `publicMetadata` (camelCase)
    const role = user.publicMetadata?.role

    if (role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: admin only' })
    }

    // optionally attach role to req for downstream handlers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(req as any).userRole = role
    next()
  } catch (err) {
    logger.error({ error: err }, 'Error in requireAdmin middleware')
    return res.status(500).json({ message: 'Internal server error' })
  }
}
