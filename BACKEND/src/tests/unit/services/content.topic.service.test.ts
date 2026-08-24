/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * UNIT TESTS FOR CONTENT SERVICE TOPIC SUPPORT
 *
 * Mirrors content.service.test.ts but only covers Track A behavior:
 * - listContent filters find and count by topic when given
 * - the cache key gains a :topic:{t} suffix only when filtering
 * - getTopics returns the static registry without touching storage
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as contentService from '@/services/content.service'
import { DocumentModel } from '@/models/document.model'
import { TOPIC_REGISTRY } from '@/models/topics'
import { redisClient } from '@/config'

vi.mock('@/models/document.model')
vi.mock('@/config', () => ({
  redisClient: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  },
  config: {
    LIST_CACHE_TTL: 300,
    DOC_CACHE_TTL: 600,
    TODAY_CACHE_TTL: 900,
  },
}))

/** Builds the mongoose query chain mock used on every cache-miss path. */
const mockFindChain = (docs: unknown[]) => {
  const mockLean = vi.fn().mockResolvedValue(docs)
  const mockLimit = vi.fn().mockReturnValue({ lean: mockLean })
  const mockSkip = vi.fn().mockReturnValue({ limit: mockLimit })
  const mockSort = vi.fn().mockReturnValue({ skip: mockSkip })
  const mockFind = vi.fn().mockReturnValue({ sort: mockSort })
  return { mockFind, mockSort }
}

describe('listContent with a topic filter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('scopes find and count to the topic and caches under the suffixed key', async () => {
    // ARRANGE: cache miss so the service goes to Mongo.
    vi.mocked(redisClient.get).mockResolvedValue(null)

    const fakeDocs = [
      {
        _id: '1',
        title: 'CAP Theorem',
        summary: 'Consistency or availability',
        createdAt: new Date(),
      },
    ]
    const { mockFind } = mockFindChain(fakeDocs)
    vi.mocked(DocumentModel.find).mockImplementation(mockFind as any)
    vi.mocked(DocumentModel.countDocuments).mockResolvedValue(1)
    vi.mocked(redisClient.set).mockResolvedValue('OK' as any)

    // ACT
    const result = await contentService.listContent(1, 20, 'system-design')

    // ASSERT: both the page and the total are scoped to the topic.
    expect(DocumentModel.find).toHaveBeenCalledWith(
      { topic: 'system-design' },
      'title summary createdAt topic'
    )
    expect(DocumentModel.countDocuments).toHaveBeenCalledWith({
      topic: 'system-design',
    })

    // ASSERT: result shape matches the unfiltered envelope.
    expect(result.meta).toEqual({ page: 1, limit: 20, total: 1 })
    expect(result.data[0].title).toBe('CAP Theorem')

    // ASSERT: the filtered response gets its own cache entry.
    expect(redisClient.get).toHaveBeenCalledWith(
      'content:list:page:1:limit:20:topic:system-design'
    )
    expect(redisClient.set).toHaveBeenCalledWith(
      'content:list:page:1:limit:20:topic:system-design',
      JSON.stringify(result),
      { EX: 300 }
    )
  })

  it('serves a topic-filtered page from its own cache entry', async () => {
    // ARRANGE: something cached under the suffixed key.
    const cached = { data: [], meta: { page: 2, limit: 5, total: 0 } }
    vi.mocked(redisClient.get).mockResolvedValue(JSON.stringify(cached))

    // ACT
    const result = await contentService.listContent(2, 5, 'devops')

    // ASSERT: cache read from the suffixed key, no DB round trip.
    expect(result).toEqual(cached)
    expect(redisClient.get).toHaveBeenCalledWith(
      'content:list:page:2:limit:5:topic:devops'
    )
    expect(DocumentModel.find).not.toHaveBeenCalled()
    expect(DocumentModel.countDocuments).not.toHaveBeenCalled()
  })

  it('keeps the unsuffixed cache key when no topic is passed', async () => {
    // ARRANGE: cache miss.
    vi.mocked(redisClient.get).mockResolvedValue(null)

    const { mockFind } = mockFindChain([])
    vi.mocked(DocumentModel.find).mockImplementation(mockFind as any)
    vi.mocked(DocumentModel.countDocuments).mockResolvedValue(0)
    vi.mocked(redisClient.set).mockResolvedValue('OK' as any)

    // ACT
    await contentService.listContent(1, 20)

    // ASSERT: unfiltered pages keep their original key and match-all filter,
    // which keeps pre-existing cache entries warm.
    expect(redisClient.get).toHaveBeenCalledWith('content:list:page:1:limit:20')
    expect(DocumentModel.find).toHaveBeenCalledWith(
      {},
      'title summary createdAt topic'
    )
    expect(DocumentModel.countDocuments).toHaveBeenCalledWith({})
  })
})

describe('getTopics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the full registry in order without any I/O', () => {
    const topics = contentService.getTopics()

    expect(topics).toEqual([
      { key: 'machine-learning', label: 'Machine Learning' },
      { key: 'system-design', label: 'System Design' },
      { key: 'devops', label: 'DevOps' },
      { key: 'aws', label: 'AWS' },
      { key: 'data', label: 'Data' },
      { key: 'deep-learning', label: 'Deep Learning' },
    ])
    expect(topics).toEqual(TOPIC_REGISTRY)

    // The registry is static, so neither Redis nor Mongo is consulted.
    expect(redisClient.get).not.toHaveBeenCalled()
    expect(DocumentModel.find).not.toHaveBeenCalled()
  })
})
