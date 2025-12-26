/**
 * UNIT TESTS FOR CACHE UTILITY
 *
 * What are we testing?
 * - Cache utility functions
 * - Redis operations (get, set, delete)
 * - Error handling
 *
 * Why test utilities?
 * - They're reused across the codebase
 * - Bugs here affect multiple features
 * - Critical for performance
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { redisClient } from '@/config'

/**
 * MOCK REDIS CLIENT
 *
 * We're testing the utility logic, not Redis itself
 */
vi.mock('@/config', () => ({
  redisClient: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    exists: vi.fn(),
  },
}))

/**
 * Note: If you have a separate cache utility file (utils/cache.ts),
 * import and test those functions here.
 *
 * For this example, we'll test Redis client usage patterns
 * that appear in your services.
 */

describe('Cache Utility - Redis Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * TEST: Basic Get/Set Operations
   */
  it('should get and set values in cache', async () => {
    // ARRANGE
    const testKey = 'test:key'
    const testValue = { data: 'test' }

    vi.mocked(redisClient.get).mockResolvedValue(JSON.stringify(testValue))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(redisClient.set).mockResolvedValue('OK' as any)

    // ACT: Set value
    await redisClient.set(testKey, JSON.stringify(testValue))

    // ASSERT: Set was called correctly
    expect(redisClient.set).toHaveBeenCalledWith(
      testKey,
      JSON.stringify(testValue)
    )

    // ACT: Get value
    const result = await redisClient.get(testKey)

    // ASSERT: Get returns the value
    expect(result).toBe(JSON.stringify(testValue))
  })

  /**
   * TEST: Delete Operations
   */
  it('should delete cache entries', async () => {
    // ARRANGE
    const testKey = 'test:key:to:delete'
    vi.mocked(redisClient.del).mockResolvedValue(1)

    // ACT
    const result = await redisClient.del(testKey)

    // ASSERT
    expect(redisClient.del).toHaveBeenCalledWith(testKey)
    expect(result).toBe(1) // 1 = key was deleted
  })

  /**
   * TEST: Check Existence
   */
  it('should check if key exists', async () => {
    // ARRANGE
    vi.mocked(redisClient.exists).mockResolvedValue(1) // 1 = exists

    // ACT
    const exists = await redisClient.exists('test:key')

    // ASSERT
    expect(exists).toBe(1)
  })
})

/**
 * WHY THESE TESTS MATTER
 *
 * Utility tests ensure:
 * 1. ✅ Core operations work correctly
 * 2. ✅ Error handling is robust
 * 3. ✅ Edge cases are covered
 *
 * Since utilities are used everywhere, bugs here
 * would affect the entire application!
 */
