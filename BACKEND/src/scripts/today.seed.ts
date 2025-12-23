import fs from 'fs'
import path from 'path'
import { connectDB, disconnectDB } from '@/config/mongo'
import { connectRedis, disconnectRedis } from '@/config/redis'
import { uploadToS3 } from '@/config/s3'
import { DocumentModel } from '@/models/document.model'
import { DocumentSchema } from '@/models/document.schema'
import { invalidateAllCache } from '@/utils/cache'
import logger from '@/utils/logger'

/**
 * Sanitize a string to be used as a filename
 */
const sanitizeFilename = (filename: string): string => {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

/**
 * Seed database with documents including S3 file uploads
 */
const seedDatabaseWithFiles = async () => {
  logger.info('Starting database seeding with S3 file uploads...')

  // Connect to databases
  await connectDB()
  await connectRedis()

  try {
    // 1. Starting Process
    logger.warn('Starting Process...')

    // 2. Read sample data from JSON file
    const dataPath = path.join(__dirname, '..', 'data', 'today.data.json')
    const sampleData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))

    // 3. Define file paths
    const imagePath = path.join(__dirname, '..', 'data', 'today.png')
    const pdfPath = path.join(__dirname, '..', 'data', 'today.pdf')

    // 4. Validate files exist
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found: ${imagePath}`)
    }
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`PDF file not found: ${pdfPath}`)
    }

    logger.info(`Found ${sampleData.length} documents to seed with files.`)

    let successCount = 0

    for (let index = 0; index < sampleData.length; index++) {
      const doc = sampleData[index]
      const docNumber = index + 1

      logger.info(
        `\nProcessing document ${docNumber}/${sampleData.length}: ${doc.title}`
      )

      try {
        // Validate document data
        const validation = DocumentSchema.safeParse(doc)
        if (!validation.success) {
          logger.error(
            `Invalid document: ${doc.title}`,
            validation.error.flatten().fieldErrors
          )
          continue
        }

        // Create document first to get MongoDB ID
        const document = await DocumentModel.create(validation.data)
        const documentId = document._id.toString()

        logger.info(`  ├─ Document created with ID: ${documentId}`)

        // Upload image to S3
        try {
          logger.info(`  ├─ Uploading image (today.png)...`)
          const imageBuffer = fs.readFileSync(imagePath)

          // Use document ID for unique filename
          const { url: imageUrl } = await uploadToS3(
            imageBuffer,
            'images',
            `${documentId}.png`,
            'image/png'
          )

          logger.info(`  ├─ Image uploaded: ${imageUrl}`)

          // Update document with image URL
          document.imageUrl = imageUrl
        } catch (error) {
          logger.error(`  ├─ Failed to upload image:`, error)
          // Continue without image
        }

        // Upload PDF to S3
        try {
          logger.info(`  ├─ Uploading PDF (today.pdf)...`)
          const pdfBuffer = fs.readFileSync(pdfPath)

          const sanitizedTitle = sanitizeFilename(document.title)
          const {
            url: pdfUrl,
            uploadedAt,
            size,
          } = await uploadToS3(
            pdfBuffer,
            'pdfs',
            `${sanitizedTitle}.pdf`,
            'application/pdf',
            'today.pdf'
          )

          logger.info(`  ├─ PDF uploaded: ${pdfUrl}`)

          // Update document with PDF metadata
          document.pdfUrl = [
            {
              name: 'today.pdf',
              url: pdfUrl,
              uploadedAt,
              size,
            },
          ]
        } catch (error) {
          logger.error(`  ├─ Failed to upload PDF:`, error)
          // Continue without PDF
        }

        // Save document with file URLs
        await document.save()
        logger.info(`  └─ Document saved successfully with file URLs`)

        successCount++
      } catch (error) {
        logger.error(`Failed to process document: ${doc.title}`, error)
      }
    }

    logger.info(
      `\n✅ Successfully seeded ${successCount}/${sampleData.length} documents`
    )

    // 5. Invalidate Redis cache
    logger.info('Invalidating Redis cache...')
    await invalidateAllCache()
    logger.info('Cache invalidated successfully')
  } catch (error) {
    logger.error('Error during database seeding:', error)
    process.exit(1)
  } finally {
    await disconnectDB()
    await disconnectRedis()
    logger.info('Disconnected from databases.')
  }
}

// Run the seeding script
seedDatabaseWithFiles()
