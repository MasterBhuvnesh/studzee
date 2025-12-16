import { z } from 'zod'

/**
 * Zod schema for a single quiz item.
 */
export const QuizItemSchema = z.object({
  que: z.string({ required_error: 'Question is required' }),
  ans: z.string({ required_error: 'Answer is required' }),
  options: z.array(z.string()).min(2, 'At least two options are required'),
})

/**
 * Zod schema for the main document.
 * This is the single source of truth for document validation.
 */
export const DocumentSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long'),
  content: z.string().min(10, 'Content must be at least 10 characters long'),
  quiz: z.record(z.string(), QuizItemSchema),
  facts: z.string().optional(),
  summary: z.string().optional(),
  key_notes: z.record(z.string(), z.string()).optional(),
  imageUrl: z.string().url().nullable().optional(),
  pdfUrl: z.string().url().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

// Type inference for easy use in TypeScript
export type TQuizItem = z.infer<typeof QuizItemSchema>
export type TDocument = z.infer<typeof DocumentSchema>
