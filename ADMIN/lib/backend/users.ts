import { backendFetch } from './client'
import type { Pagination } from './notifications'

export interface UserRecord {
  id: string
  clerkId: string
  email: string
  expoTokens: string[]
  createdAt: string
  updatedAt: string
}

export async function listUsers(params: {
  page?: number
  limit?: number
  sortBy?: string
  order?: 'asc' | 'desc'
}) {
  const query = new URLSearchParams()
  query.set('page', String(params.page ?? 1))
  query.set('limit', String(params.limit ?? 20))
  if (params.sortBy) query.set('sortBy', params.sortBy)
  if (params.order) query.set('order', params.order)

  return backendFetch<{ users: UserRecord[]; pagination: Pagination }>(
    `/admin/users?${query.toString()}`
  )
}

/**
 * List every registered email address for the broadcast recipient picker.
 * The backend wraps the array in an envelope; unwrap it to return a bare list.
 */
export async function listUserEmails() {
  const result = await backendFetch<{ data: string[]; meta: { total: number } }>(
    '/admin/users/emails'
  )
  return result.data
}
