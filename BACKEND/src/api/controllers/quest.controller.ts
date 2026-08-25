import { NextFunction, Request, Response } from 'express'
import {
  completeQuest,
  createQuest,
  listActiveQuests,
  listAllQuests,
} from '@/services/quest.service'

/**
 * Quest controllers.
 *
 * The Clerk identity comes from the token, never from the body or params.
 * Service errors carry statusCode and code, which the error handler renders
 * in the same { message, code } shape as sibling controllers.
 */

/**
 * Live quests for the caller, each flagged with whether it was completed.
 */
export const listQuests = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.auth().userId
    const quests = await listActiveQuests(userId!)
    return res.status(200).json({ success: true, data: quests })
  } catch (error) {
    next(error)
  }
}

/**
 * Attempt one completion. A failed grade is a 200 with passed false; only
 * unknown quests and closed windows reach the error path as 404 and 409.
 */
export const submitQuestCompletion = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.auth().userId
    const result = await completeQuest(userId!, req.params.id, req.body)
    return res.status(200).json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
}

/**
 * Admin side create. Route middleware validates the body against
 * CreateQuestSchema before this runs.
 */
export const createQuestAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const quest = await createQuest(req.body)
    return res
      .status(201)
      .json({ success: true, message: 'Quest created', data: quest })
  } catch (error) {
    next(error)
  }
}

/** Full quest list for the admin console, newest first. */
export const listAllQuestsAdmin = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const quests = await listAllQuests()
    return res.status(200).json({ success: true, data: quests })
  } catch (error) {
    next(error)
  }
}
