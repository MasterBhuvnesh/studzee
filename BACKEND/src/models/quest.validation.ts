import { z } from 'zod'

/**
 * QUEST VALIDATION
 *
 * One create schema for the admin side and a submission schema union for the
 * completion endpoint. The submission shape depends on the quest type, which
 * only the server knows at grading time, so the union accepts any single
 * well formed response sheet: numeric option indices for the choice types or
 * free text for fill_blank. Type specific checks run against the stored quest
 * in the service, never against client claims.
 */

export const QUEST_TYPES = ['mcq', 'scq', 'fill_blank', 'read_blog'] as const
export type QuestType = (typeof QUEST_TYPES)[number]

const ChoiceQuestionSchema = z.object({
  key: z.string().min(1),
  que: z.string().min(1),
  options: z.array(z.string().min(1)).min(2),
  ans: z.string().min(1),
})

const FillBlankQuestionSchema = z.object({
  key: z.string().min(1),
  que: z.string().min(1),
  answer: z.string().min(1),
})

const ChoicePayloadSchema = z.object({
  passScore: z.number().int().min(1),
  questions: z.array(ChoiceQuestionSchema).min(1),
})

const FillBlankPayloadSchema = z.object({
  passScore: z.number().int().min(1),
  questions: z.array(FillBlankQuestionSchema).min(1),
})

export const CreateQuestSchema = z
  .object({
    title: z.string().min(1).max(200),
    description: z.string().min(1).max(2000),
    type: z.enum(QUEST_TYPES),
    gems: z.number().int().min(1),
    // Mongo document id, required for read_blog so the client has something
    // to open. Rejected for nothing else because only read_blog uses it.
    contentId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'contentId must be a 24 character hex string')
      .optional(),
    payload: ChoicePayloadSchema.or(FillBlankPayloadSchema).optional(),
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

export type TCreateQuest = z.infer<typeof CreateQuestSchema>

/** Option indices for mcq and scq submissions. */
const NumericResponsesSchema = z.record(z.string(), z.number().int().min(0))

/** Free text answers for fill_blank submissions. */
const TextResponsesSchema = z.record(z.string(), z.string())

// Strict on purpose: a body that carries responses is not an empty read_blog
// sheet, it should fall through to one of the graded branches instead.
export const ReadBlogSubmissionSchema = z.object({}).strict()

export const ChoiceSubmissionSchema = z
  .object({ responses: NumericResponsesSchema.optional() })
  .strip()

export const FillBlankSubmissionSchema = z
  .object({ responses: TextResponsesSchema.optional() })
  .strip()

export const QuestSubmissionSchema = z.union([
  ReadBlogSubmissionSchema,
  ChoiceSubmissionSchema,
  FillBlankSubmissionSchema,
])

/** Normalised response sheet the service grades against. */
export interface TQuestResponses {
  [key: string]: number | string | undefined
}
