import mongoose from 'mongoose'
import logger from '@/utils/logger'
import { config } from '@/config'
import dns from 'dns'

let isConnected = false

export const connectDB = async () => {
  if (isConnected) {
    logger.info('=> using existing database connection')
    return
  }

  // Set DNS servers to avoid local network issues (e.g. SRV record lookup failures)
  dns.setServers(['1.1.1.1', '8.8.8.8'])

  try {
    await mongoose.connect(config.MONGO_URI, { dbName: config.DB_NAME })

    isConnected = true
    logger.info(`SUCCESS: MongoDB connected successfully to database: ${config.DB_NAME}`)
  } catch (error: any) {
    console.error("MongoDB connection error:", error)
    logger.error(`ERROR: MongoDB connection error (${error.code || 'UNKNOWN'}): ${error.message}`)
    if (error.code === 'ECONNREFUSED') {
      logger.error('TIP: Check your network/DNS settings or if your IP is whitelisted in Atlas.')
    }
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
