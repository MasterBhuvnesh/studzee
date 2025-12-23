import mongoose from 'mongoose'
import logger from '@/utils/logger'
import { config } from '@/config'

let isConnected = false

export const connectDB = async () => {
  if (isConnected) {
    logger.info('=> using existing database connection')
    return
  }

  try {
    await mongoose.connect(config.MONGO_URI)
    isConnected = true
    logger.info('SUCCESS: MongoDB connected successfully')
  } catch (error) {
    logger.error('ERROR: MongoDB connection error:', error)
    process.exit(1)
  }
}

export const disconnectDB = async () => {
  if (!isConnected) {
    return
  }
  await mongoose.disconnect()
  isConnected = false
  logger.info('MongoDB disconnected')
}
