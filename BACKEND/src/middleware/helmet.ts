import helmet from 'helmet'
import { config } from '@/config'

/**
 * Origin that serves stored images, derived from the configured public URL.
 *
 * This previously read process.env.AWS_S3_BUCKET_URL, a variable defined
 * nowhere, so the image directive resolved to the literal string "undefined".
 * Deriving it keeps the policy correct across storage providers.
 */
const storageOrigin = new URL(config.S3_PUBLIC_URL).origin

export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", storageOrigin],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
})
