/**
 * UNIT TESTS FOR CONTENT CONTROLLER
 *
 * What are we testing?
 * - ONLY the controller functions (request/response handling)
 * - NOT the service layer (we mock it)
 * - NOT the database (that's tested in service tests)
 *
 * What does a controller do?
 * 1. Receives HTTP request (req)
 * 2. Validates input (query params, body, etc.)
 * 3. Calls service functions
 * 4. Sends HTTP response (res)
 * 5. Handles errors (passes to next middleware)
 *
 * Why test controllers separately?
 * - Ensures request/response handling is correct
 * - Tests validation logic (Zod schemas)
 * - Tests error handling
 * - Faster than integration tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as ContentController from '@/api/controllers/content.controller'
import * as ContentService from '@/services/content.service'
import { Request, Response, NextFunction } from 'express'

/**
 * MOCK THE SERVICE LAYER
 *
 * Why?
 * - We're testing the CONTROLLER logic, not service logic
 * - Service is already tested in service.test.ts
 * - Mocking makes tests fast and isolated
 */
vi.mock('@/services/content.service')

/**
 * TEST SUITE: getPaginatedContent Controller
 *
 * This controller:
 * 1. Validates query params (page, limit)
 * 2. Calls contentService.listContent()
 * 3. Returns JSON response
 * 4. Handles errors
 */
describe('ContentController - getPaginatedContent', () => {
  // Mock Express objects (req, res, next)
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: NextFunction

  /**
   * beforeEach: Set up fresh mocks before each test
   *
   * Why create new mocks each time?
   * - Tests should be independent
   * - Previous test's data shouldn't leak to next test
   */
  beforeEach(() => {
    // Mock Request object
    mockReq = {
      query: {}, // Query params (e.g., ?page=1&limit=20)
      params: {}, // Route params (e.g., /content/:id)
    }

    // Mock Response object
    mockRes = {
      json: vi.fn(), // res.json({ data: [...] })
      status: vi.fn().mockReturnThis(), // res.status(404).json(...)
    }

    // Mock Next function (for error handling)
    mockNext = vi.fn() as unknown as NextFunction

    // Clear all previous mock calls
    vi.clearAllMocks()
  })

  /**
   * TEST CASE 1: Successful Request
   *
   * Scenario: Valid query params, service returns data
   * Expected: Return 200 with data
   *
   * AAA Pattern:
   * - Arrange: Set up mocks
   * - Act: Call controller
   * - Assert: Check response
   */
  it('should return 200 with paginated data on success', async () => {
    // ARRANGE: Set up fake service response
    const fakeServiceResponse = {
      data: [
        {
          id: '1',
          title: 'Document 1',
          summary: 'Summary 1',
          createdAt: new Date(),
        },
        {
          id: '2',
          title: 'Document 2',
          summary: 'Summary 2',
          createdAt: new Date(),
        },
      ],
      meta: { page: 1, limit: 20, total: 2 },
    }

    // Tell the mock: "When service.listContent() is called, return this data"
    vi.mocked(ContentService.listContent).mockResolvedValue(fakeServiceResponse)

    // Set query params
    mockReq.query = { page: '1', limit: '20' }

    // ACT: Call the controller
    await ContentController.getPaginatedContent(
      mockReq as Request,
      mockRes as Response,
      mockNext
    )

    // ASSERT: Service was called with correct params
    expect(ContentService.listContent).toHaveBeenCalledWith(1, 20)

    // ASSERT: Response was sent with correct data
    expect(mockRes.json).toHaveBeenCalledWith(fakeServiceResponse)

    // ASSERT: No errors were passed to next()
    expect(mockNext).not.toHaveBeenCalled()
  })

  /**
   * TEST CASE 2: Default Parameters
   *
   * Scenario: No query params provided
   * Expected: Use defaults (page=1, limit=20)
   *
   * Why test this?
   * - Zod schema defines defaults
   * - Ensures defaults work correctly
   */
  it('should use default values when query params are missing', async () => {
    // ARRANGE
    const fakeServiceResponse = {
      data: [],
      meta: { page: 1, limit: 20, total: 0 },
    }

    vi.mocked(ContentService.listContent).mockResolvedValue(fakeServiceResponse)

    // ACT: No query params (mockReq.query = {})
    await ContentController.getPaginatedContent(
      mockReq as Request,
      mockRes as Response,
      mockNext
    )

    // ASSERT: Service called with defaults (1, 20)
    expect(ContentService.listContent).toHaveBeenCalledWith(1, 20)
  })

  /**
   * TEST CASE 3: Custom Pagination
   *
   * Scenario: User provides custom page and limit
   * Expected: Use the custom values
   */
  it('should respect custom page and limit values', async () => {
    // ARRANGE
    const fakeServiceResponse = {
      data: [],
      meta: { page: 5, limit: 10, total: 0 },
    }

    vi.mocked(ContentService.listContent).mockResolvedValue(fakeServiceResponse)

    mockReq.query = { page: '5', limit: '10' }

    // ACT
    await ContentController.getPaginatedContent(
      mockReq as Request,
      mockRes as Response,
      mockNext
    )

    // ASSERT: Service called with custom values
    expect(ContentService.listContent).toHaveBeenCalledWith(5, 10)
  })

  /**
   * TEST CASE 4: Invalid Page (Negative Number)
   *
   * Scenario: User provides invalid page number
   * Expected: Pass validation error to next()
   *
   * Why test this?
   * - Zod schema should reject page < 1
   * - Error should be handled by error middleware
   */
  it('should reject negative page numbers', async () => {
    // ARRANGE: Invalid page
    mockReq.query = { page: '-1' }

    // ACT
    await ContentController.getPaginatedContent(
      mockReq as Request,
      mockRes as Response,
      mockNext
    )

    // ASSERT: Error was passed to next()
    expect(mockNext).toHaveBeenCalled()
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error))

    // ASSERT: Service was NOT called
    expect(ContentService.listContent).not.toHaveBeenCalled()

    // ASSERT: Response was NOT sent
    expect(mockRes.json).not.toHaveBeenCalled()
  })

  /**
   * TEST CASE 5: Limit Too Large
   *
   * Scenario: User requests limit > 100
   * Expected: Validation error
   *
   * Why limit to 100?
   * - Prevents abuse (someone requesting 1 million documents)
   * - Protects server performance
   * - This is a security feature!
   */
  it('should reject limit greater than 100', async () => {
    // ARRANGE
    mockReq.query = { limit: '150' }

    // ACT
    await ContentController.getPaginatedContent(
      mockReq as Request,
      mockRes as Response,
      mockNext
    )

    // ASSERT: Error passed to next()
    expect(mockNext).toHaveBeenCalled()
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error))
  })

  /**
   * TEST CASE 6: Service Throws Error
   *
   * Scenario: Service layer throws an error (e.g., database down)
   * Expected: Pass error to next() middleware
   *
   * Why is this important?
   * - Errors should be caught and handled
   * - Error middleware will then format the response
   */
  it('should handle service errors and pass to next middleware', async () => {
    // ARRANGE: Service throws error
    const fakeError = new Error('Database connection failed')
    vi.mocked(ContentService.listContent).mockRejectedValue(fakeError)

    mockReq.query = { page: '1', limit: '20' }

    // ACT
    await ContentController.getPaginatedContent(
      mockReq as Request,
      mockRes as Response,
      mockNext
    )

    // ASSERT: Error was passed to next()
    expect(mockNext).toHaveBeenCalledWith(fakeError)

    // ASSERT: No response was sent
    expect(mockRes.json).not.toHaveBeenCalled()
  })
})

/**
 * TEST SUITE: getDocumentById Controller
 *
 * This controller:
 * 1. Requires authentication (req.auth().userId)
 * 2. Gets document ID from route params
 * 3. Calls contentService.getContentById()
 * 4. Returns document or 404
 */
describe('ContentController - getDocumentById', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: NextFunction

  beforeEach(() => {
    mockReq = {
      params: { id: 'test-doc-id' },
      // Mock Clerk auth
      auth: vi.fn().mockReturnValue({ userId: 'user-123' }),
    }

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    }

    mockNext = vi.fn() as unknown as NextFunction

    vi.clearAllMocks()
  })

  /**
   * TEST CASE 1: Document Found
   */
  it('should return document when found', async () => {
    // ARRANGE
    const fakeDocument = {
      _id: 'test-doc-id',
      title: 'Test Document',
      summary: 'Test summary',
      content: 'Full content here',
      quiz: {
        q1: {
          que: 'Test question?',
          ans: 'Test answer',
          options: ['Option 1', 'Option 2', 'Test answer'],
        },
      },
    }

    vi.mocked(ContentService.getContentById).mockResolvedValue(fakeDocument)

    // ACT
    await ContentController.getDocumentById(
      mockReq as Request,
      mockRes as Response,
      mockNext
    )

    // ASSERT: Service called with correct ID
    expect(ContentService.getContentById).toHaveBeenCalledWith('test-doc-id')

    // ASSERT: Document returned
    expect(mockRes.json).toHaveBeenCalledWith(fakeDocument)

    // ASSERT: No 404 status
    expect(mockRes.status).not.toHaveBeenCalled()
  })

  /**
   * TEST CASE 2: Document Not Found
   *
   * Scenario: ID doesn't exist
   * Expected: Return 404
   */
  it('should return 404 when document not found', async () => {
    // ARRANGE: Service returns null (document not found)
    vi.mocked(ContentService.getContentById).mockResolvedValue(null)

    // ACT
    await ContentController.getDocumentById(
      mockReq as Request,
      mockRes as Response,
      mockNext
    )

    // ASSERT: 404 status set
    expect(mockRes.status).toHaveBeenCalledWith(404)

    // ASSERT: Error message sent
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Document not found',
    })
  })

  /**
   * TEST CASE 3: Authentication Check
   *
   * Verifies that auth().userId is called
   */
  it('should check authentication before fetching document', async () => {
    // ARRANGE
    const fakeDocument = {
      _id: 'test',
      title: 'Test',
      content: 'Test content',
      quiz: {
        q1: {
          que: 'Test question?',
          ans: 'Test answer',
          options: ['Option 1', 'Option 2'],
        },
      },
    }
    vi.mocked(ContentService.getContentById).mockResolvedValue(fakeDocument)

    // ACT
    await ContentController.getDocumentById(
      mockReq as Request,
      mockRes as Response,
      mockNext
    )

    // ASSERT: auth() was called
    expect(mockReq.auth).toHaveBeenCalled()
  })
})

/**
 * TEST SUITE: getTodayContent Controller
 *
 * Simple controller that fetches today's documents
 */
describe('ContentController - getTodayContent', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: NextFunction

  beforeEach(() => {
    mockReq = {}
    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    }
    mockNext = vi.fn() as unknown as NextFunction
    vi.clearAllMocks()
  })

  it("should return today's content from service", async () => {
    // ARRANGE
    const fakeTodayContent = {
      data: [
        {
          id: '1',
          title: "Today's Doc",
          summary: 'New!',
          createdAt: new Date(),
        },
      ],
      meta: { date: '2024-01-01', total: 1 },
    }

    vi.mocked(ContentService.getTodayContent).mockResolvedValue(
      fakeTodayContent
    )

    // ACT
    await ContentController.getTodayContent(
      mockReq as Request,
      mockRes as Response,
      mockNext
    )

    // ASSERT
    expect(ContentService.getTodayContent).toHaveBeenCalled()
    expect(mockRes.json).toHaveBeenCalledWith(fakeTodayContent)
  })

  it('should handle errors from service', async () => {
    // ARRANGE
    const fakeError = new Error('Service error')
    vi.mocked(ContentService.getTodayContent).mockRejectedValue(fakeError)

    // ACT
    await ContentController.getTodayContent(
      mockReq as Request,
      mockRes as Response,
      mockNext
    )

    // ASSERT
    expect(mockNext).toHaveBeenCalledWith(fakeError)
  })
})

/**
 * WHY THESE TESTS MATTER
 *
 * Controller tests ensure:
 * 1. ✅ Request validation works (Zod schemas)
 * 2. ✅ Default values are applied correctly
 * 3. ✅ Invalid input is rejected (security)
 * 4. ✅ Service layer is called with correct params
 * 5. ✅ Responses are formatted correctly
 * 6. ✅ Errors are handled and passed to middleware
 * 7. ✅ Authentication is checked (for protected routes)
 *
 * Together with service tests, we have complete unit test coverage
 * of our business logic, without needing a real database!
 */
