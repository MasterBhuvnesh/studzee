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
  CLOUDINARY_CLOUD_NAME: z.string().min(1, 'Cloudinary cloud name is required'),
  CLOUDINARY_API_KEY: z.string().min(1, 'Cloudinary API key is required'),
  CLOUDINARY_API_SECRET: z.string().min(1, 'Cloudinary API secret is required'),
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
