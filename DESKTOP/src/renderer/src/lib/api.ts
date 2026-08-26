/**
 * Admin API client for the Studzee backend.
 *
 * The renderer talks to the backend through the `/api` prefix, which the
 * electron-vite dev server proxies to the live API. Every admin route needs
 * a bearer token with the admin role, so the token lives in localStorage and
 * rides on every request.
 */

const TOKEN_KEY = 'studzee.admin.token'

export function getApiToken(): string {
  return localStorage.getItem(TOKEN_KEY) ?? ''
}

export function setApiToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token.trim())
}

export function hasApiToken(): boolean {
  return getApiToken().length > 0
}

/**
 * When Clerk is active the bridge installs a provider that mints a fresh
 * session token per request, because those tokens expire in about a minute.
 * Without it the stored manual token is the single source.
 */
let tokenProvider: (() => Promise<string | null>) | null = null

export function setTokenProvider(provider: (() => Promise<string | null>) | null): void {
  tokenProvider = provider
}

async function currentToken(): Promise<string> {
  try {
    const provided = await tokenProvider?.()
    if (provided) return provided
  } catch {
    // Fall through to whatever manual token exists
  }
  return getApiToken()
}

export class ApiError extends Error {
  status: number
  details?: unknown

  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.status = status
    this.details = details
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  extraHeaders?: Record<string, string>
): Promise<T> {
  const headers: Record<string, string> = { ...extraHeaders }
  const token = await currentToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const response = await fetch(`/api${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  })

  let payload: unknown = null
  const text = await response.text()
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = text
    }
  }

  if (!response.ok) {
    const record = payload as { message?: string; errors?: unknown } | null
    throw new ApiError(
      record?.message ?? `Request failed (${response.status})`,
      response.status,
      record?.errors
    )
  }

  return payload as T
}

// ============ Types ============

export interface TopicInfo {
  key: string
  label: string
}

export interface DocumentSummary {
  _id: string
  id: string
  title: string
  summary: string
  createdAt: string
  topic: string
  tags: string[]
}

export interface QuizItem {
  que: string
  ans: string
  options: string[]
}

export type ContentBlock =
  | { type: 'text'; value: string }
  | { type: string; [key: string]: unknown }

export interface DocumentDetail extends DocumentSummary {
  content: { title: string; content: ContentBlock[] }[]
  quiz: Record<string, QuizItem>
  facts?: string
  key_notes?: Record<string, string>
  imageUrl?: string | null
  unlockPoints?: number
  updatedAt?: string
}

export interface DocumentPayload {
  title: string
  summary: string
  topic: string
  tags: string[]
  content: unknown
  quiz: Record<string, QuizItem>
  facts?: string
  imageUrl?: string | null
  unlockPoints?: number
}

export interface Paginated<T> {
  data: T[]
  meta: { page: number; limit: number; total: number }
}

export interface QuestQuestionChoice {
  key: string
  que: string
  options: string[]
  ans: string
}

export interface QuestQuestionFill {
  key: string
  que: string
  answer: string
}

export interface AdminQuest {
  id?: string
  _id?: string
  title: string
  description: string
  type: string
  gems: number
  contentId?: string | null
  active?: boolean
  startsAt: string
  endsAt: string
  completed?: boolean
  payload?: {
    passScore?: number
    questions?: (QuestQuestionChoice | QuestQuestionFill)[]
  }
}

export interface QuestPayload {
  title: string
  description: string
  type: string
  gems: number
  contentId?: string
  active: boolean
  startsAt: string
  endsAt: string
  payload?: {
    passScore: number
    questions: (QuestQuestionChoice | QuestQuestionFill)[]
  }
}

export interface RegisteredUser {
  id?: number | string
  email: string
  expoTokens?: string[] | number
  registeredAt?: string
  [key: string]: unknown
}

// ============ Endpoints ============

export async function listTopics(): Promise<TopicInfo[]> {
  const json = await request<{ data?: TopicInfo[] }>('GET', '/content/topics')
  return json.data ?? []
}

export async function listContent(params: {
  page?: number
  limit?: number
  topic?: string
  tag?: string
}): Promise<Paginated<DocumentSummary>> {
  const query = new URLSearchParams()
  query.set('page', String(params.page ?? 1))
  query.set('limit', String(params.limit ?? 20))
  if (params.topic) query.set('topic', params.topic)
  if (params.tag) query.set('tag', params.tag)
  return request<Paginated<DocumentSummary>>('GET', `/content?${query.toString()}`)
}

export async function getContent(id: string): Promise<DocumentDetail> {
  return request<DocumentDetail>('GET', `/content/${id}`)
}

export async function createDocument(payload: DocumentPayload): Promise<DocumentDetail> {
  return request<DocumentDetail>('POST', '/admin/documents', payload)
}

export async function updateDocument(
  id: string,
  payload: Partial<DocumentPayload>
): Promise<DocumentDetail> {
  return request<DocumentDetail>('PUT', `/admin/documents/${id}`, payload)
}

export async function deleteDocument(id: string): Promise<void> {
  await request<unknown>('DELETE', `/admin/documents/${id}`)
}

export async function listAdminQuests(): Promise<AdminQuest[]> {
  const json = await request<{ data?: AdminQuest[] } | AdminQuest[]>('GET', '/admin/quests')
  if (Array.isArray(json)) return json
  return json.data ?? []
}

export async function createQuest(payload: QuestPayload): Promise<unknown> {
  return request<unknown>('POST', '/admin/quests', payload)
}

export async function listUsers(params: {
  page?: number
  limit?: number
}): Promise<Paginated<RegisteredUser>> {
  const query = new URLSearchParams()
  query.set('page', String(params.page ?? 1))
  query.set('limit', String(params.limit ?? 50))
  return request<Paginated<RegisteredUser>>('GET', `/admin/users?${query.toString()}`)
}

export async function listUserEmailsSafe(): Promise<string[]> {
  const json = await request<{ data?: string[] }>('GET', '/admin/users/emails')
  return json.data ?? []
}

export interface SendPushPayload {
  title: string
  message: string
  imageUrl?: string
  sendToAll: boolean
  emails?: string[]
}

export async function sendPushNotification(payload: SendPushPayload): Promise<{
  message?: string
  data?: unknown
}> {
  return request('POST', '/admin/notifications/send', payload)
}
