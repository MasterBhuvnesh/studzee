import compression from 'compression'
import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import morgan from 'morgan'

import adminRoutes from '@/api/routes/admin.route'
import authRoutes from '@/api/routes/auth.route'
import contentRoutes from '@/api/routes/content.route'
import healthRoutes from '@/api/routes/health.route'
import { config, connectDB, connectRedis } from '@/config'
import { scheduleJobs } from '@/jobs/cache-refresh'
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler'
import { helmetConfig } from '@/middleware/helmet'
import logger from '@/utils/logger'

import healthcheckRoute from '@/api/routes/healthcheck.route' // For healthcheck route for Render
import pdfRoutes from '@/api/routes/pdf.route'
import { startHeartbeatJob } from '@/jobs/heartbeat' // Import the heartbeat job for scheduling Render pings

const main = async () => {
  try {
    const app = express()

    // --- Middleware ---
    app.use(helmetConfig)
    app.use(cors())
    app.use(compression())
    app.use(express.json())
    app.use(morgan('dev'))

    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      standardHeaders: true,
      legacyHeaders: false,
    })
    app.use(limiter)

    // --- Database & Cache Connections ---
    await connectDB()
    await connectRedis()

    // --- Welcome Route ---
    app.get('/', (req, res) => {
      res.json({
        message: 'Studzee Backend API',
        status: 'running',
        endpoints: {
          health: '/healthcheck',
          liveness: '/health/liveness',
          readiness: '/health/readiness',
          content: '/content',
          admin: '/admin',
          pdfs: '/pdfs',
        },
      })
    })
    // --- Routes ---
    app.use('/content', contentRoutes)
    app.use('/auth', authRoutes)
    app.use('/health', healthRoutes)
    app.use('/admin', adminRoutes)
    app.use('/pdfs', pdfRoutes)
    app.use('/', healthcheckRoute) // For healthcheck route for Render

    // --- Error Handling ---
    app.use(notFoundHandler)
    app.use(errorHandler)

    // --- Start Server ---
    app.listen(config.PORT, () => {
      logger.info(`Server running at http://localhost:${config.PORT}`)
      startHeartbeatJob()
      scheduleJobs()
    })
  } catch (err) {
    logger.error('❌ Failed to start server:', err)
    process.exit(1)
  }
}

main()
