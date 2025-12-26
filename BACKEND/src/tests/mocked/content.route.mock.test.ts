/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * MOCKED INTEGRATION TESTS FOR /content ROUTES
 *
 * What are we testing?
 * - Same as integration tests: HTTP → Route → Controller → Service → Database
 * - BUT with MOCKED dependencies (fake MongoDB, fake Redis)
 *
 * Why mocked integration tests?
 * - Faster than real integration tests (no database connections)
 * - Don't need real databases running (great for CI/CD)
 * - Still test the complete flow (unlike unit tests)
 * - Predictable (we control all the data)
 *
 * When to use?
 * - CI/CD pipelines (GitHub Actions, etc.)
 * - Quick feedback during development
 * - When you don't have test databases set up
 *
 * Comparison:
 * - Unit tests: Test ONE function, mock everything
 * - Mocked integration: Test FULL flow, mock dependencies
 * - Integration tests: Test FULL flow, REAL dependencies
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import contentRoutes from '@/api/routes/content.route'
import { DocumentModel } from '@/models/document.model'
import { redisClient } from '@/config'

/**
 * MOCK ALL EXTERNAL DEPENDENCIES
 *
 * What are we mocking?
 * - MongoDB (DocumentModel)
 * - Redis (redisClient)
 * - Config (database connection functions)
 *
 * Why?
 * - No real databases needed
 * - Tests run instantly
 * - We control exactly what data is "returned"
 */

// Mock the entire database model
vi.mock('@/models/document.model')

// Mock config and Redis
vi.mock('@/config', () => ({
  // Mock database connection functions (do nothing)
  connectDB: vi.fn(),
  disconnectDB: vi.fn(),
  connectRedis: vi.fn(),
  disconnectRedis: vi.fn(),

  // Mock Redis client methods
  redisClient: {
    get: vi.fn().mockResolvedValue(null), // Default: cache miss
    set: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
  },

  // Mock config values
  config: {
    LIST_CACHE_TTL: 300,
    DOC_CACHE_TTL: 600,
    TODAY_CACHE_TTL: 900,
  },
}))

/**
 * SET UP EXPRESS APP FOR TESTING
 *
 * We create a minimal Express app with just the routes we're testing.
 * This is NOT the full app (no middleware, no other routes).
 */
const app = express()
app.use(express.json()) // Parse JSON request bodies
app.use('/content', contentRoutes) // Mount content routes at /content

// Add error handler middleware to properly handle Zod validation errors
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: any, res: any, _next: any) => {
  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation error',
      details: err.errors,
    })
  }
  // Handle other errors
  res.status(500).json({ error: 'Internal server error' })
})

/**
 * TEST SUITE: GET /content - Paginated List (Mocked)
 *
 * Same tests as integration, but with fake data
 */
describe('GET /content - Mocked Database', () => {
  /**
   * beforeEach: Reset mocks before each test
   *
   * Why?
   * - Each test should start fresh
   * - Previous test's mock data shouldn't leak
   */
  beforeEach(() => {
    vi.clearAllMocks()

    // Reset Redis to cache miss by default
    vi.mocked(redisClient.get).mockResolvedValue(null)
  })

  /**
   * TEST CASE 1: Happy Path with Mocked Data
   *
   * Scenario: Request documents
   * Expected: Return mocked documents (no real database!)
   *
   * How it works:
   * 1. Mock DocumentModel.find() to return fake data
   * 2. Make HTTP request
   * 3. Verify fake data is returned correctly
   */
  it('should return paginated documents without real database', async () => {
    // ARRANGE: Create fake documents
    const fakeDocuments = [
      {
        _id: 'mock-id-1',
        title: 'Mocked Document 1',
        summary: 'This is fake data from mock',
        createdAt: new Date('2024-01-01'),
      },
      {
        _id: 'mock-id-2',
        title: 'Mocked Document 2',
        summary: 'Also fake!',
        createdAt: new Date('2024-01-02'),
      },
    ]

    /**
     * THE MOCKING CHAIN
     *
     * Remember: DocumentModel.find().sort().skip().limit().lean()
     * We need to mock this entire chain!
     */
    const mockLean = vi.fn().mockResolvedValue(fakeDocuments)
    const mockLimit = vi.fn().mockReturnValue({ lean: mockLean })
    const mockSkip = vi.fn().mockReturnValue({ limit: mockLimit })
    const mockSort = vi.fn().mockReturnValue({ skip: mockSkip })
    const mockFind = vi.fn().mockReturnValue({ sort: mockSort })

    // Tell DocumentModel.find to use our mocked chain
    vi.mocked(DocumentModel.find).mockImplementation(mockFind as any)

    // Mock countDocuments to return fake total
    vi.mocked(DocumentModel.countDocuments).mockResolvedValue(2)

    // ACT: Make HTTP request (no real DB needed!)
    const response = await request(app).get('/content')

    // ASSERT: Check status
    expect(response.status).toBe(200)

    // ASSERT: Check data
    expect(response.body.data).toHaveLength(2)
    expect(response.body.data[0].title).toBe('Mocked Document 1')

    // ASSERT: Check pagination
    expect(response.body.meta).toMatchObject({
      page: 1,
      limit: 20,
      total: 2,
    })

    // ASSERT: Verify mocks were called
    expect(DocumentModel.find).toHaveBeenCalled()
    expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 })
    expect(mockSkip).toHaveBeenCalledWith(0) // Page 1 → skip 0
    expect(mockLimit).toHaveBeenCalledWith(20) // Default limit
  })

  /**
   * TEST CASE 2: Custom Pagination with Mocked Data
   */
  it('should respect custom page and limit with mocked data', async () => {
    // ARRANGE
    const fakeDocuments = [
      { _id: '1', title: 'Doc 1', summary: 'Test', createdAt: new Date() },
    ]

    const mockLean = vi.fn().mockResolvedValue(fakeDocuments)
    const mockLimit = vi.fn().mockReturnValue({ lean: mockLean })
    const mockSkip = vi.fn().mockReturnValue({ limit: mockLimit })
    const mockSort = vi.fn().mockReturnValue({ skip: mockSkip })
    const mockFind = vi.fn().mockReturnValue({ sort: mockSort })

    vi.mocked(DocumentModel.find).mockImplementation(mockFind as any)
    vi.mocked(DocumentModel.countDocuments).mockResolvedValue(1)

    // ACT: Request page 3, limit 5
    const response = await request(app)
      .get('/content')
      .query({ page: 3, limit: 5 })

    // ASSERT
    expect(response.status).toBe(200)
    expect(response.body.meta.page).toBe(3)
    expect(response.body.meta.limit).toBe(5)

    // ASSERT: Skip calculation for page 3 → (3-1) * 5 = 10
    expect(mockSkip).toHaveBeenCalledWith(10)
  })

  /**
   * TEST CASE 3: Mocked Cache Hit
   *
   * Scenario: Redis has cached data
   * Expected: Return cached data, skip database entirely
   *
   * This tests that caching logic works correctly!
   */
  it('should use cached data when available', async () => {
    // ARRANGE: Mock Redis to return cached data
    // Note: Dates must be ISO strings because Redis stores JSON, not Date objects
    const cachedData = {
      data: [
        {
          id: 'cached-1',
          title: 'Cached Doc',
          summary: 'From Redis',
          createdAt: new Date().toISOString(),
        },
      ],
      meta: { page: 1, limit: 20, total: 1 },
    }

    vi.mocked(redisClient.get).mockResolvedValue(JSON.stringify(cachedData))

    // ACT: Make request
    const response = await request(app).get('/content')

    // ASSERT: Got cached data
    expect(response.status).toBe(200)
    expect(response.body).toEqual(cachedData)

    // ASSERT: Database was NOT called (used cache!)
    expect(DocumentModel.find).not.toHaveBeenCalled()

    // ASSERT: Redis get was called
    expect(redisClient.get).toHaveBeenCalledWith('content:list:page:1:limit:20')
  })

  /**
   * TEST CASE 4: Invalid Input (Validation Still Works!)
   *
   * Even with mocked database, validation should work
   */
  it('should still validate input with mocked dependencies', async () => {
    // ACT: Request with invalid page
    const response = await request(app).get('/content').query({ page: -1 })

    // ASSERT: Validation error (before even touching database)
    expect(response.status).toBeGreaterThanOrEqual(400)
    expect(response.status).toBeLessThan(500)

    // ASSERT: Database was never called
    expect(DocumentModel.find).not.toHaveBeenCalled()
  })

  /**
   * TEST CASE 5: Empty Results
   */
  it('should handle empty results gracefully', async () => {
    // ARRANGE: Mock empty database
    const mockLean = vi.fn().mockResolvedValue([]) // No documents
    const mockLimit = vi.fn().mockReturnValue({ lean: mockLean })
    const mockSkip = vi.fn().mockReturnValue({ limit: mockLimit })
    const mockSort = vi.fn().mockReturnValue({ skip: mockSkip })
    const mockFind = vi.fn().mockReturnValue({ sort: mockSort })

    vi.mocked(DocumentModel.find).mockImplementation(mockFind as any)
    vi.mocked(DocumentModel.countDocuments).mockResolvedValue(0)

    // ACT
    const response = await request(app).get('/content')

    // ASSERT: Should still return 200 (not error)
    expect(response.status).toBe(200)
    expect(response.body.data).toEqual([])
    expect(response.body.meta.total).toBe(0)
  })
})

/**
 * WHY MOCKED INTEGRATION TESTS MATTER
 *
 * Benefits:
 * 1. ✅ Fast - No database connections (run in milliseconds)
 * 2. ✅ Reliable - No external dependencies to fail
 * 3. ✅ Portable - Run anywhere (CI/CD, laptops, etc.)
 * 4. ✅ Predictable - We control all the data
 * 5. ✅ Complete - Still tests full HTTP flow
 *
 * When to use each test type:
 *
 * Unit Tests:
 * - Test individual functions
 * - Mock everything
 * - Use during development
 *
 * Mocked Integration Tests:
 * - Test complete flow
 * - Mock dependencies
 * - Use in CI/CD pipelines
 *
 * Integration Tests:
 * - Test complete flow
 * - Real dependencies
 * - Use before deployment
 *
 * Together, these three levels give you complete confidence!
 */
