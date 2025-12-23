import { Router, Request, Response } from 'express'
import mongoose from 'mongoose'
import { redisClient } from '@/config/redis'

const router = Router()

/**
 * @route GET /health/liveness
 * @description Checks if the application is running.
 * @access Public
 */
router.get('/liveness', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' })
})

/**
 * @route GET /health/readiness
 * @description Checks if the application is ready to serve traffic (DB & cache connected).
 * @access Public
 */
router.get('/readiness', async (req: Request, res: Response) => {
  try {
    const dbReady = mongoose.connection.readyState === 1
    const redisReady = redisClient.isOpen

    if (dbReady && redisReady) {
      return res.status(200).json({
        status: 'ready',
        checks: { db: 'ok', redis: 'ok' },
      })
    }

    res.status(503).json({
      status: 'unavailable',
      checks: {
        db: dbReady ? 'ok' : 'error',
        redis: redisReady ? 'ok' : 'error',
      },
    })
  } catch (error) {
    res.status(503).json({ status: 'error', message: (error as Error).message })
  }
})

export default router
