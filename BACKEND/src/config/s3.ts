import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  PutObjectCommandInput,
} from '@aws-sdk/client-s3'
import { config } from '@/config'
import logger from '@/utils/logger'

/**
 * S3 protocol client for object storage.
 *
 * The backing store is Supabase Storage in deployed environments and MinIO
 * locally. Both speak the S3 protocol, so one client and one code path serve
 * both, selected purely by S3_ENDPOINT.
 *
 * forcePathStyle is required, not optional. Supabase and MinIO both address
 * buckets as a path segment (endpoint/bucket/key). The AWS SDK defaults to
 * virtual-hosted style (bucket.host/key), which neither resolves. This was
 * previously applied only when NODE_ENV was development, which happened to
 * work while the deployed store was real AWS and breaks against Supabase.
 */
const s3Client = new S3Client({
  region: config.S3_REGION,
  endpoint: config.S3_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: config.S3_ACCESS_KEY_ID,
    secretAccessKey: config.S3_SECRET_ACCESS_KEY,
  },
})

export { s3Client }

/** Public URL base without a trailing slash, so joins never double up. */
const publicUrlBase = config.S3_PUBLIC_URL.replace(/\/+$/, '')

/**
 * Public URL of a stored object.
 *
 * Supabase serves public objects from a different host to its S3 endpoint
 * (`<ref>.supabase.co/storage/v1/object/public/<bucket>` rather than
 * `<ref>.storage.supabase.co/storage/v1/s3`), so this is configured rather
 * than derived. The previous implementation hardcoded the AWS virtual-hosted
 * form and produced unreachable URLs against any other provider.
 */
export const getPublicUrl = (key: string): string =>
  `${publicUrlBase}/${key.replace(/^\/+/, '')}`

/**
 * Upload a file.
 *
 * @param fileBuffer - File contents
 * @param folder - Key prefix, for example 'images' or 'pdfs'
 * @param filename - Object filename, including extension
 * @param contentType - MIME type stored against the object
 * @param originalFilename - Filename as supplied by the uploader, kept for display
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
  const key = `${folder}/${filename}`

  try {
    const uploadParams: PutObjectCommandInput = {
      Bucket: config.S3_BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    }

    await s3Client.send(new PutObjectCommand(uploadParams))

    const url = getPublicUrl(key)
    const uploadedAt = new Date()

    logger.info({ key, size: fileBuffer.length }, 'Object uploaded')

    return {
      url,
      publicId: key,
      uploadedAt,
      size: fileBuffer.length,
      originalFilename,
    }
  } catch (error) {
    logger.error(error, `Upload failed for ${key}`)
    throw error
  }
}

/**
 * Delete an object by key, for example 'images/507f1f77bcf86cd799439011.png'.
 */
export const deleteFromS3 = async (key: string): Promise<void> => {
  try {
    await s3Client.send(
      new DeleteObjectCommand({ Bucket: config.S3_BUCKET, Key: key })
    )
    logger.info({ key }, 'Object deleted')
  } catch (error) {
    logger.error(error, `Delete failed for ${key}`)
    throw error
  }
}

/**
 * Recover the object key from a stored public URL.
 *
 * Stripping the configured public base is the only reliable approach. Taking
 * the URL path, as this used to, yields `storage/v1/object/public/<bucket>/...`
 * on Supabase rather than the key, so every delete would target the wrong
 * object or fail.
 */
export const getKeyFromUrl = (url: string): string => {
  if (url.startsWith(publicUrlBase)) {
    return url.slice(publicUrlBase.length).replace(/^\/+/, '')
  }

  // A URL stored under a previous provider. Fall back to the trailing
  // <folder>/<filename> pair, which has been the key shape throughout.
  const segments = new URL(url).pathname.split('/').filter(Boolean)
  if (segments.length >= 2) {
    const key = segments.slice(-2).join('/')
    logger.warn({ url, key }, 'Object URL is not on the configured host')
    return key
  }

  throw new Error(`Cannot derive an object key from URL: ${url}`)
}
