/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * UNIT TESTS FOR CONTENT SERVICE
 *
 * What are we testing?
 * - ONLY the contentService functions
 * - NOT the database (we mock it)
 * - NOT the HTTP layer (that's integration tests)
 *
 * Why unit tests?
 * - Fast (no database connections)
 * - Isolated (test one function at a time)
 * - Reliable (no external dependencies)
 *
 * What is mocking?
 * - Replace real dependencies (MongoDB, Redis) with fake versions
 * - We control exactly what the fake versions return
 * - This lets us test the service logic in isolation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as contentService from '@/services/content.service'
import { DocumentModel } from '@/models/document.model'
import { redisClient } from '@/config'

/**
 * MOCK SETUP
 *
 * vi.mock() tells Vitest: "Don't use the real module, use a fake one"
 *
 * Why?
 * - We don't want to connect to real MongoDB
 * - We don't want to connect to real Redis
 * - We want tests to run fast and predictably
 */
vi.mock('@/models/document.model')
vi.mock('@/config', () => ({
  // Mock redisClient with fake methods
  redisClient: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  },
  // Mock config with fake values
  config: {
    LIST_CACHE_TTL: 300,
    DOC_CACHE_TTL: 600,
    TODAY_CACHE_TTL: 900,
  },
}))

/**
 * TEST SUITE: listContent() Function
 *
 * This function fetches paginated documents with caching.
 * We'll test different scenarios:
 * 1. Cache hit (data exists in Redis)
 * 2. Cache miss (need to query MongoDB)
 * 3. Pagination logic
 * 4. Error handling
 */
describe('ContentService - listContent', () => {
  /**
   * beforeEach: Runs before EACH test
   *
   * Why clear mocks?
   * - Each test should start fresh
   * - Previous test's mock calls shouldn't affect next test
   */
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * TEST CASE 1: Cache Hit
   *
   * Scenario: Redis has the data
   * Expected: Return cached data WITHOUT querying MongoDB
   *
   * AAA Pattern:
   * - Arrange: Set up mocks
   * - Act: Call the function
   * - Assert: Check results
   */
  it('should return cached data when cache hit occurs', async () => {
    // ARRANGE: Set up fake cached data
    // Note: Dates will be strings after JSON.stringify/parse (Redis stores JSON as strings)
    const testDate = new Date().toISOString()
    const fakeCachedData = {
      data: [
        {
          _id: '1',
          id: '1',
          title: 'Cached Doc 1',
          summary: 'Summary 1',
          createdAt: testDate,
        },
        {
          _id: '2',
          id: '2',
          title: 'Cached Doc 2',
          summary: 'Summary 2',
          createdAt: testDate,
        },
      ],
      meta: { page: 1, limit: 20, total: 2 },
    }

    // Tell the mock: "When redisClient.get() is called, return this fake data"
    vi.mocked(redisClient.get).mockResolvedValue(JSON.stringify(fakeCachedData))

    // ACT: Call the actual service function
    const result = await contentService.listContent(1, 20)

    // ASSERT: Check that we got the cached data
    // After JSON round-trip (stringify/parse), dates are strings
    expect(result).toEqual(fakeCachedData)

    // ASSERT: Redis get() was called with correct key
    expect(redisClient.get).toHaveBeenCalledWith('content:list:page:1:limit:20')

    // ASSERT: MongoDB was NOT called (because we had cache)
    expect(DocumentModel.find).not.toHaveBeenCalled()

    // ASSERT: Redis set() was NOT called (we didn't need to cache anything)
    expect(redisClient.set).not.toHaveBeenCalled()
  })

  /**
   * TEST CASE 2: Cache Miss
   *
   * Scenario: Redis does NOT have the data
   * Expected: Query MongoDB and cache the result
   *
   * The Mocking Chain Explained:
   *
   * Your service does:
   *   DocumentModel.find({})
   *     .sort({ createdAt: -1 })
   *     .skip(0)
   *     .limit(20)
   *     .lean()
   *
   * Each method returns an object with the next method.
   * We need to mock this entire chain!
   */
  it('should fetch from database and cache on cache miss', async () => {
    // ARRANGE: Mock cache miss (Redis returns null)
    vi.mocked(redisClient.get).mockResolvedValue(null)

    // Create fake documents from "database"
    const fakeDocsFromDB = [
      {
        _id: '1',
        title: 'DB Doc 1',
        summary: 'Summary 1',
        createdAt: new Date(),
      },
      {
        _id: '2',
        title: 'DB Doc 2',
        summary: 'Summary 2',
        createdAt: new Date(),
      },
    ]

    /**
     * THE MOCKING CHAIN
     *
     * Why so complex? Because Mongoose chains methods:
     * 1. find() returns object with .sort()
     * 2. sort() returns object with .skip()
     * 3. skip() returns object with .limit()
     * 4. limit() returns object with .lean()
     * 5. lean() returns the actual data
     *
     * We create this chain backwards!
     */
    const mockLean = vi.fn().mockResolvedValue(fakeDocsFromDB) // Step 5: Return data
    const mockLimit = vi.fn().mockReturnValue({ lean: mockLean }) // Step 4: Return { lean: fn }
    const mockSkip = vi.fn().mockReturnValue({ limit: mockLimit }) // Step 3: Return { limit: fn }
    const mockSort = vi.fn().mockReturnValue({ skip: mockSkip }) // Step 2: Return { skip: fn }
    const mockFind = vi.fn().mockReturnValue({ sort: mockSort }) // Step 1: Return { sort: fn }

    // Tell DocumentModel.find to use our mocked chain
    vi.mocked(DocumentModel.find).mockImplementation(mockFind as any)

    // Mock countDocuments to return total count
    vi.mocked(DocumentModel.countDocuments).mockResolvedValue(2)

    // Mock Redis set to succeed
    vi.mocked(redisClient.set).mockResolvedValue('OK' as any)

    // ACT: Call the service function
    const result = await contentService.listContent(1, 20)

    // ASSERT: Result has correct structure
    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('meta')
    expect(result.data).toHaveLength(2)
    expect(result.meta).toEqual({ page: 1, limit: 20, total: 2 })

    // ASSERT: MongoDB was queried
    expect(DocumentModel.find).toHaveBeenCalled()
    expect(DocumentModel.countDocuments).toHaveBeenCalled()

    // ASSERT: Result was cached in Redis
    expect(redisClient.set).toHaveBeenCalledWith(
      'content:list:page:1:limit:20',
      JSON.stringify(result),
      { EX: 300 } // Cache TTL from config
    )
  })

  /**
   * TEST CASE 3: Pagination Math
   *
   * Scenario: Test that skip/limit are calculated correctly
   *
   * Pagination formula:
   * - skip = (page - 1) * limit
   * - Example: page=3, limit=10 → skip = (3-1)*10 = 20
   *
   * Why test this?
   * - Off-by-one errors are common in pagination
   * - This ensures we skip the right number of documents
   */
  it('should calculate skip correctly for different pages', async () => {
    // ARRANGE: Cache miss
    vi.mocked(redisClient.get).mockResolvedValue(null)

    // Create mock chain with spy on skip()
    const mockLean = vi.fn().mockResolvedValue([])
    const mockLimit = vi.fn().mockReturnValue({ lean: mockLean })
    const mockSkip = vi.fn().mockReturnValue({ limit: mockLimit }) // ← This is what we'll check
    const mockSort = vi.fn().mockReturnValue({ skip: mockSkip })
    const mockFind = vi.fn().mockReturnValue({ sort: mockSort })

    vi.mocked(DocumentModel.find).mockImplementation(mockFind as any)
    vi.mocked(DocumentModel.countDocuments).mockResolvedValue(0)
    vi.mocked(redisClient.set).mockResolvedValue('OK' as any)

    // ACT: Request page 3 with limit 10
    await contentService.listContent(3, 10)

    // ASSERT: Skip should be (3-1) * 10 = 20
    expect(mockSkip).toHaveBeenCalledWith(20)

    // ASSERT: Limit should be 10
    expect(mockLimit).toHaveBeenCalledWith(10)
  })

  /**
   * TEST CASE 4: Redis Error Handling
   *
   * Scenario: Redis get() throws an error
   * Expected: Log error but continue (fallback to database)
   *
   * Why is this important?
   * - Redis might be down temporarily
   * - App should still work (just slower)
   * - This is called "graceful degradation"
   */
  it('should handle Redis errors gracefully and fallback to database', async () => {
    // ARRANGE: Redis throws error
    vi.mocked(redisClient.get).mockRejectedValue(
      new Error('Redis connection failed')
    )

    // Mock database to return data
    const fakeDocsFromDB = [
      { _id: '1', title: 'Test', summary: 'Test', createdAt: new Date() },
    ]
    const mockLean = vi.fn().mockResolvedValue(fakeDocsFromDB)
    const mockLimit = vi.fn().mockReturnValue({ lean: mockLean })
    const mockSkip = vi.fn().mockReturnValue({ limit: mockLimit })
    const mockSort = vi.fn().mockReturnValue({ skip: mockSkip })
    const mockFind = vi.fn().mockReturnValue({ sort: mockSort })

    vi.mocked(DocumentModel.find).mockImplementation(mockFind as any)
    vi.mocked(DocumentModel.countDocuments).mockResolvedValue(1)
    vi.mocked(redisClient.set).mockResolvedValue('OK' as any)

    // ACT: Call service (should not throw error)
    const result = await contentService.listContent(1, 20)

    // ASSERT: Still got data from database
    expect(result.data).toHaveLength(1)

    // ASSERT: Database was called (fallback worked)
    expect(DocumentModel.find).toHaveBeenCalled()
  })
})

/**
 * TEST SUITE: getContentById() Function
 *
 * This function fetches a single document by ID with caching.
 */
describe('ContentService - getContentById', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * TEST CASE 1: Cache Hit
   */
  it('should return cached document when available', async () => {
    // ARRANGE
    const fakeDoc = {
      _id: 'abc123',
      title: 'Cached Document',
      summary: 'This came from cache',
      content: 'Full content here',
    }

    vi.mocked(redisClient.get).mockResolvedValue(JSON.stringify(fakeDoc))

    // ACT
    const result = await contentService.getContentById('abc123')

    // ASSERT
    expect(result).toEqual(fakeDoc)
    expect(redisClient.get).toHaveBeenCalledWith('content:doc:abc123')
    expect(DocumentModel.findById).not.toHaveBeenCalled()
  })

  /**
   * TEST CASE 2: Cache Miss - Document Found
   */
  it('should fetch from database and cache when cache miss', async () => {
    // ARRANGE
    vi.mocked(redisClient.get).mockResolvedValue(null)

    const fakeDoc = {
      _id: 'abc123',
      title: 'Document from DB',
      summary: 'Test',
    }

    // Mock findById chain: findById().lean()
    const mockLean = vi.fn().mockResolvedValue(fakeDoc)
    const mockFindById = vi.fn().mockReturnValue({ lean: mockLean })

    vi.mocked(DocumentModel.findById).mockImplementation(mockFindById as any)
    vi.mocked(redisClient.set).mockResolvedValue('OK' as any)

    // ACT
    const result = await contentService.getContentById('abc123')

    // ASSERT
    expect(result).toEqual(fakeDoc)
    expect(DocumentModel.findById).toHaveBeenCalledWith('abc123')
    expect(redisClient.set).toHaveBeenCalledWith(
      'content:doc:abc123',
      JSON.stringify(fakeDoc),
      { EX: 600 }
    )
  })

  /**
   * TEST CASE 3: Document Not Found
   *
   * Scenario: ID doesn't exist in database
   * Expected: Return null
   */
  it('should return null when document not found', async () => {
    // ARRANGE
    vi.mocked(redisClient.get).mockResolvedValue(null)

    const mockLean = vi.fn().mockResolvedValue(null) // ← Database returns null
    const mockFindById = vi.fn().mockReturnValue({ lean: mockLean })

    vi.mocked(DocumentModel.findById).mockImplementation(mockFindById as any)

    // ACT
    const result = await contentService.getContentById('nonexistent-id')

    // ASSERT
    expect(result).toBeNull()

    // ASSERT: Should NOT try to cache null
    expect(redisClient.set).not.toHaveBeenCalled()
  })
})

/**
 * WHY THESE TESTS MATTER
 *
 * Unit tests ensure:
 * 1. ✅ Caching works correctly (cache hit/miss)
 * 2. ✅ Pagination math is correct (no off-by-one errors)
 * 3. ✅ Error handling is graceful (Redis failures don't break app)
 * 4. ✅ Database queries are optimized (only query when needed)
 * 5. ✅ Edge cases are handled (null results, missing data)
 *
 * Together, these give us confidence that our service layer
 * works correctly in isolation, without needing a real database.
 */
