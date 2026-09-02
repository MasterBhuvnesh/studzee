import { backendFetch } from './client'

export const QUEST_TYPES = ['mcq', 'scq', 'fill_blank', 'read_blog'] as const
export type QuestType = (typeof QUEST_TYPES)[number]

export interface ChoiceQuestion {
  key: string
  que: string
  options: string[]
  ans: string
}

export interface FillBlankQuestion {
  key: string
  que: string
  answer: string
}

export interface TCreateQuestInput {
  title: string
  description: string
  type: QuestType
  gems: number
  contentId?: string
  payload?:
    | { passScore: number; questions: ChoiceQuestion[] }
    | { passScore: number; questions: FillBlankQuestion[] }
  active?: boolean
  startsAt: string
  endsAt: string
}

export interface TQuest extends TCreateQuestInput {
  id: string
  createdAt: string
}

export async function createQuest(input: TCreateQuestInput) {
  return backendFetch<{ success: boolean; message: string; data: TQuest }>(
    '/admin/quests',
    {
      method: 'POST',
      body: input,
    }
  )
}

export async function listQuests() {
  const result = await backendFetch<{ success: boolean; data: TQuest[] }>(
    '/admin/quests'
  )
  return result.data
}
