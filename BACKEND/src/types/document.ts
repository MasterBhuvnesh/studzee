import { Document } from 'mongoose'
import { z } from 'zod'
import {
  QuizItemSchema,
  PdfFileSchema,
  DocumentSchema,
} from '@/models/document.schema'

/**
 * Document-related type definitions
 * All types are inferred from Zod schemas for consistency
 */

export type TQuizItem = z.infer<typeof QuizItemSchema>
export type TPdfFile = z.infer<typeof PdfFileSchema>
export type TDocument = z.infer<typeof DocumentSchema>

// Mongoose document type combining TDocument with Mongoose Document
export interface IDocument extends TDocument, Document {}
