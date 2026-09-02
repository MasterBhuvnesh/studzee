import { auth } from '@clerk/nextjs/server'

export class BackendError extends Error {
  status: number
  body: unknown

  constructor(status: number, message: string, body: unknown) {
    super(message)
    this.name = 'BackendError'
    this.status = status
    this.body = body
  }
}

type BackendFetchInit = Omit<RequestInit, 'body'> & { body?: unknown }

/**
 * Server-only fetch wrapper for every call to BACKEND. Attaches the current
 * Clerk session's bearer token, so it must run in a Server Component, a
 * Server Action, or a Route Handler, never in client code.
 */
export async function backendFetch<T>(
  path: string,
  init: BackendFetchInit = {}
): Promise<T> {
  const baseUrl = process.env.BACKEND_API_URL
  if (!baseUrl) {
    throw new Error('BACKEND_API_URL is not set')
  }

  const { getToken } = await auth()
  const token = await getToken()

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(init.headers as Record<string, string> | undefined),
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  })

  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    const message =
      (data && typeof data === 'object' && 'message' in data
        ? String((data as { message: unknown }).message)
        : undefined) ?? `Request to ${path} failed with status ${response.status}`
    throw new BackendError(response.status, message, data)
  }

  return data as T
}
