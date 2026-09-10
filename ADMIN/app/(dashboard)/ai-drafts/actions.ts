'use server'

import { revalidatePath } from 'next/cache'
import {
  approveDraft,
  rejectDraft,
  generateQuiz,
  generateNotes,
  generateQuest,
  generateNotification,
  generateContent,
} from '@/lib/backend/ai-drafts'
import {
  cancelSchedule,
  scheduleContent,
} from '@/lib/backend/schedule'
import type { QuestType } from '@/lib/backend/constants'
import type { TopicKey } from '@/lib/backend/documents'

export async function approveDraftAction(id: string, overrides?: Record<string, unknown>) {
  await approveDraft(id, overrides)
  revalidatePath('/ai-drafts')
  revalidatePath(`/ai-drafts/${id}`)
}

export async function rejectDraftAction(id: string, reason?: string) {
  await rejectDraft(id, reason)
  revalidatePath('/ai-drafts')
  revalidatePath(`/ai-drafts/${id}`)
}

// Each action below wraps one generateX client function so the generation
// panel on the list page can start a run and have the resulting draft land
// in the queue without a page reload.

export async function generateQuizAction(input: { contentId: string; count?: number }) {
  await generateQuiz(input)
  revalidatePath('/ai-drafts')
}

export async function generateNotesAction(input: { contentId: string }) {
  await generateNotes(input)
  revalidatePath('/ai-drafts')
}

export async function generateQuestAction(input: {
  contentId: string
  type: QuestType
  gems: number
  questionCount?: number
  passScore?: number
  startsAt: string
  endsAt: string
}) {
  await generateQuest(input)
  revalidatePath('/ai-drafts')
}

export async function generateNotificationAction(input: { kind: 'content' | 'quest'; id: string }) {
  await generateNotification(input)
  revalidatePath('/ai-drafts')
}

export async function generateContentAction(input: {
  title?: string
  topic?: TopicKey
  brief?: string
  sections?: number
  quizCount?: number
}) {
  await generateContent(input)
  revalidatePath('/ai-drafts')
}

export async function scheduleContentAction(input: {
  title?: string
  topic?: TopicKey
  brief?: string
  sections?: number
  quizCount?: number
  runAt: string
}) {
  await scheduleContent(input)
  revalidatePath('/ai-drafts')
}

export async function cancelScheduleAction(id: string) {
  await cancelSchedule(id)
  revalidatePath('/ai-drafts')
}
