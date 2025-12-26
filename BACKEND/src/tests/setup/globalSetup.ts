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
process.env.MONGODB_URI =
  process.env.MONGODB_URI_TEST ||
  process.env.MONGODB_URI ||
  'mongodb://localhost:27017/studzee-test'
process.env.REDIS_URL =
  process.env.REDIS_URL_TEST ||
  process.env.REDIS_URL ||
  'redis://localhost:6379/1'

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
