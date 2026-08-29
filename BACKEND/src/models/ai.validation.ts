import { z } from 'zod'
import { DocumentSchema, QuizItemSchema } from '@/models/document.validation'
import { TopicSchema } from '@/models/topics'
import { QUEST_TYPES } from '@/models/quest.validation'

/**
 * AI VALIDATION
 *
 * Two kinds of schema live here and the difference matters.
 *
 * The Generated* schemas describe what the model is asked to return. They are
 * built out of the existing content and quest schemas wherever possible, so a
 * rule only exists in one place: QuizItemSchema already requires two options,
 * and reusing it means the generator inherits that rule rather than restating
 * it and drifting.
 *
 * The rest are request bodies for the admin and support routes, applied with
 * validateBody exactly like every other route in the service.
 *
 * Deliberately absent from the generated shapes: anything the owner supplies.
 * The model never picks a quest's gems, window or type, never picks a topic,
 * and never sets a passScore. It writes prose and questions; the operator
 * decides the economics.
 */

export const DRAFT_KINDS = [
  'document',
  'quiz',
  'key_notes',
  'quest',
  'notification',
] as const
export type DraftKind = (typeof DRAFT_KINDS)[number]

export const DRAFT_STATUSES = ['pending', 'approved', 'rejected'] as const
export type DraftStatus = (typeof DRAFT_STATUSES)[number]

/** A 24 character Mongo document id, matching the rule CreateQuestSchema uses. */
const MongoIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Must be a 24 character hex string')

// --- What the model is asked to return ---

/**
 * A renderable block.
 *
 * The five variants are exactly what components/content/contentmd.tsx switches
 * on in the client. DocumentSchema types content as z.any(), which is fine for
 * hand authored material an operator can see rendered before shipping, but a
 * generated body is written by something that has never seen the app: an
 * invented block type would validate against z.any() and then render as a gap
 * on the screen. This is the trust boundary, so it is checked here.
 */
const ContentBlockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), value: z.string().min(1) }),
  z.object({
    type: z.literal('list'),
    items: z.array(z.string().min(1)).min(2),
  }),
  z.object({
    type: z.literal('table'),
    headers: z.array(z.string().min(1)).min(2),
    rows: z.array(z.array(z.string())).min(1),
  }),
  z.object({ type: z.literal('formula'), value: z.string().min(1) }),
  z.object({ type: z.literal('code'), value: z.string().min(1) }),
])

const ContentSectionSchema = z.object({
  title: z.string().min(1),
  content: z.array(ContentBlockSchema).min(1),
})

/**
 * The article body on its own. The quiz and the notes are not asked for in the
 * same call: one request for a whole document would run past any sane token
 * ceiling, and the quiz and notes prompts already exist and are better written
 * against a finished body than against a brief.
 */
export const GeneratedArticleSchema = z.object({
  title: z.string().min(3).max(200),
  // Picked from the fixed registry, not invented. TopicSchema is the same enum
  // the document schema uses, so an unknown key fails here rather than landing
  // in a draft that no filter will ever match.
  topic: TopicSchema,
  content: z.array(ContentSectionSchema).min(2),
  facts: z.string().min(1).max(2000),
  tags: z.array(z.string().trim().min(1).max(30)).min(2).max(5),
})
export type TGeneratedArticle = z.infer<typeof GeneratedArticleSchema>

/**
 * A whole document draft, which is what the three generation calls assemble
 * into and what approval re-validates before adminService.createDocument sees
 * it. Extending DocumentSchema carries its rules across for free: the three
 * character title minimum, the quiz item shape, the topic enum. Only the
 * fields a generated document must actually have are tightened here.
 */
export const GeneratedDocumentSchema = DocumentSchema.extend({
  content: z.array(ContentSectionSchema).min(2),
  facts: z.string().min(1).max(2000),
  summary: z.string().min(20).max(1200),
  key_notes: z.record(z.string().min(1), z.string().min(1)),
  tags: z.array(z.string().trim().min(1).max(30)).min(2).max(5),
})
export type TGeneratedDocument = z.infer<typeof GeneratedDocumentSchema>

/**
 * A quiz map keyed the same way a document's quiz field is keyed. Reusing
 * QuizItemSchema carries the two option minimum across for free.
 */
export const GeneratedQuizSchema = z.object({
  quiz: z.record(z.string().min(1), QuizItemSchema),
})
export type TGeneratedQuiz = z.infer<typeof GeneratedQuizSchema>

/**
 * Summary and key notes for an existing document. The key notes map mirrors
 * the document field of the same name, so approval is a straight assignment.
 */
export const GeneratedNotesSchema = z.object({
  summary: z.string().min(20).max(1200),
  key_notes: z.record(z.string().min(1), z.string().min(1)),
})
export type TGeneratedNotes = z.infer<typeof GeneratedNotesSchema>

const GeneratedChoiceQuestionSchema = z.object({
  key: z.string().min(1),
  que: z.string().min(1),
  options: z.array(z.string().min(1)).min(2),
  // The answer text, not an index. The grader in quest.service.ts compares
  // options[index] against this string, so an index here would never match.
  ans: z.string().min(1),
})

const GeneratedFillBlankQuestionSchema = z.object({
  key: z.string().min(1),
  que: z.string().min(1),
  answer: z.string().min(1),
})

/** Title and description only. Used for read_blog, which carries no questions. */
export const GeneratedQuestCopySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
})
export type TGeneratedQuestCopy = z.infer<typeof GeneratedQuestCopySchema>

export const GeneratedChoiceQuestSchema = GeneratedQuestCopySchema.extend({
  questions: z.array(GeneratedChoiceQuestionSchema).min(1),
})

export const GeneratedFillBlankQuestSchema = GeneratedQuestCopySchema.extend({
  questions: z.array(GeneratedFillBlankQuestionSchema).min(1),
})

/**
 * Push copy. The lengths are what Android and iOS will actually show before
 * truncating, so a longer draft would be approved and then silently cut.
 */
export const GeneratedNotificationSchema = z.object({
  title: z.string().min(1).max(60),
  message: z.string().min(1).max(160),
})
export type TGeneratedNotification = z.infer<typeof GeneratedNotificationSchema>

// --- Request bodies ---

/**
 * Generating a document from nothing but a title.
 *
 * This is the one generator with no contentId: the operator names the subject
 * and the model writes the body. topic stays an operator choice because it
 * drives list filtering and unlock gating, and brief is the free text steer
 * for scope, depth and audience.
 */
export const GenerateContentSchema = z
  .object({
    // Both optional. Supplied, they are honoured exactly; left out, the model
    // picks them and the reviewer corrects either with an approval override.
    // Topic is worth letting the model choose because it is a six key
    // registry, not a free field, so the worst case is a wrong key rather than
    // an invented one.
    title: z.string().trim().min(3).max(200).optional(),
    topic: TopicSchema.optional(),
    // Either a short steer or a whole article pasted in. The ceiling is the
    // same 12000 characters the prompt builder truncates source material at,
    // so anything that fits here reaches the model whole.
    brief: z.string().trim().max(12_000).optional(),
    sections: z.number().int().min(2).max(10).default(5),
    quizCount: z.number().int().min(1).max(15).default(5),
  })
  .superRefine((data, ctx) => {
    // With neither a title nor a brief there is nothing to write about, and
    // the model would invent a subject. Catch it before paying for the call.
    if (!data.title && !data.brief) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['title'],
        message: 'Supply a title, a brief, or both',
      })
    }
  })
export type TGenerateContent = z.infer<typeof GenerateContentSchema>

export const GenerateQuizSchema = z.object({
  contentId: MongoIdSchema,
  count: z.number().int().min(1).max(15).default(5),
})
export type TGenerateQuiz = z.infer<typeof GenerateQuizSchema>

export const GenerateNotesSchema = z.object({
  contentId: MongoIdSchema,
})
export type TGenerateNotes = z.infer<typeof GenerateNotesSchema>

export const GenerateQuestSchema = z
  .object({
    contentId: MongoIdSchema,
    type: z.enum(QUEST_TYPES),
    gems: z.number().int().min(1),
    questionCount: z.number().int().min(1).max(10).default(3),
    // Left out to take the default of sixty percent of the questions, rounded
    // up. Supplied when the owner wants a harder or easier bar.
    passScore: z.number().int().min(1).optional(),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
  })
  .superRefine((data, ctx) => {
    // Checked here as well as in CreateQuestSchema so an impossible window is
    // rejected before a model call is paid for rather than after.
    if (data.endsAt.getTime() <= data.startsAt.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endsAt'],
        message: 'endsAt must be after startsAt',
      })
    }
    if (data.passScore !== undefined && data.passScore > data.questionCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['passScore'],
        message: 'passScore cannot exceed questionCount',
      })
    }
  })
export type TGenerateQuest = z.infer<typeof GenerateQuestSchema>

/**
 * A notification is drafted about either a document or a quest. The id is not
 * constrained to a Mongo shape because a quest id is a cuid.
 */
export const GenerateNotificationSchema = z.object({
  kind: z.enum(['content', 'quest']),
  id: z.string().min(1),
})
export type TGenerateNotification = z.infer<typeof GenerateNotificationSchema>

export const ListDraftsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(DRAFT_STATUSES).optional(),
  kind: z.enum(DRAFT_KINDS).optional(),
})
export type TListDraftsQuery = z.infer<typeof ListDraftsQuerySchema>

/**
 * Approval may carry field overrides, merged over the stored payload before it
 * is applied. This is how a title clash or a bad question is fixed without a
 * separate edit endpoint: the merged result is re-validated against the same
 * schema the draft was generated under, so an override cannot smuggle in a
 * shape the generator would have rejected.
 */
export const ApproveDraftSchema = z.object({
  overrides: z.record(z.string(), z.unknown()).optional(),
})
export type TApproveDraft = z.infer<typeof ApproveDraftSchema>

export const RejectDraftSchema = z.object({
  reason: z.string().max(500).optional(),
})
export type TRejectDraft = z.infer<typeof RejectDraftSchema>

/**
 * A support question plus the tail of the conversation. History is client held
 * and capped here rather than trusted: an unbounded history is both a cost and
 * a prompt injection surface.
 */
export const AskSupportSchema = z.object({
  question: z.string().trim().min(1, 'A question is required').max(1000),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(4000),
      })
    )
    .max(12)
    .optional(),
})
export type TAskSupport = z.infer<typeof AskSupportSchema>
