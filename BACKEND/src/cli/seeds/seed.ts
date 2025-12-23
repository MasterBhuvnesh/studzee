import fs from 'fs'
import path from 'path'
import logger from '@/utils/logger'
import { connectDB, disconnectDB } from '@/config'
import { DocumentModel } from '@/models/document.model'
import { DocumentSchema } from '@/models/document.validation'

const seedDatabase = async () => {
  logger.info('Connecting to database for seeding...')
  await connectDB()

  try {
    // 1. Clear existing data
    logger.warn('Clearing existing documents from the database...')
    await DocumentModel.deleteMany({})

    // 2. Read sample data from JSON file
    const dataPath = path.join(__dirname, '..', '..', 'data', 'data.json')
    const sampleData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))

    // 3. Validate and insert data
    logger.info(`Found ${sampleData.length} documents to seed.`)
    let successCount = 0
    for (const doc of sampleData) {
      const validation = DocumentSchema.safeParse(doc)
      if (validation.success) {
        await DocumentModel.create(validation.data)
        successCount++
      } else {
        logger.error(
          'Invalid document:',
          validation.error.flatten().fieldErrors
        )
      }
    }
    logger.info(`Successfully seeded ${successCount} documents.`)
  } catch (error) {
    logger.error('Error during database seeding:', error)
    process.exit(1)
  } finally {
    await disconnectDB()
    logger.info('Database disconnected.')
  }
}

seedDatabase()
