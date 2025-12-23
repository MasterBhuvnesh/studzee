import pino from 'pino'
import { config } from '@/config'

/**
 * Pino logger with pretty printing in dev, JSON in production
 */
const logger =
  config.NODE_ENV === 'development'
    ? pino({
        level: config.LOG_LEVEL,
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      })
    : pino({
        level: config.LOG_LEVEL,
      })

export default logger
