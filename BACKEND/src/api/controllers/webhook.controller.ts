import { Request, Response } from 'express'
import { Webhook } from 'svix'
import { config } from '@/config'
import { sendWelcomeEmail } from '@/services/email.service'
import logger from '@/utils/logger'

interface ClerkUserEvent {
  type: string
  data: {
    id: string
    email_addresses: Array<{ email_address: string; id: string }>
    first_name: string | null
    last_name: string | null
    username: string | null
  }
}

/**
 * Handle a Clerk webhook delivery.
 *
 * The route mounts express.raw ahead of the JSON body parser, so req.body is
 * the exact byte sequence Clerk signed. Verifying a re-serialized object would
 * be unsound: JSON.stringify does not reproduce the original key order,
 * whitespace or unicode escaping, so signatures would fail or pass by accident.
 *
 * The endpoint is public because Clerk sends no user token. The svix signature
 * is the only authentication, so an unset secret is a hard failure rather than
 * a skipped check.
 */
export const handleClerkWebhook = async (req: Request, res: Response) => {
  const secret = config.CLERK_WEBHOOK_SIGNING_SECRET

  if (!secret) {
    logger.error('CLERK_WEBHOOK_SIGNING_SECRET is not configured')
    return res.status(500).json({ message: 'Webhook secret not configured' })
  }

  const svixId = req.headers['svix-id'] as string | undefined
  const svixTimestamp = req.headers['svix-timestamp'] as string | undefined
  const svixSignature = req.headers['svix-signature'] as string | undefined

  if (!svixId || !svixTimestamp || !svixSignature) {
    logger.warn('Missing svix headers on webhook request')
    return res.status(400).json({ message: 'Missing required webhook headers' })
  }

  // express.raw leaves a Buffer here. Anything else means the route was wired
  // behind a body parser and the signature could not be trusted.
  if (!Buffer.isBuffer(req.body)) {
    logger.error('Webhook body was parsed before verification')
    return res.status(500).json({ message: 'Webhook route misconfigured' })
  }

  let event: ClerkUserEvent
  try {
    event = new Webhook(secret).verify(req.body.toString('utf8'), {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkUserEvent
  } catch (error) {
    logger.error(error, 'Webhook signature verification failed')
    return res.status(400).json({ message: 'Webhook verification failed' })
  }

  logger.info({ type: event.type, userId: event.data.id }, 'Clerk webhook received')

  if (event.type !== 'user.created') {
    return res.status(200).json({ message: `Ignored event: ${event.type}` })
  }

  const { id, email_addresses, first_name, username } = event.data
  const primaryEmail = email_addresses[0]?.email_address

  if (!primaryEmail) {
    logger.warn({ userId: id }, 'New user has no email address')
    return res.status(200).json({ message: 'No email address on the new user' })
  }

  const displayName =
    first_name || username || primaryEmail.split('@')[0] || 'there'

  const result = await sendWelcomeEmail(primaryEmail, displayName)

  if (!result.success) {
    logger.error(
      { userId: id, error: result.error },
      'Welcome email failed, acknowledging webhook anyway'
    )
  }

  // Always acknowledge. A non 2xx makes Clerk retry the delivery, which would
  // resend the welcome email rather than fix the mail transport.
  return res
    .status(200)
    .json({ message: 'Webhook processed', emailSent: result.success })
}
