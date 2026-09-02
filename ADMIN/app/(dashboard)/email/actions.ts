'use server'

import { revalidatePath } from 'next/cache'
import { sendEmail, type SendEmailInput } from '@/lib/backend/email'
import { emailFormSchema } from '@/lib/schemas'

export async function sendEmailAction(input: SendEmailInput) {
  const parsed = emailFormSchema.parse(input)
  await sendEmail(parsed)
  revalidatePath('/email')
}
