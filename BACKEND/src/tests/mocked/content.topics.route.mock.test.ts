/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * MOCKED ROUTE TESTS FOR CONTENT TOPIC SUPPORT
 *
 * Mirrors content.route.mock.test.ts for Track A:
 * - GET /content/topics returns the registry in the standard envelope
 * - /topics is registered before /:id so the literal path wins
 * - an unknown topic query gets a 400 naming the allowed keys
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import contentRoutes from '@/api/routes/content.route'
import { DocumentModel } from '@/models/document.model'
import { redisClient } from '@/config'
import { TOPIC_REGISTRY, TOPIC_KEYS } from '@/models/topics'

vi.mock('@/models/document.model')

vi.mock('@/config', () => ({
  connectDB: vi.fn(),
  disconnectDB: vi.fn(),
  connectRedis: vi.fn(),
  disconnectRedis: vi.fn(),
  redisClient: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
  },
  config: {
    LIST_CACHE_TTL: 300,
    DOC_CACHE_TTL: 600,
    TODAY_CACHE_TTL: 900,
  },
}))

const app = express()
app.use(express.json())
app.use('/content', contentRoutes)

// Fallback error handler, mirroring the existing mocked route tests.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: any, res: any, _next: any) => {
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation error',
      details: err.errors,
    })
  }
  res.status(500).json({ error: 'Internal server error' })
})

/** Builds the mongoose chain mock for cache-miss list requests. */
const mockFindChain = (docs: unknown[]) => {
  const mockLean = vi.fn().mockResolvedValue(docs)
  const mockLimit = vi.fn().mockReturnValue({ lean: mockLean })
  const mockSkip = vi.fn().mockReturnValue({ limit: mockLimit })
  const mockSort = vi.fn().mockReturnValue({ skip: mockSkip })
  const mockFind = vi.fn().mockReturnValue({ sort: mockSort })
  return { mockFind }
}

describe('GET /content/topics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(redisClient.get).mockResolvedValue(null)
  })

  it('returns the registry inside the data envelope', async () => {
    // ACT
    const response = await request(app).get('/content/topics')

    // ASSERT: same top-level envelope convention as the paginated list.
    expect(response.status).toBe(200)
    expect(response.body).toEqual({ data: TOPIC_REGISTRY })
    expect(response.body.data[0]).toEqual({
      key: 'machine-learning',
      label: 'Machine Learning',
    })
    // Registry order must survive the round trip.
    expect(response.body.data.map((t: any) => t.key)).toEqual([...TOPIC_KEYS])

    // The registry is static: no database and no cache involved.
    expect(DocumentModel.find).not.toHaveBeenCalled()
    expect(redisClient.get).not.toHaveBeenCalled()
  })

  it('registers /topics before /:id in the router stack', () => {
    const paths = (contentRoutes as any).stack
      .map((layer: any) => layer.route?.path)
      .filter(Boolean)

    const topicsIndex = paths.indexOf('/topics')
    const idIndex = paths.indexOf('/:id')

    expect(topicsIndex).toBeGreaterThan(-1)
    expect(idIndex).toBeGreaterThan(-1)
    expect(topicsIndex).toBeLessThan(idIndex)
  })

  it('serves /topics itself rather than treating it as an ID', async () => {
    // ARRANGE: if /:id captured this path, auth would run and the lookup
    // would fail instead of returning the registry.
    vi.mocked(DocumentModel.findById).mockResolvedValue(null as any)

    // ACT
    const response = await request(app).get('/content/topics')

    // ASSERT
    expect(response.status).toBe(200)
    expect(response.body.data).toHaveLength(TOPIC_KEYS.length)
    expect(DocumentModel.findById).not.toHaveBeenCalled()
  })
})

describe('GET /content topic filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(redisClient.get).mockResolvedValue(null)
  })

  it('rejects an unknown topic with a 400 listing allowed keys', async () => {
    // ACT
    const response = await request(app).get('/content').query({
      topic: 'blockchain',
    })

    // ASSERT: middleware rejects before the service is reached.
    expect(response.status).toBe(400)
    expect(response.body.message).toBe('Invalid query parameters')

    const topicErrors: string[] = response.body.errors.topic
    const joined = topicErrors.join(' ')
    expect(joined).toContain('Allowed topics')
    for (const key of TOPIC_KEYS) {
      expect(joined).toContain(key)
    }

    expect(DocumentModel.find).not.toHaveBeenCalled()
    expect(DocumentModel.countDocuments).not.toHaveBeenCalled()
  })

  it('passes a valid topic through to the service filter', async () => {
    // ARRANGE
    const fakeDocs = [
      {
        _id: '1',
        title: 'CI/CD Pipelines from Scratch',
        summary: 'Push to production automatically',
        createdAt: new Date(),
      },
    ]
    const { mockFind } = mockFindChain(fakeDocs)
    vi.mocked(DocumentModel.find).mockImplementation(mockFind as any)
    vi.mocked(DocumentModel.countDocuments).mockResolvedValue(1)

    // ACT
    const response = await request(app)
      .get('/content')
      .query({ topic: 'devops' })

    // ASSERT: the filter reaches Mongo and the response keeps its envelope.
    expect(response.status).toBe(200)
    expect(response.body.meta.total).toBe(1)
    expect(mockFind).toHaveBeenCalledWith(
      { topic: 'devops' },
      'title summary createdAt topic'
    )

    // ASSERT: filtered requests read their own cache namespace.
    expect(redisClient.get).toHaveBeenCalledWith(
      'content:list:page:1:limit:20:topic:devops'
    )
  })
})
