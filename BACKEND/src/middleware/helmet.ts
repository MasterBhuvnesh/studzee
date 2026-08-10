import helmet from 'helmet'
import { config } from '@/config'

/**
 * Public base URL of the asset bucket, derived from validated config.
 *
 * This previously read process.env.AWS_S3_BUCKET_URL, a variable defined
 * nowhere, so the image directive resolved to the literal string "undefined".
 */
const bucketUrl =
  config.AWS_S3_BUCKET_ENDPOINT ??
  `https://${config.AWS_S3_BUCKET_NAME}.s3.${config.AWS_REGION}.amazonaws.com`

export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", bucketUrl],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
})
