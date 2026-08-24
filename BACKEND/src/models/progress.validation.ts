import { z } from 'zod'

/**
 * POST /progress/attempts body.
 *
 * contentId is a Mongo document id. responses maps each quiz key to the zero
 * based index of the chosen option; keys that do not exist in the quiz are
 * ignored by the grader rather than rejected here, so a stale client answer
 * sheet still grades against the questions that match.
 */
export const RecordAttemptSchema = z.object({
  contentId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'contentId must be a 24 character hex string'),
  responses: z.record(z.string(), z.number().int().min(0)),
})

export type TRecordAttempt = z.infer<typeof RecordAttemptSchema>
