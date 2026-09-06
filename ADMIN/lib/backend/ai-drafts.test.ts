import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockBackendFetch = vi.fn()
vi.mock('./client', () => ({
  backendFetch: (...args: unknown[]) => mockBackendFetch(...args),
}))

import { listDrafts, getDraft, approveDraft, rejectDraft, reindexKb } from './ai-drafts'

describe('ai-drafts backend client', () => {
  beforeEach(() => mockBackendFetch.mockReset())

  it('listDrafts reads /admin/ai/drafts with filters', async () => {
    mockBackendFetch.mockResolvedValue({
      drafts: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    })

    await listDrafts({ status: 'pending', kind: 'quiz' })

    expect(mockBackendFetch).toHaveBeenCalledWith(
      '/admin/ai/drafts?page=1&limit=20&status=pending&kind=quiz'
    )
  })

  it('getDraft unwraps the data envelope', async () => {
    mockBackendFetch.mockResolvedValue({ data: { id: 'd1' } })

    const result = await getDraft('d1')

    expect(mockBackendFetch).toHaveBeenCalledWith('/admin/ai/drafts/d1')
    expect(result).toEqual({ id: 'd1' })
  })

  it('approveDraft posts overrides', async () => {
    mockBackendFetch.mockResolvedValue({ message: 'ok', data: {} })

    await approveDraft('d1', { title: 'fixed' })

    expect(mockBackendFetch).toHaveBeenCalledWith('/admin/ai/drafts/d1/approve', {
      method: 'POST',
      body: { overrides: { title: 'fixed' } },
    })
  })

  it('rejectDraft posts a reason', async () => {
    mockBackendFetch.mockResolvedValue({ message: 'ok', data: {} })

    await rejectDraft('d1', 'not good enough')

    expect(mockBackendFetch).toHaveBeenCalledWith('/admin/ai/drafts/d1/reject', {
      method: 'POST',
      body: { reason: 'not good enough' },
    })
  })

  it('reindexKb posts to /admin/ai/kb/reindex with no body', async () => {
    mockBackendFetch.mockResolvedValue({ message: 'ok', data: {} })

    await reindexKb()

    expect(mockBackendFetch).toHaveBeenCalledWith('/admin/ai/kb/reindex', {
      method: 'POST',
    })
  })
})
