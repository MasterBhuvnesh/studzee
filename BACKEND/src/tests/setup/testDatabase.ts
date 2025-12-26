/**
 * TEST DATABASE HELPERS
 *
 * These functions help integration tests connect to real databases.
 *
 * Why do we need this?
 * - Integration tests need REAL MongoDB and Redis
 * - Every test file would duplicate this setup code
 * - This file provides reusable setup/teardown functions
 *
 * How to use:
 * - Call setupTestDatabases() in beforeAll()
 * - Call teardownTestDatabases() in afterAll()
 */

import {
  connectDB,
  disconnectDB,
  connectRedis,
  disconnectRedis,
} from '@/config'
import logger from '@/utils/logger'

/**
 * Setup Test Databases
 *
 * Connects to MongoDB and Redis before tests run
 *
 * When to use: In beforeAll() hook of integration tests
 */
export const setupTestDatabases = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    await connectDB()

    // Connect to Redis
    await connectRedis()

    logger.info('[TEST DATABASES ]:Test databases connected')
  } catch (error) {
    logger.error(error, '[TEST DATABASES ]:Failed to connect test databases')
    throw error // Re-throw so tests don't run without database
  }
}

/**
 * Teardown Test Databases
 *
 * Disconnects from MongoDB and Redis after tests complete
 *
 * Why is this important?
 * - Prevents memory leaks
 * - Allows tests to exit cleanly
 * - Good practice to clean up resources
 *
 * When to use: In afterAll() hook of integration tests
 */
export const teardownTestDatabases = async (): Promise<void> => {
  try {
    // Disconnect from MongoDB
    await disconnectDB()

    // Disconnect from Redis
    await disconnectRedis()

    logger.info('[TEST DATABASES ]:Test databases disconnected')
  } catch (error) {
    logger.error(error, '[TEST DATABASES ]:Failed to disconnect test databases')
    // Don't throw here - we're cleaning up anyway
  }
}
