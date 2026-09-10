import { ScheduledDraft } from '@prisma/client'
import { prisma } from '@/config'
import {
  GenerateContentSchema,
  TListSchedulesQuery,
  TScheduleContent,
} from '@/models/ai.validation'
import { generateContentDraft } from '@/services/ai/generate.service'
import { AppError } from '@/types/errors'
import logger from '@/utils/logger'

/**
 * SCHEDULED DRAFTS
 *
 * One shot content generations booked for a future time. The stored input is
 * the validated GenerateContentSchema body the immediate route would have
 * received, so a scheduled run and a manual run validate identically and
 * produce the same draft shape. The per minute ai-schedule job drains due
 * rows; an admin can cancel a pending row, but a finished row is history and
 * stays as the audit record.
 */

const appError = (
  statusCode: number,
  message: string,
  code?: string
): AppError => {
  const error: AppError = new Error(message)
  error.statusCode = statusCode
  error.code = code
  return error
}

/** Book a content draft for later. The route validates the body first. */
export const scheduleContentDraft = async (
  input: TScheduleContent,
  createdBy: string
): Promise<ScheduledDraft> => {
  const { runAt, ...generation } = input
  const row = await prisma.scheduledDraft.create({
    data: {
      kind: 'document',
      input: JSON.parse(JSON.stringify(generation)),
      runAt,
      createdBy,
    },
  })
  logger.info(
    { scheduleId: row.id, runAt: runAt.toISOString(), createdBy },
    'Content draft scheduled'
  )
  return row
}

export const listSchedules = async (query: TListSchedulesQuery) => {
  const where = query.status ? { status: query.status } : {}

  const [rows, total] = await Promise.all([
    prisma.scheduledDraft.findMany({
      where,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      orderBy: { runAt: 'asc' },
    }),
    prisma.scheduledDraft.count({ where }),
  ])

  return {
    schedules: rows,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  }
}

/** Withdraw a booking that has not run yet. */
export const cancelScheduledDraft = async (
  id: string
): Promise<ScheduledDraft> => {
  const row = await prisma.scheduledDraft.findUnique({ where: { id } })
  if (!row) {
    throw appError(404, 'Scheduled draft not found')
  }
  if (row.status !== 'pending') {
    throw appError(
      409,
      `Only a pending schedule can be canceled (status is ${row.status})`,
      'SCHEDULE_SETTLED'
    )
  }
  return prisma.scheduledDraft.update({
    where: { id },
    data: { status: 'canceled' },
  })
}

export interface DueRunSummary {
  due: number
  drafted: number
  failed: number
}

/**
 * Run every pending row whose time has come. One bad input must not stop the
 * rest, and a failure stays failed with the error recorded rather than
 * retrying forever on the next tick: the owner reschedules by hand once the
 * cause is fixed.
 */
export const runDueSchedules = async (): Promise<DueRunSummary> => {
  const due = await prisma.scheduledDraft.findMany({
    where: { status: 'pending', runAt: { lte: new Date() } },
    orderBy: { runAt: 'asc' },
  })

  const summary: DueRunSummary = { due: due.length, drafted: 0, failed: 0 }

  for (const row of due) {
    // Re-validate on the way out. The allowlist or the content rules may have
    // changed since booking, and running an input the immediate route would
    // now reject would produce a draft the reviewer cannot trust.
    const parsed = GenerateContentSchema.safeParse(row.input)
    if (!parsed.success) {
      await prisma.scheduledDraft.update({
        where: { id: row.id },
        data: {
          status: 'failed',
          error: 'Scheduled input no longer validates, booking kept as record',
        },
      })
      summary.failed += 1
      logger.warn(
        { scheduleId: row.id, issues: parsed.error.flatten() },
        'Scheduled input failed re-validation, marked failed'
      )
      continue
    }

    try {
      const draft = await generateContentDraft(parsed.data, row.createdBy)
      await prisma.scheduledDraft.update({
        where: { id: row.id },
        data: { status: 'done', draftId: draft.id },
      })
      summary.drafted += 1
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Generation failed'
      await prisma.scheduledDraft.update({
        where: { id: row.id },
        data: { status: 'failed', error: message.slice(0, 500) },
      })
      summary.failed += 1
      logger.error(error, `Scheduled draft ${row.id} failed`)
    }
  }

  if (summary.due > 0) {
    logger.info(summary, 'Scheduled draft run finished')
  }
  return summary
}
