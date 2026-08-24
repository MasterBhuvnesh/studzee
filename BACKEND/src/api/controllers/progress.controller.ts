import { NextFunction, Request, Response } from 'express'
import {
  gradeAndRecordAttempt,
  getMyProgress,
} from '@/services/progress.service'
import { TRecordAttempt } from '@/models/progress.validation'

/**
 * Grade and record a quiz attempt for the caller.
 *
 * The Clerk identity comes from the token, never from the body. The service
 * raises a 404 AppError when the content or its quiz is missing, which the
 * error handler renders in the same { message } shape as sibling controllers.
 */
export const recordAttempt = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.auth().userId
    const { contentId, responses } = req.body as TRecordAttempt

    const result = await gradeAndRecordAttempt(userId!, contentId, responses)

    return res.status(200).json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
}

/**
 * Tracker read side for the caller: points, level ladder position, streak,
 * badges and recent attempts.
 */
export const getMyProgressSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.auth().userId

    const result = await getMyProgress(userId!)

    return res.status(200).json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
}
