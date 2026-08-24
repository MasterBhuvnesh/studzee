import { Schema, model } from 'mongoose'
import { IDocument } from '@/types/document'
import { TOPIC_KEYS } from '@/models/topics'

/**
 * @description Quiz item schema for documents
 */
const QuizItemMongooseSchema = new Schema(
  {
    que: { type: String, required: true },
    ans: { type: String, required: true },
    options: { type: [String], required: true },
  },
  { _id: false }
)

/**
 * @description PDF file schema for documents
 */
const PdfFileMongooseSchema = new Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    uploadedAt: { type: Date, required: true },
    size: { type: Number, required: true },
  },
  { _id: false }
)

/**
 * @description Document schema
 */
const DocumentMongooseSchema = new Schema<IDocument>(
  {
    title: { type: String, required: true, index: true },
    content: { type: Schema.Types.Mixed, required: true },
    quiz: {
      type: Map,
      of: QuizItemMongooseSchema,
      required: true,
    },
    facts: { type: String },
    summary: { type: String },
    // Constrained to the fixed code-level registry; indexed because every
    // topic-filtered list query hits this path.
    topic: {
      type: String,
      enum: [...TOPIC_KEYS],
      index: true,
    },
    unlockPoints: { type: Number, default: 0 },
    key_notes: {
      type: Map,
      of: String,
    },
    imageUrl: { type: String, required: false },
    pdfUrl: { type: [PdfFileMongooseSchema], required: false, default: [] },
  },
  {
    timestamps: true,
    collection: 'content',
  }
)

/**
 * @description Add a text index for searching on the title
 */
DocumentMongooseSchema.index({ title: 'text', summary: 'text' })

/**
 * @description Document model
 */
export const DocumentModel = model<IDocument>(
  'Document',
  DocumentMongooseSchema
)
