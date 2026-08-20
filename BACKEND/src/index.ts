import compression from 'compression'
import cors from 'cors'
import dns from 'dns'
import express from 'express'
import rateLimit from 'express-rate-limit'
import morgan from 'morgan'

import adminRoutes from '@/api/routes/admin.route'
import contentRoutes from '@/api/routes/content.route'
import healthRoutes from '@/api/routes/health.route'
import healthcheckRoute from '@/api/routes/healthcheck.route'
import notificationRoutes from '@/api/routes/notification.route'
import pdfRoutes from '@/api/routes/pdf.route'
import webhookRoutes from '@/api/routes/webhook.route'
import { config, connectDB, connectPostgres, connectRedis } from '@/config'
import { scheduleJobs } from '@/jobs/cache-refresh'
import { startHeartbeatJob } from '@/jobs/heartbeat'
import { startTokenCleanupJob } from '@/jobs/token-cleanup'
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler'
import { helmetConfig } from '@/middleware/helmet'
import logger from '@/utils/logger'

const main = async () => {
  try {
    const app = express()

    // Public DNS resolvers, so Atlas SRV lookups do not depend on the host's
    // resolver being reachable.
    dns.setServers(['1.1.1.1', '8.8.8.8'])

    // The service runs behind a proxy in every deployed environment. Without
    // this the rate limiter sees the proxy address for every caller and
    // throttles all traffic as if it came from one client.
    app.set('trust proxy', 1)

    app.use(helmetConfig)
    app.use(cors())
    app.use(compression())
    app.use(morgan('dev'))

    // Webhooks mount ahead of the JSON parser. Signature verification needs the
    // raw request bytes, which a parsed and re-serialized body cannot provide.
    app.use('/webhooks', webhookRoutes)

    app.use(express.json())

    app.use(
      rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        standardHeaders: true,
        legacyHeaders: false,
      })
    )

    // --- Data stores ---
    // MongoDB holds content, Postgres holds users and delivery logs, Redis is
    // the read cache. All three are required, so failure here aborts startup.
    await connectDB()
    await connectPostgres()
    await connectRedis()

    // --- Welcome route ---
    app.get('/', (req, res) => {
      res.json({
        message: 'Studzee Backend API',
        status: 'running',
        endpoints: {
          health: '/healthcheck',
          liveness: '/health/liveness',
          readiness: '/health/readiness',
          content: '/content',
          pdfs: '/pdfs',
          notifications: '/notifications/register',
          admin: '/admin',
          webhooks: '/webhooks/clerk',
        },
      })
    })

    // --- Routes ---
    app.use('/content', contentRoutes)
    app.use('/pdfs', pdfRoutes)
    app.use('/notifications', notificationRoutes)
    app.use('/admin', adminRoutes)
    app.use('/health', healthRoutes)
    app.use('/', healthcheckRoute)
    app.get('/favicon.ico', (req, res) => res.status(204).end())

    // --- Error handling ---
    app.use(notFoundHandler)
    app.use(errorHandler)

    // --- Start server ---
    app.listen(config.PORT, () => {
      logger.info(`Server running at http://localhost:${config.PORT}`)
      startHeartbeatJob()
      startTokenCleanupJob()
      scheduleJobs()
    })
  } catch (err) {
    logger.error(err, 'Failed to start server')
    process.exit(1)
  }
}

main()
