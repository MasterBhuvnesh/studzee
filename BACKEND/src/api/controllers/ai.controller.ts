import { NextFunction, Request, Response } from 'express'
import {
  TApproveDraft,
  TAskSupport,
  TGenerateContent,
  TGenerateNotes,
  TGenerateNotification,
  TGenerateQuest,
  TGenerateQuiz,
  TListDraftsQuery,
  TListSchedulesQuery,
  TRejectDraft,
  TScheduleContent,
  TUpdateAiConfig,
} from '@/models/ai.validation'
import {
  getAiConfig as readAiConfig,
  updateAiConfig as writeAiConfig,
} from '@/services/ai/config.service'
import {
  cancelScheduledDraft as cancelScheduledDraftService,
  listSchedules as listSchedulesService,
  scheduleContentDraft as scheduleContentDraftService,
} from '@/services/ai/schedule.service'
import {
  approveDraft,
  getDraft,
  listDrafts,
  rejectDraft,
} from '@/services/ai/draft.service'
import {
  generateContentDraft,
  generateNotesDraft,
  generateNotificationDraft,
  generateQuestDraft,
  generateQuizDraft,
} from '@/services/ai/generate.service'
import { reindexKnowledgeBase } from '@/services/ai/kb.service'
import { answerSupportQuestion } from '@/services/ai/support.service'

/**
 * AI CONTROLLER
 *
 * Thin by design, like the rest of the controllers here: pull the identity off
 * the request, hand the validated body to a service, shape the response. Every
 * decision worth reading lives in the services.
 *
 * Generation returns 201 because it creates a draft. It does not publish
 * anything, which is why none of these handlers touch content, quests or
 * devices directly.
 */

/**
 * The one generator that creates material rather than deriving it. It is admin
 * only for the same reason every other route on this router is: the whole
 * router sits behind requireAdmin.
 */
export const generateContent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const clerkId = req.auth().userId
    const draft = await generateContentDraft(
      req.body as TGenerateContent,
      clerkId!
    )
    return res
      .status(201)
      .json({ message: 'Document draft created', data: draft })
  } catch (error) {
    next(error)
  }
}

export const generateQuiz = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const clerkId = req.auth().userId
    const { contentId, count } = req.body as TGenerateQuiz
    const draft = await generateQuizDraft(contentId, count, clerkId!)
    return res.status(201).json({ message: 'Quiz draft created', data: draft })
  } catch (error) {
    next(error)
  }
}

export const generateNotes = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const clerkId = req.auth().userId
    const { contentId } = req.body as TGenerateNotes
    const draft = await generateNotesDraft(contentId, clerkId!)
    return res.status(201).json({ message: 'Notes draft created', data: draft })
  } catch (error) {
    next(error)
  }
}

export const generateQuest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const clerkId = req.auth().userId
    const draft = await generateQuestDraft(req.body as TGenerateQuest, clerkId!)
    return res.status(201).json({ message: 'Quest draft created', data: draft })
  } catch (error) {
    next(error)
  }
}

export const generateNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const clerkId = req.auth().userId
    const { kind, id } = req.body as TGenerateNotification
    const draft = await generateNotificationDraft(kind, id, clerkId!)
    return res
      .status(201)
      .json({ message: 'Notification draft created', data: draft })
  } catch (error) {
    next(error)
  }
}

export const listAiDrafts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = res.locals.query as TListDraftsQuery
    return res.status(200).json(await listDrafts(query))
  } catch (error) {
    next(error)
  }
}

export const getAiDraft = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const draft = await getDraft(req.params.id)
    return res.status(200).json({ data: draft })
  } catch (error) {
    next(error)
  }
}

export const approveAiDraft = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const clerkId = req.auth().userId
    const { overrides } = req.body as TApproveDraft
    const result = await approveDraft(req.params.id, clerkId!, overrides)
    return res.status(200).json({
      message: 'Draft approved and applied',
      data: { draft: result.draft, appliedId: result.appliedId },
    })
  } catch (error) {
    next(error)
  }
}

export const rejectAiDraft = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const clerkId = req.auth().userId
    const { reason } = req.body as TRejectDraft
    const draft = await rejectDraft(req.params.id, clerkId!, reason)
    return res.status(200).json({ message: 'Draft rejected', data: draft })
  } catch (error) {
    next(error)
  }
}

/**
 * The effective chat model, the allowlist, and where the value comes from.
 * Read by the admin Settings screen to render the model selector.
 */
export const getAiConfig = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    return res.status(200).json({ data: await readAiConfig() })
  } catch (error) {
    next(error)
  }
}

/**
 * Store the admin's chat model choice. The route validates the body against
 * the allowlist, so an unknown id is a 400 before anything is written.
 */
export const updateAiConfig = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const clerkId = req.auth().userId
    const { chatModel } = req.body as TUpdateAiConfig
    const row = await writeAiConfig(chatModel, clerkId!)
    return res.status(200).json({ message: 'Chat model updated', data: row })
  } catch (error) {
    next(error)
  }
}

/**
 * Book a whole document draft for a future time. Returns 201 like the
 * immediate generator, because it creates a row, but nothing is generated
 * until the per minute job picks it up.
 */
export const scheduleContent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const clerkId = req.auth().userId
    const row = await scheduleContentDraftService(
      req.body as TScheduleContent,
      clerkId!
    )
    return res
      .status(201)
      .json({ message: 'Content draft scheduled', data: row })
  } catch (error) {
    next(error)
  }
}

export const listSchedules = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = res.locals.query as TListSchedulesQuery
    return res.status(200).json(await listSchedulesService(query))
  } catch (error) {
    next(error)
  }
}

/** Withdraw a booking that has not run yet. */
export const cancelSchedule = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const row = await cancelScheduledDraftService(req.params.id)
    return res
      .status(200)
      .json({ message: 'Scheduled draft canceled', data: row })
  } catch (error) {
    next(error)
  }
}

export const reindexKb = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await reindexKnowledgeBase()
    return res
      .status(200)
      .json({ message: 'Knowledge base reindexed', data: result })
  } catch (error) {
    next(error)
  }
}

/**
 * The support agent answers as the caller, and the Clerk identity comes from
 * the token rather than the body: the quota is per account, so a body supplied
 * id would let one caller spend another's allowance.
 */
export const askSupport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const clerkId = req.auth().userId
    const answer = await answerSupportQuestion(
      clerkId!,
      req.body as TAskSupport
    )
    return res.status(200).json({ data: answer })
  } catch (error) {
    next(error)
  }
}
