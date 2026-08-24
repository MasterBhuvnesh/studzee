import fs from 'fs'
import path from 'path'
import { connectDB, disconnectDB } from '@/config'
import { DocumentModel } from '@/models/document.model'
import { DocumentSchema } from '@/models/document.validation'
import logger from '@/utils/logger'

/**
 * ADDITIVE TOPIC SEEDER
 *
 * Unlike seed.ts, this script never clears the collection. Each entry in
 * data.json is inserted only when no document with the same title exists;
 * existing documents are left untouched, so it is safe to run repeatedly.
 * Note that inserting documents does not invalidate Redis list caches, so
 * filtered pages may lag behind until their TTL expires.
 */
const seedTopicDocuments = async () => {
  logger.info('Connecting to database for topic seeding...')
  await connectDB()

  try {
    const dataPath = path.join(__dirname, '..', '..', 'data', 'data.json')
    const sampleData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))

    logger.info(`Found ${sampleData.length} documents to consider.`)

    let insertedCount = 0
    let skippedCount = 0
    let invalidCount = 0

    for (const doc of sampleData) {
      const title = doc?.title ?? '(untitled)'

      const validation = DocumentSchema.safeParse(doc)
      if (!validation.success) {
        invalidCount++
        logger.error(
          { title, errors: validation.error.flatten().fieldErrors },
          'Invalid document, skipping'
        )
        continue
      }

      const existing = await DocumentModel.findOne({
        title: validation.data.title,
      })

      if (existing) {
        skippedCount++
        logger.info(`Document already exists, skipping: ${title}`)
        continue
      }

      await DocumentModel.create(validation.data)
      insertedCount++
      logger.info(`Inserted document: ${title}`)
    }

    logger.info(
      `Topic seeding finished: ${insertedCount} inserted, ${skippedCount} skipped (already existed), ${invalidCount} invalid.`
    )

    if (invalidCount > 0) {
      process.exitCode = 1
    }
  } catch (error) {
    logger.error(error, 'Error during topic seeding')
    process.exitCode = 1
  } finally {
    await disconnectDB()
    logger.info('Database disconnected.')
  }
}

seedTopicDocuments()
