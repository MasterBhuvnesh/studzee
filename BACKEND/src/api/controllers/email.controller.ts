import { NextFunction, Request, Response } from 'express'
import { sendEmailWithAttachments } from '@/services/email.service'
import {
  getEmailLogs as fetchEmailLogs,
  resolveSortField,
  saveEmailLog,
} from '@/services/notification.service'
import { TListQuery, TSendEmail } from '@/models/notification.validation'

/**
 * Send a transactional email to a named set of recipients.
 *
 * Field validation is handled by the schema on the route, so this only
 * coordinates the send and the audit log.
 */
export const sendEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const clerkId = req.auth().userId
    const { emails, subject, title, body, banner, footer, pdfUrls } =
      req.body as TSendEmail

    const result = await sendEmailWithAttachments(
      emails,
      subject,
      title,
      body,
      banner,
      footer,
      pdfUrls
    )

    await saveEmailLog({
      subject,
      message: body,
      pdfUrls: pdfUrls ?? [],
      sentBy: clerkId!,
      sentTo: emails,
      status: result.success ? 'sent' : 'failed',
    })

    if (!result.success) {
      return res
        .status(502)
        .json({ message: 'Email delivery failed', error: result.error })
    }

    return res.status(200).json({
      message: 'Email sent',
      data: { recipients: emails.length, messageId: result.messageId },
    })
  } catch (error) {
    next(error)
  }
}

export const listEmailLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, limit, sortBy, order } = res.locals.query as TListQuery
    const result = await fetchEmailLogs(
      page,
      limit,
      resolveSortField(sortBy),
      order
    )
    return res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}
