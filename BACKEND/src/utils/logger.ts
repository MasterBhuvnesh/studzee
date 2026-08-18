import pino from 'pino'
import { config } from '@/config'

/**
 * pino-pretty is a development dependency, so it is absent from the production
 * image. Pino resolves the transport target lazily and throws at import time
 * when it is missing, which takes the process down before any route is
 * registered. Resolving it ourselves turns that crash into a fallback onto the
 * JSON logger, so the image runs whatever NODE_ENV it is given.
 */
const prettyPrintAvailable = ((): boolean => {
  try {
    require.resolve('pino-pretty')
    return true
  } catch {
    return false
  }
})()

/**
 * Pino logger with pretty printing in dev, JSON in production
 */
const logger =
  config.NODE_ENV === 'development' && prettyPrintAvailable
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
