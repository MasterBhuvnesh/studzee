import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockBackendFetch = vi.fn()
vi.mock('./client', () => ({
  backendFetch: (...args: unknown[]) => mockBackendFetch(...args),
}))

import {
  createDocument,
  updateDocument,
  deleteDocument,
  getDocument,
  listDocuments,
} from './documents'

describe('documents backend client', () => {
  beforeEach(() => mockBackendFetch.mockReset())

  it('createDocument posts to /admin/documents', async () => {
    mockBackendFetch.mockResolvedValue({ message: 'ok', doc: { title: 'x' } })

    await createDocument({ title: 'x', content: {}, quiz: {} })

    expect(mockBackendFetch).toHaveBeenCalledWith('/admin/documents', {
      method: 'POST',
      body: { title: 'x', content: {}, quiz: {} },
    })
  })

  it('updateDocument puts to /admin/documents/:id', async () => {
    mockBackendFetch.mockResolvedValue({ title: 'x' })

    await updateDocument('doc1', { title: 'y' })

    expect(mockBackendFetch).toHaveBeenCalledWith('/admin/documents/doc1', {
      method: 'PUT',
      body: { title: 'y' },
    })
  })

  it('deleteDocument deletes /admin/documents/:id', async () => {
    mockBackendFetch.mockResolvedValue(null)

    await deleteDocument('doc1')

    expect(mockBackendFetch).toHaveBeenCalledWith('/admin/documents/doc1', {
      method: 'DELETE',
    })
  })

  it('getDocument reads the ungated admin route, not /content/:id', async () => {
    mockBackendFetch.mockResolvedValue({ title: 'x' })

    await getDocument('doc1')

    expect(mockBackendFetch).toHaveBeenCalledWith('/admin/documents/doc1')
  })

  it('listDocuments defaults to limit 100 and passes a topic filter', async () => {
    mockBackendFetch.mockResolvedValue({ data: [], meta: { page: 1, limit: 100, total: 0 } })

    await listDocuments({ topic: 'aws' })

    expect(mockBackendFetch).toHaveBeenCalledWith('/content?page=1&limit=100&topic=aws')
  })
})
