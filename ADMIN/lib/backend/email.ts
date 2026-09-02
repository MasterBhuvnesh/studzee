import { backendFetch } from './client'
import type { Pagination } from './notifications'

export interface SendEmailInput {
  emails: string[]
  subject: string
  title: string
  body: string
  banner?: string
  footer?: string
  pdfUrls?: string[]
}

export interface EmailLogRecord {
  id: string
  subject: string
  message: string
  pdfUrls: string[]
  sentBy: string
  sentTo: string[]
  status: string
  createdAt: string
}

export async function sendEmail(input: SendEmailInput) {
  return backendFetch<{ message: string }>('/admin/emails/send', {
    method: 'POST',
    body: input,
  })
}

export async function listEmailLogs(params: {
  page?: number
  limit?: number
  sortBy?: string
  order?: 'asc' | 'desc'
}) {
  const query = new URLSearchParams()
  query.set('page', String(params.page ?? 1))
  query.set('limit', String(params.limit ?? 20))
  if (params.sortBy) query.set('sortBy', params.sortBy)
  query.set('order', params.order ?? 'desc')

  return backendFetch<{ logs: EmailLogRecord[]; pagination: Pagination }>(
    `/admin/emails/logs?${query.toString()}`
  )
}
