import pino from 'pino'
import { config } from '@/config'

// Create logger based on environment
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
