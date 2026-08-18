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

/** An object identified by the bucket holding it and its key within it. */
export interface ObjectRef {
  bucket: string
  key: string
}

/**
 * Public URL of a stored object.
 *
 * Supabase serves public objects from a different host to its S3 endpoint
 * (`<ref>.supabase.co/storage/v1/object/public` rather than
 * `<ref>.storage.supabase.co/storage/v1/s3`), so the base is configured rather
 * than derived. The previous implementation hardcoded the AWS virtual-hosted
 * form and produced unreachable URLs against any other provider.
 */
export const getPublicUrl = (bucket: string, key: string): string =>
  `${publicUrlBase}/${bucket}/${key.replace(/^\/+/, '')}`

/**
 * Upload a file.
 *
 * @param fileBuffer - File contents
 * @param bucket - Destination bucket, images or pdfs
 * @param filename - Object key within the bucket, including extension
 * @param contentType - MIME type stored against the object
 * @param originalFilename - Filename as supplied by the uploader, kept for display
 */
export const uploadToS3 = async (
  fileBuffer: Buffer,
  bucket: string,
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
  const key = filename.replace(/^\/+/, '')

  try {
    const uploadParams: PutObjectCommandInput = {
      Bucket: bucket,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    }

    await s3Client.send(new PutObjectCommand(uploadParams))

    logger.info({ bucket, key, size: fileBuffer.length }, 'Object uploaded')

    return {
      url: getPublicUrl(bucket, key),
      publicId: key,
      uploadedAt: new Date(),
      size: fileBuffer.length,
      originalFilename,
    }
  } catch (error) {
    logger.error(error, `Upload failed for ${bucket}/${key}`)
    throw error
  }
}

/**
 * Delete an object.
 */
export const deleteFromS3 = async ({
  bucket,
  key,
}: ObjectRef): Promise<void> => {
  try {
    await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
    logger.info({ bucket, key }, 'Object deleted')
  } catch (error) {
    logger.error(error, `Delete failed for ${bucket}/${key}`)
    throw error
  }
}

/**
 * Recover the bucket and key from a stored public URL.
 *
 * Stripping the configured public base is the only reliable approach. Taking
 * the whole URL path, as this used to, yields
 * `storage/v1/object/public/<bucket>/...` on Supabase rather than the key, so
 * every delete would target the wrong object or fail.
 */
export const getObjectRef = (url: string): ObjectRef => {
  const remainder = url.startsWith(publicUrlBase)
    ? url.slice(publicUrlBase.length)
    : null

  if (remainder !== null) {
    const [bucket, ...rest] = remainder.replace(/^\/+/, '').split('/')
    if (bucket && rest.length > 0) {
      return { bucket, key: rest.join('/') }
    }
  }

  // A URL written under a previous provider or a different host. The last two
  // path segments have been the bucket and key shape throughout.
  const segments = new URL(url).pathname.split('/').filter(Boolean)
  if (segments.length >= 2) {
    const ref = {
      bucket: segments[segments.length - 2],
      key: segments[segments.length - 1],
    }
    logger.warn({ url, ...ref }, 'Object URL is not on the configured host')
    return ref
  }

  throw new Error(`Cannot derive an object reference from URL: ${url}`)
}
