'use server'

import { revalidatePath } from 'next/cache'
import { createQuest, setQuestActive, type TCreateQuestInput } from '@/lib/backend/quests'
import { questFormSchema } from '@/lib/schemas'

export async function createQuestAction(input: TCreateQuestInput) {
  const parsed = questFormSchema.parse({
    ...input,
    startsAt: new Date(input.startsAt),
    endsAt: new Date(input.endsAt),
  })
  await createQuest({
    ...parsed,
    startsAt: parsed.startsAt.toISOString(),
    endsAt: parsed.endsAt.toISOString(),
  })
  revalidatePath('/quests')
}

export async function setQuestActiveAction(id: string, active: boolean) {
  await setQuestActive(id, active)
  revalidatePath('/quests')
}
