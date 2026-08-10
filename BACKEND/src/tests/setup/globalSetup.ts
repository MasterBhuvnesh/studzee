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
process.env.MONGO_URI =
  process.env.MONGO_URI_TEST ||
  process.env.MONGO_URI ||
  'mongodb://localhost:27017/Studzee_Database_Test'
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
  CLERK_PUBLISHABLE_KEY: 'pk_test_placeholder',
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/studzee_test',
  AWS_REGION: 'ap-south-1',
  AWS_ACCESS_KEY_ID: 'test-access-key',
  AWS_SECRET_ACCESS_KEY: 'test-secret-key',
  AWS_S3_BUCKET_NAME: 'studzee-assets',
  SMTP_HOST: 'smtp.test.local',
  SMTP_PORT: '587',
  SMTP_USER: 'test-user',
  SMTP_PASSWORD: 'test-password',
  EMAIL_FROM: 'Studzee <no-reply@studzee.in>',
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
