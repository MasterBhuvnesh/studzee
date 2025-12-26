/**
 * DATABASE MOCK UTILITIES
 *
 * These are reusable mock objects for MongoDB and Redis.
 *
 * What is this for?
 * - Unit tests and mocked tests need fake databases
 * - Instead of writing mocks in every test, we create them once here
 * - Import and use these in your tests
 *
 * Think of it like:
 * - Real Database = Expensive actor
 * - Mock Database = Stunt double (cheap, safe, predictable)
 */

import { vi } from 'vitest'

/**
 * MONGOOSE MODEL MOCK
 *
 * Mocks the Mongoose model chain: find().sort().skip().limit().lean()
 *
 * Why is it a chain?
 * Your code does:
 *   DocumentModel.find({})
 *     .sort({ createdAt: -1 })
 *     .skip(20)
 *     .limit(10)
 *     .lean()
 *
 * Each method returns an object with the next method.
 * This mock mimics that behavior.
 */
export const createMockMongooseModel = () => ({
  // Query methods
  find: vi.fn().mockReturnThis(),
  findById: vi.fn().mockReturnThis(),
  findOne: vi.fn().mockReturnThis(),

  // Aggregation and counting
  countDocuments: vi.fn(),
  aggregate: vi.fn(),

  // Query modifiers (these return 'this' to allow chaining)
  skip: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  sort: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  lean: vi.fn().mockReturnThis(),
  populate: vi.fn().mockReturnThis(),

  // Execution
  exec: vi.fn(),

  // Document creation
  create: vi.fn(),
  insertMany: vi.fn(),

  // Document modification
  updateOne: vi.fn(),
  updateMany: vi.fn(),
  findByIdAndUpdate: vi.fn(),

  // Document deletion
  deleteOne: vi.fn(),
  deleteMany: vi.fn(),
  findByIdAndDelete: vi.fn(),
})

/**
 * REDIS CLIENT MOCK
 *
 * Mocks the Redis client methods
 *
 * What does Redis do?
 * - Stores key-value pairs in memory (super fast cache)
 * - get(key) - Retrieve value
 * - set(key, value) - Store value
 * - del(key) - Delete value
 *
 * Why mock it?
 * - Don't need real Redis running for unit tests
 * - Faster tests (no network calls)
 * - Predictable behavior
 */
export const createMockRedisClient = () => ({
  // Basic operations
  get: vi.fn(), // Retrieves cached data
  set: vi.fn(), // Stores data in cache
  del: vi.fn(), // Deletes cached data

  // Utility operations
  exists: vi.fn(), // Check if key exists
  expire: vi.fn(), // Set expiration time
  ttl: vi.fn(), // Get time-to-live

  // Bulk operations
  mget: vi.fn(), // Get multiple keys
  mset: vi.fn(), // Set multiple keys
  keys: vi.fn(), // Find keys by pattern

  // Cleanup
  flushAll: vi.fn(), // Clear entire cache
  flushDb: vi.fn(), // Clear current database

  // Connection
  connect: vi.fn(), // Connect to Redis
  disconnect: vi.fn(), // Disconnect from Redis
  quit: vi.fn(), // Close connection gracefully
})

/**
 * HELPER: Create Mock Mongoose Chain
 *
 * Creates a complete mock chain for Mongoose queries
 *
 * Example usage:
 * ```typescript
 * const mockChain = createMockMongooseChain([{ id: '1', title: 'Test' }])
 * DocumentModel.find = vi.fn().mockReturnValue(mockChain)
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createMockMongooseChain = (data: any) => ({
  sort: vi.fn().mockReturnThis(),
  skip: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  lean: vi.fn().mockResolvedValue(data), // This returns the actual data
  exec: vi.fn().mockResolvedValue(data),
})
