import { redisClient } from '@/config'
import logger from '@/utils/logger'

/**
 * Collect keys matching a glob using SCAN.
 *
 * KEYS blocks the Redis event loop for the whole traversal, which is fine on a
 * small keyspace and a hazard on a large one. SCAN walks the keyspace in
 * batches and never blocks.
 */
const scanKeys = async (pattern: string): Promise<string[]> => {
  const found: string[] = []
  let cursor = 0

  do {
    const reply = await redisClient.scan(cursor, { MATCH: pattern, COUNT: 250 })
    cursor = reply.cursor
    found.push(...reply.keys)
  } while (cursor !== 0)

  return found
}

/**
 * Delete every cached content entry.
 * Called after any admin write, since a write can change list order and counts.
 */
export const invalidateAllCache = async (): Promise<void> => {
  try {
    const keys = [
      ...(await scanKeys('content:list:*')),
      ...(await scanKeys('content:doc:*')),
      ...(await scanKeys('content:today')),
    ]

    if (keys.length === 0) {
      logger.info('Cache invalidation: nothing to delete')
      return
    }

    await redisClient.del(keys)
    logger.info(`Cache invalidated: ${keys.length} key(s) deleted`)
  } catch (error) {
    // A cache miss is cheap. Never fail an admin write because Redis is down.
    logger.error(error, 'Failed to invalidate cache')
  }
}

/**
 * Invalidate the cache entry for a single document.
 */
export const invalidateDocumentCache = async (
  documentId: string
): Promise<void> => {
  try {
    await redisClient.del(`content:doc:${documentId}`)
    logger.info(`Document cache invalidated: ${documentId}`)
  } catch (error) {
    logger.error(error, `Failed to invalidate document cache: ${documentId}`)
  }
}

/**
 * Invalidate every paginated list cache.
 * Called when document count or ordering changes but no single document did.
 */
export const invalidateListCache = async (): Promise<void> => {
  try {
    const keys = await scanKeys('content:list:*')
    if (keys.length === 0) return

    await redisClient.del(keys)
    logger.info(`List cache invalidated: ${keys.length} key(s) deleted`)
  } catch (error) {
    logger.error(error, 'Failed to invalidate list cache')
  }
}
