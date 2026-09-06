import { backendFetch } from './client'
import type { Pagination } from './notifications'
import type { QuestType } from './quests'
import type { TopicKey } from './documents'
import type { DraftKind, DraftStatus } from './constants'

export { DRAFT_KINDS, DRAFT_STATUSES } from './constants'
export type { DraftKind, DraftStatus } from './constants'

export interface AiDraft {
  id: string
  kind: DraftKind
  status: DraftStatus
  sourceId: string | null
  payload: unknown
  model: string
  createdBy: string
  reviewedBy: string | null
  reviewedAt: string | null
  appliedId: string | null
  error: string | null
  createdAt: string
}

export async function listDrafts(params: {
  page?: number
  limit?: number
  status?: DraftStatus
  kind?: DraftKind
}) {
  const query = new URLSearchParams()
  query.set('page', String(params.page ?? 1))
  query.set('limit', String(params.limit ?? 20))
  if (params.status) query.set('status', params.status)
  if (params.kind) query.set('kind', params.kind)

  return backendFetch<{ drafts: AiDraft[]; pagination: Pagination }>(
    `/admin/ai/drafts?${query.toString()}`
  )
}

export async function getDraft(id: string) {
  const result = await backendFetch<{ data: AiDraft }>(`/admin/ai/drafts/${id}`)
  return result.data
}

export async function approveDraft(id: string, overrides?: Record<string, unknown>) {
  return backendFetch<{ message: string; data: { draft: AiDraft; appliedId: string } }>(
    `/admin/ai/drafts/${id}/approve`,
    { method: 'POST', body: { overrides } }
  )
}

export async function rejectDraft(id: string, reason?: string) {
  return backendFetch<{ message: string; data: AiDraft }>(
    `/admin/ai/drafts/${id}/reject`,
    { method: 'POST', body: { reason } }
  )
}

export async function generateQuiz(input: { contentId: string; count?: number }) {
  return backendFetch<{ message: string; data: AiDraft }>('/admin/ai/generate/quiz', {
    method: 'POST',
    body: input,
  })
}

export async function generateNotes(input: { contentId: string }) {
  return backendFetch<{ message: string; data: AiDraft }>('/admin/ai/generate/notes', {
    method: 'POST',
    body: input,
  })
}

export async function generateQuest(input: {
  contentId: string
  type: QuestType
  gems: number
  questionCount?: number
  passScore?: number
  startsAt: string
  endsAt: string
}) {
  return backendFetch<{ message: string; data: AiDraft }>('/admin/ai/generate/quest', {
    method: 'POST',
    body: input,
  })
}

export async function generateNotification(input: {
  kind: 'content' | 'quest'
  id: string
}) {
  return backendFetch<{ message: string; data: AiDraft }>(
    '/admin/ai/generate/notification',
    { method: 'POST', body: input }
  )
}

export async function generateContent(input: {
  title?: string
  topic?: TopicKey
  brief?: string
  sections?: number
  quizCount?: number
}) {
  return backendFetch<{ message: string; data: AiDraft }>('/admin/ai/generate/content', {
    method: 'POST',
    body: input,
  })
}

export async function reindexKb() {
  return backendFetch<{ message: string; data: unknown }>('/admin/ai/kb/reindex', {
    method: 'POST',
  })
}
