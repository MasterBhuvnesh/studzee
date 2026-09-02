import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

const mockAuth = vi.fn()
vi.mock('@clerk/nextjs/server', () => ({ auth: () => mockAuth() }))

import { backendFetch, BackendError } from './client'

describe('backendFetch', () => {
  beforeEach(() => {
    mockAuth.mockReset()
    mockAuth.mockResolvedValue({ getToken: async () => 'test-token' })
    vi.stubGlobal('fetch', vi.fn())
    process.env.BACKEND_API_URL = 'https://api.test'
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('attaches the bearer token and base URL', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    )

    const result = await backendFetch<{ ok: boolean }>('/admin/users')

    expect(fetch).toHaveBeenCalledWith(
      'https://api.test/admin/users',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      })
    )
    expect(result).toEqual({ ok: true })
  })

  it('throws BackendError with the response body on a non-2xx status', async () => {
    vi.mocked(fetch).mockImplementation(async () =>
      new Response(JSON.stringify({ message: 'Not found' }), { status: 404 })
    )

    await expect(backendFetch('/admin/users/x')).rejects.toThrow(BackendError)
    await expect(backendFetch('/admin/users/x')).rejects.toMatchObject({
      status: 404,
      message: 'Not found',
    })
  })

  it('sends a JSON body and content-type for a POST with a body', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('{}', { status: 200 }))

    await backendFetch('/admin/quests', {
      method: 'POST',
      body: { title: 'x' },
    })

    expect(fetch).toHaveBeenCalledWith(
      'https://api.test/admin/quests',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ title: 'x' }),
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      })
    )
  })
})
