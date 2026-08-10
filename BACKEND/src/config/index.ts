import dotenv from 'dotenv'
import { z } from 'zod'

// Load .env file
dotenv.config()

const configSchema = z.object({
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
  AWS_REGION: z.string().min(1, 'AWS region is required'),
  AWS_ACCESS_KEY_ID: z.string().min(1, 'AWS access key ID is required'),
  AWS_SECRET_ACCESS_KEY: z.string().min(1, 'AWS secret access key is required'),
  AWS_S3_BUCKET_NAME: z.string().min(1, 'AWS S3 bucket name is required'),
  AWS_S3_BUCKET_ENDPOINT: z.string().optional(),
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
      'https://studzee-assets.s3.ap-south-1.amazonaws.com/assets/studzee_banner.png'
    ),

  // Hosts an email attachment may be fetched from, comma separated. Anything
  // else is rejected, so an admin cannot make the mailer pull an arbitrary URL.
  EMAIL_ATTACHMENT_HOSTS: z
    .string()
    .default('studzee-assets.s3.ap-south-1.amazonaws.com'),

  // Render keepalive ping. Optional, the job is skipped when unset.
  HEALTHCHECK_URL: z.string().url().optional(),
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
export { s3Client, uploadToS3, deleteFromS3, getKeyFromUrl } from './s3'
