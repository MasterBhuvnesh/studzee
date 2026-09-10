import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockBackendFetch = vi.fn()
vi.mock('./client', () => ({
  backendFetch: (...args: unknown[]) => mockBackendFetch(...args),
}))

import { getAiConfig, updateAiConfig } from './ai-config'

describe('ai-config backend client', () => {
  beforeEach(() => mockBackendFetch.mockReset())

  it('getAiConfig unwraps the data envelope', async () => {
    mockBackendFetch.mockResolvedValue({ data: { chatModel: 'm1' } })

    const result = await getAiConfig()

    expect(mockBackendFetch).toHaveBeenCalledWith('/admin/ai/config')
    expect(result).toEqual({ chatModel: 'm1' })
  })

  it('updateAiConfig puts the chosen model', async () => {
    mockBackendFetch.mockResolvedValue({ message: 'ok', data: {} })

    await updateAiConfig('m2')

    expect(mockBackendFetch).toHaveBeenCalledWith('/admin/ai/config', {
      method: 'PUT',
      body: { chatModel: 'm2' },
    })
  })
})
