import { NextFunction, Request, Response } from 'express'
import { sendExpoNotification } from '@/services/expo.service'
import {
  getNotifications,
  resolveSortField,
  saveNotification,
} from '@/services/notification.service'
import {
  getAllUsersTokens,
  getUsersByEmails,
  registerOrUpdateUser,
  removeExpoTokens,
} from '@/services/user.service'
import { TListQuery, TSendNotification } from '@/models/notification.validation'
import logger from '@/utils/logger'

/**
 * Register the caller's device for push, or attach a new token to an existing
 * registration. The Clerk identity comes from the token, never from the body.
 */
export const registerDevice = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const clerkId = req.auth().userId
    const { email, expoToken } = req.body as {
      email: string
      expoToken: string
    }

    const user = await registerOrUpdateUser(clerkId!, email, expoToken)
    logger.info({ clerkId }, 'Device registered for push')

    return res.status(200).json({
      message: 'Device registered successfully',
      data: { id: user.id, email: user.email, devices: user.expoTokens.length },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Broadcast a push notification, either to every registered device or to the
 * devices belonging to a named set of users.
 *
 * Tokens Expo reports as retired are pruned immediately, so a dead device is
 * not counted as a recipient on the next broadcast.
 */
export const sendPushNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const clerkId = req.auth().userId
    const { title, message, imageUrl, sendToAll, emails } =
      req.body as TSendNotification

    const recipientEmails = sendToAll ? [] : (emails ?? [])
    const expoTokens = sendToAll
      ? await getAllUsersTokens()
      : (await getUsersByEmails(recipientEmails)).flatMap(
          (user) => user.expoTokens
        )

    if (expoTokens.length === 0) {
      return res.status(404).json({ message: 'No registered devices found' })
    }

    const result = await sendExpoNotification(
      expoTokens,
      title,
      message,
      imageUrl
    )

    if (result.invalidTokens.length > 0) {
      await removeExpoTokens(result.invalidTokens)
    }

    await saveNotification({
      title,
      message,
      imageUrl,
      sentBy: clerkId!,
      sentTo: recipientEmails,
      sentToAll: sendToAll,
      status: result.success ? 'sent' : 'failed',
    })

    // A partial failure still delivered to some devices, so report 207 rather
    // than pretending the broadcast fully succeeded.
    return res.status(result.success ? 200 : 207).json({
      message: result.success
        ? 'Notification sent'
        : 'Notification partially delivered',
      data: {
        targeted: expoTokens.length,
        sent: result.sent,
        failed: result.failed,
        prunedTokens: result.invalidTokens.length,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const listNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, limit, sortBy, order } = res.locals.query as TListQuery
    const result = await getNotifications(
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
