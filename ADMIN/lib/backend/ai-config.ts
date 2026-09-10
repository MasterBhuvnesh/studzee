import { backendFetch } from './client'

export interface AiConfigView {
  chatModel: string
  source: 'stored' | 'env'
  updatedBy: string | null
  updatedAt: string | null
  availableModels: string[]
  defaultModel: string
}

export async function getAiConfig() {
  const result = await backendFetch<{ data: AiConfigView }>('/admin/ai/config')
  return result.data
}

export async function updateAiConfig(chatModel: string) {
  return backendFetch<{ message: string; data: unknown }>('/admin/ai/config', {
    method: 'PUT',
    body: { chatModel },
  })
}
