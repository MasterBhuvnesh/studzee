'use server'

import { revalidatePath } from 'next/cache'
import { sendNotification, type SendNotificationInput } from '@/lib/backend/notifications'
import { notificationFormSchema } from '@/lib/schemas'

/**
 * Returns the delivery stats instead of void: BACKEND answers HTTP 207 with
 * a success status when a broadcast reaches only some devices, so the caller
 * cannot tell a partial failure from a clean send without these counts.
 */
export async function sendNotificationAction(input: SendNotificationInput) {
  const parsed = notificationFormSchema.parse(input)
  const result = await sendNotification(parsed)
  revalidatePath('/notifications')
  return result.data
}
