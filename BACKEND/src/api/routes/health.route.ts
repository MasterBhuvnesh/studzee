import { Router, Request, Response } from 'express'
import mongoose from 'mongoose'
import { prisma, redisClient } from '@/config'
import logger from '@/utils/logger'

const router = Router()

/** A probe that hangs is a probe that fails. */
const PROBE_TIMEOUT_MS = 2000

type CheckState = 'ok' | 'error'

/**
 * Run a dependency probe with a timeout.
 *
 * Each probe issues a real round trip rather than reading a connection flag.
 * `mongoose.connection.readyState` and `redisClient.isOpen` describe what the
 * driver believes about its socket, which stays optimistic through a network
 * partition or a server that has stopped answering. A readiness endpoint that
 * reports healthy while every query fails is worse than no endpoint at all.
 */
const probe = async (
  name: string,
  check: () => Promise<unknown>
): Promise<CheckState> => {
  let timer: NodeJS.Timeout | undefined

  try {
    await Promise.race([
      check(),
      new Promise((_resolve, reject) => {
        timer = setTimeout(
          () => reject(new Error(`${name} probe timed out`)),
          PROBE_TIMEOUT_MS
        )
      }),
    ])
    return 'ok'
  } catch (error) {
    logger.warn({ err: error }, `Readiness probe failed: ${name}`)
    return 'error'
  } finally {
    if (timer) clearTimeout(timer)
  }
}

/**
 * @route GET /health/liveness
 * @description Checks if the process is running. Deliberately touches no
 *              dependency, so a database outage does not get the container
 *              restarted when the application itself is fine.
 * @access Public
 */
router.get('/liveness', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' })
})

/**
 * @route GET /health/readiness
 * @description Checks every backing store the service needs to serve traffic:
 *              MongoDB for content, Postgres for users and notifications, and
 *              Redis for caching. Postgres was previously unchecked, so an
 *              outage there left readiness reporting healthy while every
 *              notification endpoint failed.
 * @access Public
 */
router.get('/readiness', async (req: Request, res: Response) => {
  const [db, postgres, redis] = await Promise.all([
    probe('mongo', async () => {
      if (mongoose.connection.readyState !== 1) {
        throw new Error('mongo connection is not open')
      }
      return mongoose.connection.db?.admin().ping()
    }),
    probe('postgres', () => prisma.$queryRaw`SELECT 1`),
    probe('redis', async () => {
      if (!redisClient.isOpen) throw new Error('redis connection is not open')
      return redisClient.ping()
    }),
  ])

  const checks = { db, postgres, redis }
  const ready = Object.values(checks).every((state) => state === 'ok')

  res.status(ready ? 200 : 503).json({
    status: ready ? 'ready' : 'unavailable',
    checks,
  })
})

export default router
