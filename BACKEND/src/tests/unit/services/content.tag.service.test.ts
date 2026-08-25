/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * UNIT TESTS FOR CONTENT SERVICE TAG SUPPORT
 *
 * Mirrors content.topic.service.test.ts but only covers tag filtering:
 * - listContent scopes find and count to the tag, alone or beside a topic
 * - the cache key gains a :tag:{t} suffix only when a tag is present,
 *   composing with the existing topic suffix
 * - an unknown tag is not rejected anywhere upstream; it just matches nothing
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as contentService from '@/services/content.service'
import { DocumentModel } from '@/models/document.model'
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
  return { mockFind }
}

describe('listContent with a tag filter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('scopes find and count to the tag when no topic is given', async () => {
    // ARRANGE: cache miss so the service goes to Mongo.
    vi.mocked(redisClient.get).mockResolvedValue(null)

    const fakeDocs = [
      {
        _id: '1',
        title: 'Text Classification with Deep Learning',
        summary: 'Assign labels to text',
        createdAt: new Date(),
      },
    ]
    const { mockFind } = mockFindChain(fakeDocs)
    vi.mocked(DocumentModel.find).mockImplementation(mockFind as any)
    vi.mocked(DocumentModel.countDocuments).mockResolvedValue(1)
    vi.mocked(redisClient.set).mockResolvedValue('OK' as any)

    // ACT
    const result = await contentService.listContent(1, 20, undefined, 'nlp')

    // ASSERT: both the page and the total match on the freeform tag.
    expect(DocumentModel.find).toHaveBeenCalledWith(
      { tags: 'nlp' },
      'title summary createdAt topic'
    )
    expect(DocumentModel.countDocuments).toHaveBeenCalledWith({ tags: 'nlp' })
    expect(result.meta).toEqual({ page: 1, limit: 20, total: 1 })

    // ASSERT: the tag-filtered response is cached under its own key.
    expect(redisClient.get).toHaveBeenCalledWith(
      'content:list:page:1:limit:20:tag:nlp'
    )
    expect(redisClient.set).toHaveBeenCalledWith(
      'content:list:page:1:limit:20:tag:nlp',
      JSON.stringify(result),
      { EX: 300 }
    )
  })

  it('combines topic and tag in one filter and one cache key', async () => {
    // ARRANGE: cache miss.
    vi.mocked(redisClient.get).mockResolvedValue(null)

    const { mockFind } = mockFindChain([])
    vi.mocked(DocumentModel.find).mockImplementation(mockFind as any)
    vi.mocked(DocumentModel.countDocuments).mockResolvedValue(0)
    vi.mocked(redisClient.set).mockResolvedValue('OK' as any)

    // ACT
    await contentService.listContent(2, 10, 'machine-learning', 'tutorial')

    // ASSERT: both constraints ride in the same query document.
    expect(DocumentModel.find).toHaveBeenCalledWith(
      { topic: 'machine-learning', tags: 'tutorial' },
      'title summary createdAt topic'
    )
    expect(DocumentModel.countDocuments).toHaveBeenCalledWith({
      topic: 'machine-learning',
      tags: 'tutorial',
    })

    // ASSERT: the suffixes compose in call order, topic then tag.
    expect(redisClient.get).toHaveBeenCalledWith(
      'content:list:page:2:limit:10:topic:machine-learning:tag:tutorial'
    )
    expect(redisClient.set).toHaveBeenCalledWith(
      'content:list:page:2:limit:10:topic:machine-learning:tag:tutorial',
      JSON.stringify({ data: [], meta: { page: 2, limit: 10, total: 0 } }),
      { EX: 300 }
    )
  })

  it('serves a tag-filtered page from its own cache entry', async () => {
    // ARRANGE: something cached under the suffixed key.
    const cached = { data: [], meta: { page: 1, limit: 20, total: 0 } }
    vi.mocked(redisClient.get).mockResolvedValue(JSON.stringify(cached))

    // ACT
    const result = await contentService.listContent(1, 20, undefined, 'ci-cd')

    // ASSERT: cache read from the suffixed key, no DB round trip.
    expect(result).toEqual(cached)
    expect(redisClient.get).toHaveBeenCalledWith(
      'content:list:page:1:limit:20:tag:ci-cd'
    )
    expect(DocumentModel.find).not.toHaveBeenCalled()
    expect(DocumentModel.countDocuments).not.toHaveBeenCalled()
  })

  it('keeps the base cache key and match-all filter when no tag is passed', async () => {
    // ARRANGE: cache miss.
    vi.mocked(redisClient.get).mockResolvedValue(null)

    const { mockFind } = mockFindChain([])
    vi.mocked(DocumentModel.find).mockImplementation(mockFind as any)
    vi.mocked(DocumentModel.countDocuments).mockResolvedValue(0)
    vi.mocked(redisClient.set).mockResolvedValue('OK' as any)

    // ACT
    await contentService.listContent(1, 20)

    // ASSERT: pre-existing keys stay warm; the filter object stays empty.
    expect(redisClient.get).toHaveBeenCalledWith('content:list:page:1:limit:20')
    expect(DocumentModel.find).toHaveBeenCalledWith(
      {},
      'title summary createdAt topic'
    )
    expect(DocumentModel.countDocuments).toHaveBeenCalledWith({})
  })

  it('queries rather than rejects an unknown tag', async () => {
    // ARRANGE: cache miss, no documents carry this tag.
    vi.mocked(redisClient.get).mockResolvedValue(null)

    const { mockFind } = mockFindChain([])
    vi.mocked(DocumentModel.find).mockImplementation(mockFind as any)
    vi.mocked(DocumentModel.countDocuments).mockResolvedValue(0)
    vi.mocked(redisClient.set).mockResolvedValue('OK' as any)

    // ACT
    const result = await contentService.listContent(
      1,
      20,
      undefined,
      'no-such-tag'
    )

    // ASSERT: an empty page, not an error. Tags are freeform within a
    // document, unlike the fixed topics.
    expect(result.meta.total).toBe(0)
    expect(DocumentModel.countDocuments).toHaveBeenCalledWith({
      tags: 'no-such-tag',
    })
  })
})
