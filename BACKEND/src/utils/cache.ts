import { redisClient } from '@/config/redis'
import logger from '@/utils/logger'

/**
 * Invalidate all cache entries
 * Call this after any admin operation (create, update, delete, upload)
 */
export const invalidateAllCache = async (): Promise<void> => {
  try {
    // Delete all keys matching content patterns
    const listKeys = await redisClient.keys('content:list:*')
    const docKeys = await redisClient.keys('content:doc:*')
    const todayKeys = await redisClient.keys('content:today')

    const allKeys = [...listKeys, ...docKeys, ...todayKeys]

    if (allKeys.length > 0) {
      await redisClient.del(allKeys)
      logger.info(`Cache invalidated: ${allKeys.length} keys deleted`, {
        listKeys: listKeys.length,
        docKeys: docKeys.length,
        todayKeys: todayKeys.length,
      })
    } else {
      logger.info('Cache invalidation: No keys to delete')
    }
  } catch (error) {
    logger.error(error, 'Failed to invalidate cache')
    // Don't throw - cache invalidation failure shouldn't break admin operations
  }
}

/**
 * Invalidate cache for a specific document
 * @param documentId - The document ID to invalidate
 */
export const invalidateDocumentCache = async (
  documentId: string
): Promise<void> => {
  try {
    const key = `content:doc:${documentId}`
    await redisClient.del(key)
    logger.info(`Document cache invalidated: ${key}`)
  } catch (error) {
    logger.error(error, `Failed to invalidate document cache: ${documentId}`)
  }
}

/**
 * Invalidate all list caches
 * Call this when document count or order changes
 */
export const invalidateListCache = async (): Promise<void> => {
  try {
    const listKeys = await redisClient.keys('content:list:*')
    if (listKeys.length > 0) {
      await redisClient.del(listKeys)
      logger.info(`List cache invalidated: ${listKeys.length} keys deleted`)
    }
  } catch (error) {
    logger.error(error, 'Failed to invalidate list cache')
  }
}
