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
  MONGO_URI: z.string().url(),
  REDIS_URL: z.string().url(),
  LIST_CACHE_TTL: z.coerce.number().default(300),
  DOC_CACHE_TTL: z.coerce.number().default(86400),
  JOB_CRON: z.string().default('0 0 * * *'),
  LOG_LEVEL: z.string().default('info'),
  AWS_REGION: z.string().min(1, 'AWS region is required'),
  AWS_ACCESS_KEY_ID: z.string().min(1, 'AWS access key ID is required'),
  AWS_SECRET_ACCESS_KEY: z.string().min(1, 'AWS secret access key is required'),
  AWS_S3_BUCKET_NAME: z.string().min(1, 'AWS S3 bucket name is required'),
  DEV_TOKEN: z.string().optional(), // Optional token for development mode
})

const parsedConfig = configSchema.safeParse(process.env)

if (!parsedConfig.success) {
  console.error(
    '❌ Invalid environment variables:',
    parsedConfig.error.flatten().fieldErrors
  )
  throw new Error('Invalid environment variables')
}

export const config = parsedConfig.data
