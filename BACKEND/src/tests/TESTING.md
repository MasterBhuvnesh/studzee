# Testing Guide

## Overview

This document explains how to write and run tests for the Studzee backend. We have three types of tests:

1. **Unit Tests** - Fast, isolated function tests
2. **Integration Tests** - Complete flows with real databases
3. **Mocked Integration Tests** - Complete flows with fake databases

## Quick Start

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm test:watch

# Run only unit tests
npm test tests/unit

# Run only integration tests
npm test tests/integration

# Run only mocked tests
npm test tests/mocked

# Run with coverage report
npm test -- --coverage
```

## Test Structure

```
src/tests/
├── unit/                    # Fast, isolated tests
│   ├── services/
│   ├── controllers/
│   └── utils/
├── integration/             # Full flow with real DBs
│   └── *.route.test.ts
├── mocked/                  # Full flow with fake DBs
│   └── *.route.mock.test.ts
├── setup/
│   ├── globalSetup.ts     # Runs before all tests
│   └── testDatabase.ts    # DB connection helpers
└── mocks/
    └── database.mock.ts   # Reusable mocks

```

## When to Use Which Test Type

### Unit Tests (`tests/unit/`)

**Use when:**

- Testing a single function or class
- Function has no external dependencies
- You want fast feedback during development

**Example:** Testing pagination math in a service

```typescript
// tests/unit/services/content.service.test.ts
it('should calculate skip correctly', async () => {
  // Test just the math: (page-1) * limit
  expect(calculateSkip(3, 10)).toBe(20)
})
```

### Integration Tests (`tests/integration/`)

**Use when:**

- Testing complete user flows
- Verifying database interactions
- Testing authentication
- Before deploying to production

**Example:** Testing the complete /content endpoint

```typescript
// tests/integration/content.route.test.ts
it('should return paginated documents', async () => {
  const response = await request(app).get('/content')
  expect(response.status).toBe(200)
  // This hits real MongoDB!
})
```

### Mocked Integration Tests (`tests/mocked/`)

**Use when:**

- Running in CI/CD pipelines
- Don't have test databases available
- Want faster integration tests

**Example:** Same as integration but with mocks

```typescript
// tests/mocked/content.route.mock.test.ts
it('should return paginated documents', async () => {
  // Mock MongoDB response
  vi.mocked(DocumentModel.find).mockReturnValue(...)

  const response = await request(app).get('/content')
  expect(response.status).toBe(200)
  // This uses fake MongoDB!
})
```

## Writing Tests

### The AAA Pattern

All tests should follow this pattern:

```typescript
it('should do something', async () => {
  // ARRANGE: Set up test data and mocks
  const testData = { ... }
  vi.mocked(someFunction).mockReturnValue(testData)

  // ACT: Call the function being tested
  const result = await functionUnderTest()

  // ASSERT: Check the result
  expect(result).toBe(expected)
})
```

### Mocking in Unit Tests

**What is mocking?**
Replacing real dependencies with fake ones.

```typescript
// Mock the database model
vi.mock('@/models/document.model')

// Tell the mock what to return
vi.mocked(DocumentModel.find).mockResolvedValue([...fakeData])

// When service calls DocumentModel.find(), it gets fakeData
const result = await contentService.listContent(1, 20)
```

**Why mock?**

- **Speed**: No database connections (tests run in milliseconds)
- **Reliability**: No network failures
- **Control**: We decide exactly what data is returned

### Mocking Mongoose Chains

Mongoose uses method chaining:

```typescript
await DocumentModel.find({}).sort({ createdAt: -1 }).skip(0).limit(20).lean()
```

To mock this:

```typescript
const mockLean = vi.fn().mockResolvedValue(fakeData)
const mockLimit = vi.fn().mockReturnValue({ lean: mockLean })
const mockSkip = vi.fn().mockReturnValue({ limit: mockLimit })
const mockSort = vi.fn().mockReturnValue({ skip: mockSkip })
const mockFind = vi.fn().mockReturnValue({ sort: mockSort })

vi.mocked(DocumentModel.find).mockImplementation(mockFind)
```

## Test Examples

### Testing a Service (Unit Test)

```typescript
// tests/unit/services/content.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as contentService from '@/core/services/content.service'
import { DocumentModel } from '@/models/document.model'
import { redisClient } from '@/config'

vi.mock('@/models/document.model')
vi.mock('@/config')

describe('ContentService - listContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return cached data when available', async () => {
    // ARRANGE
    const cachedData = { data: [...], meta: {...} }
    vi.mocked(redisClient.get).mockResolvedValue(JSON.stringify(cachedData))

    // ACT
    const result = await contentService.listContent(1, 20)

    // ASSERT
    expect(result).toEqual(cachedData)
    expect(DocumentModel.find).not.toHaveBeenCalled() // Didn't hit DB!
  })
})
```

### Testing a Controller (Unit Test)

```typescript
// tests/unit/controllers/content.controller.test.ts
import * as ContentController from '@/api/controllers/content.controller'
import * as ContentService from '@/core/services/content.service'

vi.mock('@/core/services/content.service')

describe('ContentController - getPaginatedContent', () => {
  let mockReq, mockRes, mockNext

  beforeEach(() => {
    mockReq = { query: {} }
    mockRes = { json: vi.fn(), status: vi.fn().mockReturnThis() }
    mockNext = vi.fn()
    vi.clearAllMocks()
  })

  it('should return 200 with data', async () => {
    // ARRANGE
    const fakeData = { data: [...], meta: {...} }
    vi.mocked(ContentService.listContent).mockResolvedValue(fakeData)
    mockReq.query = { page: '1', limit: '20' }

    // ACT
    await ContentController.getPaginatedContent(mockReq, mockRes, mockNext)

    // ASSERT
    expect(mockRes.json).toHaveBeenCalledWith(fakeData)
  })
})
```

### Testing a Route (Integration Test)

```typescript
// tests/integration/content.route.test.ts
import request from 'supertest'
import express from 'express'
import contentRoutes from '@/api/routes/content.route'
import {
  setupTestDatabases,
  teardownTestDatabases,
} from '../setup/testDatabase'

const app = express()
app.use(express.json())
app.use('/content', contentRoutes)

beforeAll(async () => {
  await setupTestDatabases()
})

afterAll(async () => {
  await teardownTestDatabases()
})

describe('GET /content', () => {
  it('should return paginated documents', async () => {
    // ACT: Make real HTTP request
    const response = await request(app).get('/content')

    // ASSERT
    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('data')
    expect(response.body).toHaveProperty('meta')
  })
})
```

## Troubleshooting

### Tests Failing with "Cannot find module"

**Problem:** Path aliases not working

**Solution:** Make sure `vitest.config.ts` has correct path aliases:

```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src')
  }
}
```

### Tests Hanging / Not Exiting

**Problem:** Database connections not closed

**Solution:** Make sure to call `teardownTestDatabases()`:

```typescript
afterAll(async () => {
  await teardownTestDatabases()
})
```

### Mock Not Working

**Problem:** Mock called after the import

**Solution:** Always mock BEFORE importing the module:

```typescript
// Correct order
vi.mock('@/models/document.model')
import * as contentService from '@/core/services/content.service'

// Incorrect order
import * as contentService from '@/core/services/content.service'
vi.mock('@/models/document.model') // Too late!
```

## Coverage Reports

We use **Istanbul** for code coverage, which provides detailed HTML reports with branch visualization.

Generate coverage report:

```bash
npm test -- --coverage
```

This creates:

- **Terminal report**: Shows coverage % for each file
- **HTML report**: Open `coverage/index.html` in browser for detailed visualization
- **LCOV report**: For CI/CD integration (in `coverage/lcov.info`)

**What Istanbul shows:**

- **Statement coverage**: % of code statements executed
- **Branch coverage**: % of if/else branches tested
- **Function coverage**: % of functions called
- **Line coverage**: % of lines executed

**Coverage goals:**

- Services: 90%+
- Controllers: 85%+
- Routes: 80%+

## Best Practices

### 1. One Assertion Per Test?

**No.** Multiple related assertions are acceptable:

```typescript
it('should return paginated data', async () => {
  const response = await request(app).get('/content')

  expect(response.status).toBe(200) // Good
  expect(response.body).toHaveProperty('data') // Good
  expect(response.body.data).toBeArray() // Good
})
```

### 2. Test Names

Use descriptive names that explain the scenario:

```typescript
// Good
it('should return 404 when document not found', ...)

// Bad
it('test document', ...)
```

### 3. beforeEach vs beforeAll

- `beforeEach`: Runs before EACH test (use for mocks)
- `beforeAll`: Runs ONCE before tests (use for DB connection)

```typescript
beforeAll(async () => {
  await connectDB() // Once per file
})

beforeEach(() => {
  vi.clearAllMocks() // Before each test
})
```

### 4. Async Tests

Always use async/await for database operations:

```typescript
// Correct
it('should ...', async () => {
  const result = await someAsyncFunction()
  expect(result).toBe(...)
})

// Incorrect (test will pass even if assertion fails!)
it('should ...', () => {
  someAsyncFunction().then(result => {
    expect(result).toBe(...)
  })
})
```

## Further Reading

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [AAA Pattern](https://docs.microsoft.com/en-us/visualstudio/test/unit-test-basics?view=vs-2022)

---

**Questions?** Check the test files themselves - they have extensive comments explaining concepts!
