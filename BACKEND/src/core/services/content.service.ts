import { config } from '../../config'
import { redisClient } from '../../config/redis'
import { DocumentModel } from '../../models/document.model'
import { TDocument } from '../../types/document'
import logger from '../../utils/logger'

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

  // Get current time in IST (UTC+5:30)
  const now = new Date()
  const istOffset = 5.5 * 60 * 60 * 1000 // 5 hours 30 minutes in milliseconds
  const istNow = new Date(now.getTime() + istOffset)

  // Start of today in IST
  const startOfDay = new Date(istNow)
  startOfDay.setUTCHours(0, 0, 0, 0)

  // End of today in IST
  const endOfDay = new Date(istNow)
  endOfDay.setUTCHours(23, 59, 59, 999)

  const documents = await DocumentModel.find(
    {
      createdAt: {
        $gte: new Date(startOfDay.getTime() - istOffset),
        $lte: new Date(endOfDay.getTime() - istOffset),
      },
    },
    'title summary createdAt'
  )
    .sort({ createdAt: -1 })
    .lean()

  const response = {
    data: documents.map((doc) => ({ ...doc, id: doc._id })),
    meta: {
      date: istNow.toISOString().split('T')[0],
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
