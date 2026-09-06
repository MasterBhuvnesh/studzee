import { backendFetch } from './client'

export interface SendNotificationInput {
  title: string
  message: string
  imageUrl?: string
  sendToAll: boolean
  emails?: string[]
}

export interface NotificationRecord {
  id: string
  title: string
  message: string
  imageUrl?: string
  sentBy: string
  sentTo: string[]
  sentToAll: boolean
  status: string
  createdAt: string
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

/**
 * Send a push notification to registered devices. Returns detailed delivery
 * stats including targeted count, sent count, failed count, and pruned invalid
 * tokens. The backend returns HTTP 207 on partial delivery (some devices failed)
 * to distinguish from a clean send; backendFetch treats 207 as success, so the
 * caller must inspect the delivered counts to detect partial failure.
 */
export async function sendNotification(input: SendNotificationInput) {
  return backendFetch<{
    message: string
    data: { targeted: number; sent: number; failed: number; prunedTokens: number }
  }>('/admin/notifications/send', {
    method: 'POST',
    body: input,
  })
}

export async function listNotifications(params: {
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

  return backendFetch<{
    notifications: NotificationRecord[]
    pagination: Pagination
  }>(`/admin/notifications?${query.toString()}`)
}
