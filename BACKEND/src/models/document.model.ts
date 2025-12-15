import { Schema, model, Document } from 'mongoose'
import { TDocument } from './document.schema'

// Mongoose document type
export interface IDocument extends TDocument, Document {}

const QuizItemMongooseSchema = new Schema(
  {
    que: { type: String, required: true },
    ans: { type: String, required: true },
    options: { type: [String], required: true },
  },
  { _id: false }
)

const DocumentMongooseSchema = new Schema<IDocument>(
  {
    title: { type: String, required: true, index: true },
    content: { type: String, required: true },
    quiz: {
      type: Map,
      of: QuizItemMongooseSchema,
      required: true,
    },
    facts: { type: String },
    summary: { type: String },
    key_notes: {
      type: Map,
      of: String,
    },
    imageUrl: { type: String, required: false },
    pdfUrl: { type: String, required: false },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
)

// Add a text index for searching on the title
DocumentMongooseSchema.index({ title: 'text', summary: 'text' })

export const DocumentModel = model<IDocument>(
  'Document',
  DocumentMongooseSchema
)
