import { backendFetch } from './client'
import type { Pagination } from './notifications'

export interface UserRecord {
  id: string
  clerkId: string
  email: string
  expoTokens: string[]
  createdAt: string
}

export async function listUsers(params: { page?: number; limit?: number }) {
  const query = new URLSearchParams()
  query.set('page', String(params.page ?? 1))
  query.set('limit', String(params.limit ?? 20))

  return backendFetch<{ users: UserRecord[]; pagination: Pagination }>(
    `/admin/users?${query.toString()}`
  )
}

export async function listUserEmails() {
  return backendFetch<string[]>('/admin/users/emails')
}
