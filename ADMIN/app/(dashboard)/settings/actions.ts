'use server'

import { revalidatePath } from 'next/cache'
import { updateAiConfig } from '@/lib/backend/ai-config'

export async function updateChatModelAction(chatModel: string) {
  await updateAiConfig(chatModel)
  revalidatePath('/settings')
  revalidatePath('/ai-drafts')
}
