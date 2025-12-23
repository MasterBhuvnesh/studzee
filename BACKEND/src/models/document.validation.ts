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
 * Zod schema for a PDF file with metadata.
 */
export const PdfFileSchema = z.object({
  name: z.string({ required_error: 'PDF name is required' }),
  url: z.string().url({ message: 'PDF URL must be a valid URL' }),
  uploadedAt: z.date({ required_error: 'Upload date is required' }),
  size: z.number().positive({ message: 'PDF size must be positive' }),
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
  pdfUrl: z.array(PdfFileSchema).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})
