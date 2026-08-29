import { AiDraft, Prisma } from '@prisma/client'
import { prisma } from '@/config'
import { DocumentModel } from '@/models/document.model'
import {
  DraftKind,
  GeneratedDocumentSchema,
  GeneratedNotesSchema,
  GeneratedNotificationSchema,
  GeneratedQuizSchema,
  TListDraftsQuery,
} from '@/models/ai.validation'
import { CreateQuestSchema } from '@/models/quest.validation'
import { adminService } from '@/services/admin.service'
import { sendExpoNotification } from '@/services/expo.service'
import { saveNotification } from '@/services/notification.service'
import { createQuest } from '@/services/quest.service'
import { getAllUsersTokens, removeExpoTokens } from '@/services/user.service'
import { TDocument } from '@/types/document'
import { AppError } from '@/types/errors'
import logger from '@/utils/logger'

/**
 * DRAFT REVIEW
 *
 * The only place a generated payload becomes something a student can see.
 *
 * Approval never writes anything itself. Each kind dispatches to the service
 * function the matching admin route already uses, so generated content takes
 * exactly the same path as hand written content: the same validation, the same
 * cache invalidation, the same audit row. Adding a new write path here would
 * be the way to end up with generated content that skips a rule the manual
 * route enforces.
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

export const listDrafts = async (query: TListDraftsQuery) => {
  const where = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.kind ? { kind: query.kind } : {}),
  }

  const [drafts, total] = await Promise.all([
    prisma.aiDraft.findMany({
      where,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.aiDraft.count({ where }),
  ])

  return {
    drafts,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  }
}

export const getDraft = async (id: string): Promise<AiDraft> => {
  const draft = await prisma.aiDraft.findUnique({ where: { id } })
  if (!draft) {
    throw appError(404, 'Draft not found')
  }
  return draft
}

/**
 * Re-validate a payload after overrides are merged into it.
 *
 * An override is operator supplied and arrives as a loose record, so it gets
 * the same treatment the model's own output got. Without this an override
 * could put a shape into the payload that the generator would have rejected,
 * and it would fail at the write instead of at the review.
 *
 * Notification payloads are parsed with passthrough because they carry a
 * target alongside the copy, for the deep link the client cannot yet consume.
 */
const revalidate = (kind: DraftKind, payload: unknown): unknown => {
  const schemas = {
    document: GeneratedDocumentSchema,
    quiz: GeneratedQuizSchema,
    key_notes: GeneratedNotesSchema,
    quest: CreateQuestSchema,
    notification: GeneratedNotificationSchema.passthrough(),
  }

  const result = schemas[kind].safeParse(payload)
  if (!result.success) {
    throw appError(
      400,
      `The draft payload is not valid after overrides: ${result.error.issues
        .map((issue) => `${issue.path.join('.') || 'root'} ${issue.message}`)
        .join('; ')}`,
      'DRAFT_INVALID'
    )
  }
  return result.data
}

/**
 * Create the document.
 *
 * adminService.createDocument re-parses with DocumentSchema and invalidates
 * the caches, so an approved generated document takes exactly the path
 * POST /admin/documents takes. Nothing about the row says it was generated
 * once it lands; the AiDraft it came from is the record of that.
 */
const applyDocument = async (payload: unknown): Promise<string> => {
  const doc = await adminService.createDocument(payload as TDocument)
  return String(doc._id)
}

/**
 * Append generated questions to a document's quiz.
 *
 * Keys are reassigned rather than merged by name. The generator numbers from
 * q1 every time, so merging on key would silently overwrite the existing
 * questions instead of adding to them.
 */
const applyQuiz = async (draft: AiDraft, payload: unknown): Promise<string> => {
  if (!draft.sourceId) {
    throw appError(400, 'This quiz draft has no source document')
  }

  const { quiz } = payload as {
    quiz: Record<string, { que: string; ans: string; options: string[] }>
  }

  const doc = await DocumentModel.findById(draft.sourceId).lean()
  if (!doc) {
    throw appError(404, 'The document this draft was generated from is gone')
  }

  const existing = (doc.quiz ?? {}) as Record<string, unknown>
  const merged: Record<string, unknown> = { ...existing }

  let next = Object.keys(existing).length + 1
  for (const item of Object.values(quiz)) {
    merged[`q${next}`] = item
    next += 1
  }

  await adminService.updateDocument(draft.sourceId, { quiz: merged })
  return draft.sourceId
}

/**
 * Replace a document's summary and fold in the generated key notes.
 *
 * The summary is a single value and is replaced. Key notes are merged, with
 * the generated ones winning a heading collision, because approving notes
 * should not silently delete notes written by hand. Wholesale replacement is
 * an edit on the document itself.
 */
const applyNotes = async (
  draft: AiDraft,
  payload: unknown
): Promise<string> => {
  if (!draft.sourceId) {
    throw appError(400, 'This notes draft has no source document')
  }

  const { summary, key_notes } = payload as {
    summary: string
    key_notes: Record<string, string>
  }

  const doc = await DocumentModel.findById(draft.sourceId).lean()
  if (!doc) {
    throw appError(404, 'The document this draft was generated from is gone')
  }

  const existing = (doc.key_notes ?? {}) as Record<string, string>

  await adminService.updateDocument(draft.sourceId, {
    summary,
    key_notes: { ...existing, ...key_notes },
  })
  return draft.sourceId
}

/**
 * Create the quest.
 *
 * Quest.title is unique with no dedup inside createQuest, so a clash would
 * surface as a Prisma P2002 the operator cannot act on. Pre-checking mirrors
 * what the quest seeder already does and turns it into a 409 naming the clash,
 * which the owner resolves by re-approving with an overrides.title.
 */
const applyQuest = async (payload: unknown): Promise<string> => {
  const quest = payload as { title: string }

  const clash = await prisma.quest.findUnique({
    where: { title: quest.title },
    select: { id: true },
  })
  if (clash) {
    throw appError(
      409,
      `A quest titled "${quest.title}" already exists. Approve again with ` +
        'an overrides.title to give this one a different name.',
      'QUEST_TITLE_TAKEN'
    )
  }

  const created = await createQuest(payload)
  return created.id
}

/**
 * Send the drafted push to every registered device.
 *
 * This is the one apply path with an effect outside the database, and it is
 * why generated notification copy waits in the queue instead of being sent by
 * the job that drafts it. Approving is the send.
 *
 * The send and the audit row mirror what notification.controller.ts does,
 * including pruning tokens Expo reports as retired.
 */
const applyNotification = async (
  draft: AiDraft,
  payload: unknown,
  reviewedBy: string
): Promise<string> => {
  const { title, message } = payload as { title: string; message: string }

  const tokens = await getAllUsersTokens()
  if (tokens.length === 0) {
    throw appError(404, 'No registered devices found')
  }

  const result = await sendExpoNotification(tokens, title, message)

  if (result.invalidTokens.length > 0) {
    await removeExpoTokens(result.invalidTokens)
  }

  const record = await saveNotification({
    title,
    message,
    sentBy: reviewedBy,
    sentTo: [],
    sentToAll: true,
    status: result.success ? 'sent' : 'failed',
  })

  logger.info(
    {
      draftId: draft.id,
      targeted: tokens.length,
      sent: result.sent,
      failed: result.failed,
    },
    'Approved notification draft delivered'
  )

  return record.id
}

export interface ApproveResult {
  draft: AiDraft
  appliedId: string
}

/**
 * Approve and apply a draft.
 *
 * A failed apply leaves the row pending with the reason recorded rather than
 * marking it approved or rejected. A duplicate quest title, a deleted source
 * document and an unreachable Expo are all retryable once the cause is fixed,
 * and losing the generated payload to a transient failure would mean paying to
 * generate it again.
 */
export const approveDraft = async (
  id: string,
  reviewedBy: string,
  overrides?: Record<string, unknown>
): Promise<ApproveResult> => {
  const draft = await getDraft(id)

  if (draft.status !== 'pending') {
    throw appError(
      409,
      `This draft is already ${draft.status}`,
      'DRAFT_NOT_PENDING'
    )
  }

  const kind = draft.kind as DraftKind
  const merged = {
    ...(draft.payload as Record<string, unknown>),
    ...(overrides ?? {}),
  }
  const payload = revalidate(kind, merged)

  let appliedId: string
  try {
    switch (kind) {
      case 'document':
        appliedId = await applyDocument(payload)
        break
      case 'quiz':
        appliedId = await applyQuiz(draft, payload)
        break
      case 'key_notes':
        appliedId = await applyNotes(draft, payload)
        break
      case 'quest':
        appliedId = await applyQuest(payload)
        break
      case 'notification':
        appliedId = await applyNotification(draft, payload, reviewedBy)
        break
      default:
        throw appError(400, `Unknown draft kind: ${draft.kind}`)
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    await prisma.aiDraft.update({
      where: { id },
      data: { error: reason },
    })
    logger.error({ draftId: id, kind }, 'Applying an approved draft failed')
    throw error
  }

  const updated = await prisma.aiDraft.update({
    where: { id },
    data: {
      status: 'approved',
      reviewedBy,
      reviewedAt: new Date(),
      appliedId,
      error: null,
      // Overrides are folded back in so the stored row is what was actually
      // applied, not what the model first produced.
      payload: JSON.parse(JSON.stringify(payload)) as Prisma.InputJsonValue,
    },
  })

  logger.info({ draftId: id, kind, appliedId }, 'AI draft approved and applied')
  return { draft: updated, appliedId }
}

export const rejectDraft = async (
  id: string,
  reviewedBy: string,
  reason?: string
): Promise<AiDraft> => {
  const draft = await getDraft(id)

  if (draft.status !== 'pending') {
    throw appError(
      409,
      `This draft is already ${draft.status}`,
      'DRAFT_NOT_PENDING'
    )
  }

  const updated = await prisma.aiDraft.update({
    where: { id },
    data: {
      status: 'rejected',
      reviewedBy,
      reviewedAt: new Date(),
      error: reason ?? null,
    },
  })

  logger.info({ draftId: id, kind: draft.kind }, 'AI draft rejected')
  return updated
}
