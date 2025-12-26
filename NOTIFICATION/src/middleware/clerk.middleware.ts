import { clerkClient } from '@clerk/clerk-sdk-node'
import { clerkMiddleware } from '@clerk/express'
import { NextFunction, Request, Response } from 'express'
import { config } from '@/config'
import logger from '@/utils/logger'

const isDevelopmentMode = config.NODE_ENV === 'development'

// Clerk authentication middleware with dev mode bypass using DEV_TOKEN
export const clerkAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (isDevelopmentMode && config.DEV_TOKEN) {
    const authHeader = req.headers.authorization
    const token = authHeader?.replace('Bearer ', '')

    if (token === config.DEV_TOKEN) {
      logger.info('Development mode: Using DEV_TOKEN authentication bypass')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(req as any).auth = () => ({
        userId: 'dev-user-id',
      })
      return next()
    }
  }

  return clerkMiddleware()(req, res, next)
}

// Ensures user is authenticated, returns 401 if not logged in
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

// Verifies user has admin role in Clerk publicMetadata, returns 403 if not admin
export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.auth().userId
    logger.debug({ userId: req.auth().userId }, 'User ID retrieved')
    if (!userId) return res.status(401).json({ message: 'Unauthenticated' })

    if (isDevelopmentMode && config.DEV_TOKEN && userId === 'dev-user-id') {
      logger.info('Development mode: Granting admin access')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(req as any).userRole = 'admin'
      return next()
    }

    const user = await clerkClient.users.getUser(userId)
    const role = user.publicMetadata?.role

    if (role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: admin only' })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(req as any).userRole = role
    next()
  } catch (err) {
    logger.error({ error: err }, 'Error in requireAdmin middleware')
    return res.status(500).json({ message: 'Internal server error' })
  }
}
