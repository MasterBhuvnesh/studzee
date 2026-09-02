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
    delete process.env.BACKEND_API_URL
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

  it('does not allow caller to override the Authorization header', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('{}', { status: 200 }))

    await backendFetch('/admin/users', {
      headers: { Authorization: 'Bearer malicious-token' },
    })

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      })
    )
  })

  it('preserves caller-provided custom headers alongside Authorization', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('{}', { status: 200 }))

    await backendFetch('/admin/users', {
      headers: { 'X-Custom-Header': 'custom-value' },
    })

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
          'X-Custom-Header': 'custom-value',
        }),
      })
    )
  })

  it('throws BackendError with raw text when backend returns HTML on error', async () => {
    const htmlError = '<html><body>502 Bad Gateway</body></html>'
    vi.mocked(fetch).mockImplementation(async () =>
      new Response(htmlError, { status: 502 })
    )

    await expect(backendFetch('/admin/users')).rejects.toMatchObject({
      status: 502,
      message: htmlError,
    })
    await expect(backendFetch('/admin/users')).rejects.toThrow(BackendError)
  })

  it('caps error message at 500 characters for large HTML responses', async () => {
    const largeHtml = '<html>' + 'x'.repeat(600) + '</html>'
    vi.mocked(fetch).mockImplementation(async () =>
      new Response(largeHtml, { status: 502 })
    )

    let caughtError: BackendError | undefined
    try {
      await backendFetch('/admin/users')
    } catch (e) {
      caughtError = e as BackendError
    }

    expect(caughtError).toBeInstanceOf(BackendError)
    expect(caughtError?.message).toHaveLength(503) // 500 chars + '...'
    expect(caughtError?.message).toMatch(/\.\.\.$/)
  })

  it('throws BackendError when 2xx response body is not valid JSON', async () => {
    vi.mocked(fetch).mockImplementation(async () =>
      new Response('not json', { status: 200 })
    )

    await expect(backendFetch('/admin/users')).rejects.toMatchObject({
      status: 200,
      message: 'Response was not valid JSON',
    })
  })

  it('resolves with null for 204 No Content', async () => {
    vi.mocked(fetch).mockImplementation(async () => ({
      ok: true,
      status: 204,
      text: async () => '',
    } as Response))

    const result = await backendFetch('/admin/users/x')

    expect(result).toBeNull()
  })
})
