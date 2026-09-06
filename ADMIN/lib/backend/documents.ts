import { backendFetch } from './client'

export type TopicKey =
  | 'machine-learning'
  | 'system-design'
  | 'devops'
  | 'aws'
  | 'data'
  | 'deep-learning'

export interface TQuizItem {
  que: string
  ans: string
  options: string[]
}

export interface TPdfFile {
  name: string
  url: string
  uploadedAt: string
  size: number
}

export interface TDocument {
  id?: string
  title: string
  content: Record<string, unknown> | unknown[]
  quiz: Record<string, TQuizItem>
  facts?: string
  summary?: string
  key_notes?: Record<string, string>
  imageUrl?: string | null
  tags?: string[]
  pdfUrl?: TPdfFile[]
  topic: TopicKey
  unlockPoints?: number
  createdAt?: string
  updatedAt?: string
}

export type TDocumentInput = Omit<TDocument, 'id' | 'createdAt' | 'updatedAt'>

export async function createDocument(input: TDocumentInput) {
  return backendFetch<{ message: string; doc: TDocument }>('/admin/documents', {
    method: 'POST',
    body: input,
  })
}

export async function updateDocument(id: string, input: Partial<TDocumentInput>) {
  return backendFetch<TDocument>(`/admin/documents/${id}`, {
    method: 'PUT',
    body: input,
  })
}

export async function deleteDocument(id: string) {
  return backendFetch<null>(`/admin/documents/${id}`, { method: 'DELETE' })
}

/**
 * Reads the ungated admin route added in this task's BACKEND half, not
 * GET /content/:id: that one gates on unlockPoints against the caller's
 * progress points, and an admin has none, so every gated document would 403.
 */
export async function getDocument(id: string) {
  return backendFetch<TDocument>(`/admin/documents/${id}`)
}

/**
 * One row of the document list.
 *
 * GET /content is projected to 'title summary createdAt topic tags'
 * (BACKEND/src/services/content.service.ts), so a list row is NOT a whole
 * TDocument: it carries no content, quiz, key_notes, facts, imageUrl,
 * pdfUrl or unlockPoints. Anything needing those calls getDocument.
 */
export interface DocumentListItem {
  id: string
  title: string
  summary?: string
  createdAt: string
  topic: TopicKey
  tags?: string[]
}

export interface DocumentListResult {
  data: DocumentListItem[]
  meta: { page: number; limit: number; total: number }
}

/**
 * BACKEND has no admin-only document listing route; GET /content is the
 * same public, cached, paginated listing the mobile app reads, and is what
 * the documents list page (Task 12) is built on. limit defaults high (100,
 * the route's own maximum) so useDataTable (ported in Task 3) can do
 * search/sort/pagination over one fetched page in memory, the same pattern
 * the sample project uses.
 */
export async function listDocuments(params: {
  page?: number
  limit?: number
  topic?: TopicKey
  tag?: string
}) {
  const query = new URLSearchParams()
  query.set('page', String(params.page ?? 1))
  query.set('limit', String(params.limit ?? 100))
  if (params.topic) query.set('topic', params.topic)
  if (params.tag) query.set('tag', params.tag)

  return backendFetch<DocumentListResult>(`/content?${query.toString()}`)
}
