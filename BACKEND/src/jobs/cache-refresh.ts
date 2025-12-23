import cron from 'node-cron'
import logger from '@/utils/logger'
import { config } from '@/config'
import { DocumentModel } from '@/models/document.model'
import { redisClient } from '@/config/redis'

let lastRun: Date | null = null

export const refreshCacheJob = async () => {
  logger.info('Starting daily cache refresh job...')

  const query = lastRun ? { createdAt: { $gt: lastRun } } : {}
  const newDocuments = await DocumentModel.find(query).lean()

  if (newDocuments.length === 0) {
    logger.info('No new documents found. Cache is up to date.')
    return
  }

  logger.info(`Found ${newDocuments.length} new documents to refresh in cache.`)

  for (const doc of newDocuments) {
    const cacheKey = `content:doc:${doc._id}`
    try {
      await redisClient.set(cacheKey, JSON.stringify(doc), {
        EX: config.DOC_CACHE_TTL,
      })
      logger.info(`Refreshed cache for document ${doc._id}`)
    } catch (e) {
      logger.error(e, `Failed to refresh cache for document ${doc._id}`)
    }
  }

  // Optionally, invalidate the first page of the list cache
  const firstPageCacheKey = 'content:list:page:1:limit:20'
  try {
    await redisClient.del(firstPageCacheKey)
    logger.info(`Invalidated first page list cache: ${firstPageCacheKey}`)
  } catch (e) {
    logger.error(e, `Failed to invalidate cache for key ${firstPageCacheKey}`)
  }

  lastRun = new Date()
  logger.info('Cache refresh job finished.')
}

export const scheduleJobs = () => {
  cron.schedule('0 0 * * *', refreshCacheJob, {
    scheduled: true,
    timezone: 'UTC',
    runOnInit: true,
  })
  logger.info(`Scheduled cache refresh job with cron string: 0 0 * * *`)
}
