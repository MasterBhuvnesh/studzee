import express, { Router } from 'express'
import { handleClerkWebhook } from '@/api/controllers/webhook.controller'

const router = Router()

/**
 * @route POST /webhooks/clerk
 * @description Handle Clerk webhook events. Currently only user.created, which
 *              triggers the welcome email.
 * @access Public, authenticated by svix signature rather than a user token.
 *
 * express.raw keeps the body as the exact bytes Clerk signed. This router is
 * mounted ahead of the global JSON parser in src/index.ts for the same reason.
 */
router.post(
  '/clerk',
  express.raw({ type: 'application/json' }),
  handleClerkWebhook
)

export default router
