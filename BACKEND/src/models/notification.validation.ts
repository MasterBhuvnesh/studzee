import { z } from 'zod'

/**
 * Zod schemas for the notification and email side of the API.
 * These are the single source of truth for those request shapes.
 */

export const RegisterUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  expoToken: z
    .string()
    .min(1, 'Expo token is required')
    .startsWith('ExponentPushToken[', 'Not a valid Expo push token'),
})

export const SendNotificationSchema = z
  .object({
    title: z.string().min(1, 'Title is required'),
    message: z.string().min(1, 'Message is required'),
    imageUrl: z.string().url('Invalid image URL').optional(),
    sendToAll: z.boolean(),
    emails: z.array(z.string().email()).optional(),
  })
  .refine(
    (data) =>
      data.sendToAll || (data.emails !== undefined && data.emails.length > 0),
    {
      message: 'At least one email is required when sendToAll is false',
      path: ['emails'],
    }
  )

export const SendEmailSchema = z.object({
  emails: z.array(z.string().email()).min(1, 'At least one email is required'),
  subject: z.string().min(1, 'Subject is required'),
  title: z.string().min(1, 'Title is required'),
  body: z.string().min(1, 'Body is required'),
  banner: z.string().url().optional(),
  footer: z.string().optional(),
  pdfUrls: z.array(z.string().url()).optional(),
})

/**
 * Shared paging and sorting for the admin listing endpoints.
 */
export const ListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
})

export type TRegisterUser = z.infer<typeof RegisterUserSchema>
export type TSendNotification = z.infer<typeof SendNotificationSchema>
export type TSendEmail = z.infer<typeof SendEmailSchema>
export type TListQuery = z.infer<typeof ListQuerySchema>
