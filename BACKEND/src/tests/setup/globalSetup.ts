/**
 * GLOBAL TEST SETUP
 *
 * This file runs ONCE before ALL tests in the entire test suite.
 *
 * What does this do?
 * - Sets environment variables for testing
 * - Mocks the logger to keep test output clean
 *
 * Why mock the logger?
 * - Without mocking: Tests print lots of log messages
 * - With mocking: Tests only show test results
 * - Logs still work in actual code, just silent in tests
 */

import { vi } from 'vitest'

/**
 * ENVIRONMENT VARIABLES
 * These override .env file during tests
 */
process.env.NODE_ENV = 'test'

// Use test databases (if you have them)
// If these env vars aren't set, falls back to regular databases
// The compose Mongo runs with authentication enabled, so a URI without
// credentials connects but fails on the first query with "requires
// authentication". The defaults mirror the ones docker-compose.yml falls back
// to, so the suite works against the local stack with nothing configured.
const mongoUser = process.env.MONGO_ROOT_USER || 'root'
const mongoPassword = process.env.MONGO_ROOT_PASSWORD || 'password'

process.env.MONGO_URI =
  process.env.MONGO_URI_TEST ||
  process.env.MONGO_URI ||
  `mongodb://${mongoUser}:${mongoPassword}@localhost:27017/Studzee_Database_Test?authSource=admin`
process.env.DB_NAME = 'Studzee_Database_Test'
process.env.REDIS_URL =
  process.env.REDIS_URL_TEST ||
  process.env.REDIS_URL ||
  'redis://localhost:6379/1'

/**
 * The config schema validates at import time and throws on anything missing,
 * so every required variable needs a value here. These defaults let the suite
 * run on a checkout with no .env at all. A real .env still wins where set.
 */
const testDefaults: Record<string, string> = {
  CLERK_SECRET_KEY: 'sk_test_placeholder',
  // Clerk decodes the publishable key to find its API host and throws
  // "Publishable key not valid" on anything malformed. That throw reaches the
  // error handler as a 500, so an unauthenticated request looks like a server
  // fault instead of a 401. This is a structurally valid test key: the base64
  // of a dummy Clerk domain. It authenticates nobody, which is the point.
  CLERK_PUBLISHABLE_KEY: 'pk_test_ZXhhbXBsZS5jbGVyay5hY2NvdW50cy5kZXYk',
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/studzee_test',
  S3_REGION: 'ap-northeast-2',
  S3_ACCESS_KEY_ID: 'test-access-key',
  S3_SECRET_ACCESS_KEY: 'test-secret-key',
  S3_BUCKET_IMAGES: 'images',
  S3_BUCKET_PDFS: 'pdfs',
  S3_ENDPOINT: 'http://localhost:9000',
  S3_PUBLIC_URL: 'http://localhost:9000',
  // Pinned so the attachment allowlist tests do not depend on the schema default.
  EMAIL_ATTACHMENT_HOSTS: 'lammfakgegmrkxdkwukd.supabase.co',
  SMTP_HOST: 'smtp.test.local',
  SMTP_PORT: '587',
  SMTP_USER: 'test-user',
  SMTP_PASSWORD: 'test-password',
  EMAIL_FROM: 'Studzee <no-reply@studzee.in>',
  // The AI layer is off by default, which would make every generation and
  // support call throw AI_DISABLED before reaching the logic under test. It is
  // switched on here with a placeholder key; no test ever reaches a real
  // endpoint, because fetch and the client module are always mocked.
  AI_ENABLED: 'true',
  AI_API_KEY: 'test-ai-key',
}

for (const [key, value] of Object.entries(testDefaults)) {
  process.env[key] = process.env[key] || value
}

/**
 * MOCK THE LOGGER
 *
 * What is mocking?
 * - Replace a real function with a fake one
 * - The fake function does nothing (or what we tell it)
 *
 * Why mock the logger?
 * - Tests run faster (no file I/O)
 * - Test output is cleaner (no log spam)
 * - We can verify logs were called if needed
 */
vi.mock('@/utils/logger', () => ({
  default: {
    info: vi.fn(), // Fake info() that does nothing
    error: vi.fn(), // Fake error() that does nothing
    warn: vi.fn(), // Fake warn() that does nothing
    debug: vi.fn(), // Fake debug() that does nothing
  },
}))

console.log('[TEST]: Global test setup complete')
