import { NextFunction, Request, Response } from 'express'
import { getUserEmails, getUsers } from '@/services/user.service'
import { TListQuery } from '@/models/notification.validation'

/**
 * Paginated list of registered users, for the admin console.
 */
export const listUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, limit } = res.locals.query as TListQuery
    const result = await getUsers(page, limit)
    return res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

/**
 * Every registered email address, used to populate the recipient picker when
 * composing a broadcast.
 */
export const listUserEmails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const emails = await getUserEmails()
    return res
      .status(200)
      .json({ data: emails, meta: { total: emails.length } })
  } catch (error) {
    next(error)
  }
}
