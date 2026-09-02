import { backendFetch } from './client'
import type { TopicKey } from './documents'

export interface TopicEntry {
  key: TopicKey
  label: string
}

export async function listTopics() {
  const result = await backendFetch<{ data: TopicEntry[] }>('/content/topics')
  return result.data
}
