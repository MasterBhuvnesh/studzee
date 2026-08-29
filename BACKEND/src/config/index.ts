import dotenv from 'dotenv'
import { z } from 'zod'

// Load .env file
dotenv.config()

const configSchema = z
  .object({
    PORT: z.coerce.number().default(4000),
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    CLERK_SECRET_KEY: z.string().startsWith('sk_'),
    CLERK_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
    CLERK_WEBHOOK_SIGNING_SECRET: z.string().optional(),
    MONGO_URI: z.string().min(1, 'MongoDB URI is required'),
    DB_NAME: z.string().default('Studzee_Database'),
    DATABASE_URL: z.string().url('Postgres connection string is required'),
    REDIS_URL: z.string().url(),
    LIST_CACHE_TTL: z.coerce.number().default(300),
    DOC_CACHE_TTL: z.coerce.number().default(86400),
    TODAY_CACHE_TTL: z.coerce.number().default(3600), // 1 hour
    JOB_CRON: z.string().default('0 0 * * *'),
    LOG_LEVEL: z.string().default('info'),
    // Object storage. Supabase Storage speaks the S3 protocol, so the same
    // client serves it, MinIO locally, and AWS S3 if it is ever used again.
    // The variables are named S3_* rather than AWS_* because the provider is no
    // longer AWS.
    S3_REGION: z.string().min(1, 'Storage region is required'),
    S3_ACCESS_KEY_ID: z.string().min(1, 'Storage access key ID is required'),
    S3_SECRET_ACCESS_KEY: z
      .string()
      .min(1, 'Storage secret access key is required'),
    // Uploads are separated by type into their own buckets, matching how the
    // Supabase project is laid out. The assets bucket is not listed here because
    // the application never writes to it, it only serves the brand banner.
    S3_BUCKET_IMAGES: z.string().min(1, 'Images bucket name is required'),
    S3_BUCKET_PDFS: z.string().min(1, 'PDFs bucket name is required'),
    // S3 API endpoint. Supabase exposes this at
    // https://<project-ref>.storage.supabase.co/storage/v1/s3
    S3_ENDPOINT: z.string().url('Storage endpoint must be a valid URL'),
    // Base the public URL of an object is built from, with the bucket and key
    // appended. Supabase serves public objects from a different host to its S3
    // endpoint, so this cannot be derived from S3_ENDPOINT.
    S3_PUBLIC_URL: z.string().url('Storage public URL must be a valid URL'),
    DEV_TOKEN: z.string().optional(), // Optional token for development mode

    // Outbound email, moved in from the notification service.
    SMTP_HOST: z.string().min(1, 'SMTP host is required'),
    SMTP_PORT: z.coerce.number().default(587),
    SMTP_USER: z.string().min(1, 'SMTP user is required'),
    SMTP_PASSWORD: z.string().min(1, 'SMTP password is required'),
    EMAIL_FROM: z.string().min(1, 'Sender address is required'),

    // Public site and asset URLs used by the email templates. These are config
    // rather than literals so copy changes do not require a code deploy.
    SITE_URL: z.string().url().default('https://studzee.in'),
    EMAIL_BANNER_URL: z
      .string()
      .url()
      .default(
        'https://lammfakgegmrkxdkwukd.supabase.co/storage/v1/object/public/assets/studzee_banner.png'
      ),

    // Hosts an email attachment may be fetched from, comma separated. Anything
    // else is rejected, so an admin cannot make the mailer pull an arbitrary URL.
    EMAIL_ATTACHMENT_HOSTS: z
      .string()
      .default('lammfakgegmrkxdkwukd.supabase.co'),

    // Render keepalive ping. Optional, the job is skipped when unset.
    HEALTHCHECK_URL: z.string().url().optional(),

    // --- AI layer ---
    // Everything below is inert until AI_ENABLED is true. That default keeps CI,
    // the test suite and any already deployed environment working unchanged
    // until a key is actually provisioned, and it is the single switch that
    // turns off generation, the support agent and the nightly drafting job.
    AI_ENABLED: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
    // NVIDIA build speaks the OpenAI chat completions and embeddings protocol,
    // so any other OpenAI compatible host works by changing this one value.
    AI_BASE_URL: z
      .string()
      .url()
      .default('https://integrate.api.nvidia.com/v1'),
    AI_API_KEY: z.string().optional(),
    AI_MODEL: z.string().default('nvidia/nemotron-3-ultra-550b-a55b'),
    AI_EMBED_MODEL: z.string().default('nvidia/nemotron-3-embed-1b'),
    // Must equal the vector(n) dimension in the KbChunk migration. They are
    // checked against each other at reindex time rather than trusted, because a
    // mismatch otherwise surfaces as an opaque Postgres error per query.
    AI_EMBED_DIM: z.coerce.number().int().positive().default(2048),
    // Generating a whole study document is several model calls deep and
    // returns thousands of tokens, so both of these are sized for that
    // rather than for a support answer.
    AI_TIMEOUT_MS: z.coerce.number().int().positive().default(120_000),
    AI_MAX_TOKENS: z.coerce.number().int().positive().default(8192),
    // Support questions per user per UTC day. A 550B model answering free text
    // needs a ceiling that is not the HTTP rate limiter, which resets in a
    // minute and is per IP rather than per account.
    AI_SUPPORT_DAILY_LIMIT: z.coerce.number().int().positive().default(30),
  })
  .superRefine((data, ctx) => {
    // Enabling the layer without a key would fail on the first model call
    // instead of at boot, which is the opposite of how every other required
    // credential in this file behaves.
    if (data.AI_ENABLED && !data.AI_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['AI_API_KEY'],
        message: 'AI_API_KEY is required when AI_ENABLED is true',
      })
    }
  })

const parsedConfig = configSchema.safeParse(process.env)

if (!parsedConfig.success) {
  console.error(
    'ERROR: Invalid environment variables:',
    parsedConfig.error.flatten().fieldErrors
  )
  throw new Error('Invalid environment variables')
}

export const config = parsedConfig.data

// Re-export all configuration modules from single entry point
export { connectDB, disconnectDB } from './mongo'
export { connectPostgres, disconnectPostgres, prisma } from './postgres'
export { connectRedis, disconnectRedis, redisClient } from './redis'
export {
  s3Client,
  uploadToS3,
  deleteFromS3,
  getObjectRef,
  getPublicUrl,
} from './s3'
export type { ObjectRef } from './s3'
