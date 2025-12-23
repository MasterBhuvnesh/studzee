import { createClient } from 'redis'
import logger from '@/utils/logger'
import { config } from '@/config'

export const redisClient = createClient({
  url: config.REDIS_URL,
})

redisClient.on('error', (err) => logger.error('❌ Redis Client Error', err))
redisClient.on('connect', () => logger.info('✅ Redis connected successfully'))

export const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect()
  }
}

export const disconnectRedis = async () => {
  if (redisClient.isOpen) {
    await redisClient.quit()
  }
}
