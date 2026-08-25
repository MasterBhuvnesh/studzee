import fs from 'fs'
import path from 'path'
import { z } from 'zod'
import { connectDB, disconnectDB } from '@/config'
import { DocumentModel } from '@/models/document.model'
import { DocumentSchema } from '@/models/document.validation'
import { buildBackfillPatch } from '@/cli/seeds/topic-backfill'
import logger from '@/utils/logger'

/**
 * ADDITIVE TOPIC SEEDER
 *
 * Unlike seed.ts, this script never clears the collection. Each entry in
 * data.json is inserted only when no document with the same title exists;
 * existing documents are left untouched, so it is safe to run repeatedly.
 *
 * After the insert pass a BACKFILL stage runs for the same fixtures. Old
 * production documents predate both the topic field and tags, which made them
 * invisible to topic filtering. For every fixture title that already exists,
 * only the missing fields are filled in from the fixture: an absent topic gets
 * the fixture topic, absent or empty tags get the fixture tags, and existing
 * values are never overwritten. Note that neither inserting nor backfilling
 * invalidates Redis list caches, so filtered pages may lag behind until their
 * TTL expires.
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
    const validatedDocs: z.infer<typeof DocumentSchema>[] = []

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

      validatedDocs.push(validation.data)

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

    // BACKFILL STAGE
    let backfilledCount = 0
    let untouchedCount = 0

    for (const fixture of validatedDocs) {
      const stored = await DocumentModel.findOne({
        title: fixture.title,
      })
        .select('topic tags')
        .lean<{ topic?: unknown; tags?: unknown } | null>()

      // Absent means it was inserted by the pass above (or vanished between
      // passes); either way it already carries topic and tags.
      if (!stored) continue

      const patch = buildBackfillPatch(stored, fixture)
      if (Object.keys(patch).length === 0) {
        untouchedCount++
        continue
      }

      // updateMany scoped to the exact fixture title, mirroring how findOne
      // located the document; $set touches only the missing fields.
      await DocumentModel.updateMany({ title: fixture.title }, { $set: patch })
      backfilledCount++
      logger.info(`Backfilled fields for: ${fixture.title}`, { patch })
    }

    logger.info(
      `Backfill finished: ${backfilledCount} documents updated, ${untouchedCount} already complete.`
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
