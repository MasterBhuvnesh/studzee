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
    let invalidCount = 0

    for (const doc of sampleData) {
      const validation = DocumentSchema.safeParse(doc)
      if (validation.success) {
        await DocumentModel.create(validation.data)
        successCount++
      } else {
        invalidCount++
        // Pino takes the context object first. Passing it second, as this used
        // to, silently discarded it and left "Invalid document:" with no reason.
        logger.error(
          {
            title: doc?.title ?? '(untitled)',
            errors: validation.error.flatten().fieldErrors,
          },
          'Invalid document, skipping'
        )
      }
    }

    logger.info(`Successfully seeded ${successCount} documents.`)

    // The database has just been emptied, so seeding nothing leaves it empty.
    // Exiting 0 there reports success for a failed seed.
    if (invalidCount > 0) {
      logger.error(`${invalidCount} document(s) failed validation`)
      process.exitCode = 1
    }
  } catch (error) {
    logger.error(error, 'Error during database seeding')
    process.exit(1)
  } finally {
    await disconnectDB()
    logger.info('Database disconnected.')
  }
}

seedDatabase()
