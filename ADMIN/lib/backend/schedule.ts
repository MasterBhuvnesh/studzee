import { backendFetch } from './client'
import type { TopicKey } from './documents'

export type ScheduledStatus = 'pending' | 'done' | 'failed' | 'canceled'

export interface ScheduledDraft {
  id: string
  kind: string
  input: Record<string, unknown>
  runAt: string
  status: ScheduledStatus
  createdBy: string
  draftId: string | null
  error: string | null
  createdAt: string
}

export interface SchedulePagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export async function listSchedules(params: {
  page?: number
  limit?: number
  status?: ScheduledStatus
}) {
  const query = new URLSearchParams()
  query.set('page', String(params.page ?? 1))
  query.set('limit', String(params.limit ?? 20))
  if (params.status) query.set('status', params.status)

  return backendFetch<{ schedules: ScheduledDraft[]; pagination: SchedulePagination }>(
    `/admin/ai/schedule?${query.toString()}`
  )
}

export async function scheduleContent(input: {
  title?: string
  topic?: TopicKey
  brief?: string
  sections?: number
  quizCount?: number
  runAt: string
}) {
  return backendFetch<{ message: string; data: ScheduledDraft }>(
    '/admin/ai/schedule/content',
    { method: 'POST', body: input }
  )
}

export async function cancelSchedule(id: string) {
  return backendFetch<{ message: string; data: ScheduledDraft }>(
    `/admin/ai/schedule/${id}`,
    { method: 'DELETE' }
  )
}
