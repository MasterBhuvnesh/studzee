import { z } from 'zod'

const TOPIC_KEYS = [
  'machine-learning',
  'system-design',
  'devops',
  'aws',
  'data',
  'deep-learning',
] as const

const quizItemSchema = z.object({
  que: z.string().min(1, 'Question is required'),
  ans: z.string().min(1, 'Answer is required'),
  options: z.array(z.string()).min(2, 'At least two options are required'),
})

export const documentFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long'),
  content: z.union([z.record(z.string(), z.any()), z.array(z.any())]),
  quiz: z.record(z.string(), quizItemSchema),
  facts: z.string().optional(),
  summary: z.string().optional(),
  key_notes: z.record(z.string(), z.string()).optional(),
  imageUrl: z.string().url().nullable().optional(),
  tags: z
    .array(z.string().trim().min(1).max(30))
    .min(2, 'At least two tags are required')
    .max(5, 'At most five tags are allowed')
    .optional(),
  topic: z.enum(TOPIC_KEYS),
  unlockPoints: z.number().int().min(0).optional(),
})

const QUEST_TYPES = ['mcq', 'scq', 'fill_blank', 'read_blog'] as const

const choiceQuestionSchema = z.object({
  key: z.string().min(1),
  que: z.string().min(1),
  options: z.array(z.string().min(1)).min(2),
  ans: z.string().min(1),
})

const fillBlankQuestionSchema = z.object({
  key: z.string().min(1),
  que: z.string().min(1),
  answer: z.string().min(1),
})

const choicePayloadSchema = z.object({
  passScore: z.number().int().min(1),
  questions: z.array(choiceQuestionSchema).min(1),
})

const fillBlankPayloadSchema = z.object({
  passScore: z.number().int().min(1),
  questions: z.array(fillBlankQuestionSchema).min(1),
})

export const questFormSchema = z
  .object({
    title: z.string().min(1).max(200),
    description: z.string().min(1).max(2000),
    type: z.enum(QUEST_TYPES),
    gems: z.number().int().min(1),
    contentId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'contentId must be a 24 character hex string')
      .optional(),
    payload: choicePayloadSchema.or(fillBlankPayloadSchema).optional(),
    active: z.boolean().optional().default(true),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
  })
  .superRefine((data, ctx) => {
    if (data.endsAt.getTime() <= data.startsAt.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endsAt'],
        message: 'endsAt must be after startsAt',
      })
    }

    const graded = data.type !== 'read_blog'
    if (graded && !data.payload) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['payload'],
        message: `payload with questions is required for ${data.type} quests`,
      })
    }
    if (
      graded &&
      data.payload &&
      data.payload.passScore > data.payload.questions.length
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['passScore'],
        message: 'passScore cannot exceed the number of questions',
      })
    }
    if (data.type === 'read_blog' && !data.contentId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['contentId'],
        message: 'contentId is required for read_blog quests',
      })
    }
  })

export const notificationFormSchema = z
  .object({
    title: z.string().min(1, 'Title is required'),
    message: z.string().min(1, 'Message is required'),
    imageUrl: z.string().url('Invalid image URL').optional(),
    sendToAll: z.boolean(),
    emails: z.array(z.string().email()).optional(),
  })
  .refine(
    (data) => data.sendToAll || (data.emails !== undefined && data.emails.length > 0),
    { message: 'At least one email is required when sendToAll is false', path: ['emails'] }
  )

export const emailFormSchema = z.object({
  emails: z.array(z.string().email()).min(1, 'At least one email is required'),
  subject: z.string().min(1, 'Subject is required'),
  title: z.string().min(1, 'Title is required'),
  body: z.string().min(1, 'Body is required'),
  banner: z.string().url().optional(),
  footer: z.string().optional(),
  pdfUrls: z.array(z.string().url()).optional(),
})
