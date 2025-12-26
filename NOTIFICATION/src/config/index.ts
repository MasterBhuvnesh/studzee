import { z } from 'zod';

const configSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.preprocess((val) => parseInt(val as string, 10), z.number().default(3000)),
  DATABASE_URL: z.string().url(),
  CLERK_SECRET_KEY: z.string(),
  CLERK_PUBLISHABLE_KEY: z.string(),
  DEV_TOKEN: z.string().optional(),
  SMTP_HOST: z.string(),
  SMTP_PORT: z.preprocess((val) => parseInt(val as string, 10), z.number()),
  SMTP_USER: z.string(),
  SMTP_PASSWORD: z.string(),
  EMAIL_FROM: z.string(),
  HEALTHCHECK_URL: z.string().url(),
});

const parsedConfig = configSchema.safeParse(process.env);

if (!parsedConfig.success) {
  console.error(
    '❌ Invalid environment variables:',
    JSON.stringify(parsedConfig.error.format(), null, 4),
  );
  process.exit(1);
}

export const config = parsedConfig.data;
