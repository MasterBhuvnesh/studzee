import { config, redisClient } from '@/config'
import { DocumentModel } from '@/models/document.model'
import { TDocument } from '@/types/document'
import logger from '@/utils/logger'

/**
 * Query MongoDB for paginated documents (parallel fetch + count)
 */
const getPaginatedContentFromDB = async (page: number, limit: number) => {
  const skip = (page - 1) * limit
  const [documents, total] = await Promise.all([
    DocumentModel.find({}, 'title summary createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    DocumentModel.countDocuments(),
  ])
  return { documents, total }
}

/**
 * Fetch paginated documents with Redis caching (cache-aside pattern)
 */
export const listContent = async (page: number, limit: number) => {
  const cacheKey = `content:list:page:${page}:limit:${limit}`

  try {
    const cachedData = await redisClient.get(cacheKey)
    if (cachedData) {
      logger.info(`CACHE HIT for ${cacheKey}`)
      return JSON.parse(cachedData)
    }
  } catch (e) {
    logger.error(e, `Redis error for key ${cacheKey}`)
  }

  logger.info(`CACHE MISS for ${cacheKey}`)
  const { documents, total } = await getPaginatedContentFromDB(page, limit)

  const response = {
    data: documents.map((doc) => ({ ...doc, id: doc._id })),
    meta: { page, limit, total },
  }

  try {
    await redisClient.set(cacheKey, JSON.stringify(response), {
      EX: config.LIST_CACHE_TTL,
    })
  } catch (e) {
    logger.error(e, `Redis SET error for key ${cacheKey}`)
  }

  return response
}

/**
 * Get document by ID with Redis caching
 */
export const getContentById = async (id: string): Promise<TDocument | null> => {
  const cacheKey = `content:doc:${id}`

  try {
    const cachedData = await redisClient.get(cacheKey)
    if (cachedData) {
      logger.info(`CACHE HIT for ${cacheKey}`)
      return JSON.parse(cachedData)
    }
  } catch (e) {
    logger.error(e, `Redis error for key ${cacheKey}`)
  }

  logger.info(`CACHE MISS for ${cacheKey}`)
  const document = await DocumentModel.findById(id).lean()

  if (!document) {
    return null
  }

  try {
    await redisClient.set(cacheKey, JSON.stringify(document), {
      EX: config.DOC_CACHE_TTL,
    })
  } catch (e) {
    logger.error(e, `Redis SET error for key ${cacheKey}`)
  }

  return document
}

/**
 * Get today's documents in IST timezone with caching
 */
export const getTodayContent = async () => {
  const cacheKey = `content:today`

  try {
    const cachedData = await redisClient.get(cacheKey)
    if (cachedData) {
      logger.info(`CACHE HIT for ${cacheKey}`)
      return JSON.parse(cachedData)
    }
  } catch (e) {
    logger.error(e, `Redis error for key ${cacheKey}`)
  }

  logger.info(`CACHE MISS for ${cacheKey}`)

  // The IST day runs from 18:30 UTC the previous day to 18:30 UTC today.
  // Shifting a date forward by the offset and then calling setUTCHours on the
  // shifted value, as this used to, conflates the two clocks. Working out the
  // day number in IST and converting the boundaries straight back to UTC is
  // both correct and readable.
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000
  const nowInIst = new Date(Date.now() + IST_OFFSET_MS)

  const startOfIstDayUtc = new Date(
    Date.UTC(
      nowInIst.getUTCFullYear(),
      nowInIst.getUTCMonth(),
      nowInIst.getUTCDate()
    ) - IST_OFFSET_MS
  )
  const endOfIstDayUtc = new Date(
    startOfIstDayUtc.getTime() + 24 * 60 * 60 * 1000 - 1
  )

  const documents = await DocumentModel.find(
    { createdAt: { $gte: startOfIstDayUtc, $lte: endOfIstDayUtc } },
    'title summary createdAt'
  )
    .sort({ createdAt: -1 })
    .lean()

  const response = {
    data: documents.map((doc) => ({ ...doc, id: doc._id })),
    meta: {
      date: nowInIst.toISOString().split('T')[0],
      total: documents.length,
    },
  }

  try {
    await redisClient.set(cacheKey, JSON.stringify(response), {
      EX: config.TODAY_CACHE_TTL,
    })
  } catch (e) {
    logger.error(e, `Redis SET error for key ${cacheKey}`)
  }

  return response
}
