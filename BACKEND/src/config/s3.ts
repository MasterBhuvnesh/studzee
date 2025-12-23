import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  PutObjectCommandInput,
} from '@aws-sdk/client-s3'
import { config } from '@/config'
import logger from '@/utils/logger'

// Initialize S3 client
const s3Client = new S3Client({
  region: config.AWS_REGION,
  ...(config.NODE_ENV === 'development' && {
    endpoint: config.AWS_S3_BUCKET_URL,
    forcePathStyle: true,
  }),
  credentials: {
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
  },
})

logger.info('S3 client configured', {
  region: config.AWS_REGION,
  bucket: config.AWS_S3_BUCKET_NAME,
})

export { s3Client }

/**
 * Upload a file to S3
 * @param fileBuffer - The file buffer to upload
 * @param folder - The folder to upload to (e.g., 'images' or 'pdfs')
 * @param filename - The desired filename (without extension)
 * @param contentType - The content type of the file
 * @param originalFilename - The original filename (optional)
 * @returns Upload result with URL, key (publicId), upload timestamp, size, and original filename
 */
export const uploadToS3 = async (
  fileBuffer: Buffer,
  folder: string,
  filename: string,
  contentType: string,
  originalFilename?: string
): Promise<{
  url: string
  publicId: string
  uploadedAt: Date
  size: number
  originalFilename?: string
}> => {
  try {
    // Construct the S3 key (path)
    const key = `${folder}/${filename}`

    logger.info('Starting S3 upload', {
      folder,
      filename,
      key,
      contentType,
      bufferSize: fileBuffer.length,
    })

    // Prepare upload parameters with public-read ACL
    const uploadParams: PutObjectCommandInput = {
      Bucket: config.AWS_S3_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    }

    // Upload to S3
    const command = new PutObjectCommand(uploadParams)
    await s3Client.send(command)

    // Construct the public URL
    const url = `https://${config.AWS_S3_BUCKET_NAME}.s3.${config.AWS_REGION}.amazonaws.com/${key}`

    const uploadedAt = new Date()
    const size = fileBuffer.length

    logger.info('S3 upload successful', {
      url,
      key,
      uploadedAt,
      size,
    })

    return {
      url,
      publicId: key,
      uploadedAt,
      size,
      originalFilename,
    }
  } catch (error) {
    logger.error(error, 'S3 upload error', {
      folder,
      filename,
    })
    throw error
  }
}

/**
 * Delete a file from S3 by key
 * @param key - The S3 key of the file to delete (e.g., 'images/filename.jpg')
 */
export const deleteFromS3 = async (key: string): Promise<void> => {
  try {
    logger.info('Deleting file from S3', { key })

    const command = new DeleteObjectCommand({
      Bucket: config.AWS_S3_BUCKET_NAME,
      Key: key,
    })

    await s3Client.send(command)

    logger.info('Deleted file from S3', { key })
  } catch (error) {
    logger.error(error, `Failed to delete file from S3: ${key}`)
    throw error
  }
}

/**
 * Extract S3 key from S3 URL
 * @param url - The S3 URL
 * @returns S3 key
 */
export const getKeyFromUrl = (url: string): string => {
  try {
    // Example URL: https://bucket-name.s3.region.amazonaws.com/folder/filename.ext
    // Extract: folder/filename.ext
    const urlObj = new URL(url)
    // Remove leading slash
    const key = urlObj.pathname.substring(1)

    logger.info('Extracted S3 key from URL', { url, key })
    return key
  } catch (error) {
    logger.error(error, 'Failed to extract S3 key from URL', { url })
    throw error
  }
}
