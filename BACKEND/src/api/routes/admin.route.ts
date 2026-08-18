import { Router } from 'express'
import * as AdminController from '@/api/controllers/admin.controller'
import * as EmailController from '@/api/controllers/email.controller'
import * as NotificationController from '@/api/controllers/notification.controller'
import * as UploadController from '@/api/controllers/upload.controller'
import * as UserController from '@/api/controllers/user.controller'
import {
  clerkAuthMiddleware,
  requireAdmin,
  requireAuth,
} from '@/middleware/auth'
import { rateLimitMiddleware } from '@/middleware/rateLimit'
import { uploadImage, uploadPdf } from '@/middleware/upload'
import { validateBody, validateQuery } from '@/middleware/validation'
import {
  ListQuerySchema,
  SendEmailSchema,
  SendNotificationSchema,
} from '@/models/notification.validation'

const router = Router()

// Every route below requires an authenticated Clerk user with the admin role.
router.use(clerkAuthMiddleware, requireAuth, requireAdmin)

// --- Documents ---

/**
 * @route POST /admin/documents
 * @description Create a new document.
 */
router.post('/documents', AdminController.createDocument)

/**
 * @route PUT /admin/documents/:id
 * @description Update a document by its ID.
 */
router.put('/documents/:id', AdminController.updateDocument)

/**
 * @route DELETE /admin/documents/:id
 * @description Delete a document by its ID.
 */
router.delete('/documents/:id', AdminController.deleteDocument)

/**
 * @route POST /admin/documents/:id/upload-image
 * @description Upload the cover image for a document.
 */
router.post(
  '/documents/:id/upload-image',
  uploadImage,
  UploadController.uploadDocumentImage
)

/**
 * @route POST /admin/documents/:id/upload-pdf
 * @description Attach a PDF to a document.
 */
router.post(
  '/documents/:id/upload-pdf',
  uploadPdf,
  UploadController.uploadDocumentPdf
)

// --- Push notifications ---

/**
 * @route POST /admin/notifications/send
 * @description Broadcast a push notification to all users or to named users.
 */
router.post(
  '/notifications/send',
  rateLimitMiddleware({ windowMs: 60_000, max: 20 }),
  validateBody(SendNotificationSchema),
  NotificationController.sendPushNotification
)

/**
 * @route GET /admin/notifications
 * @description Paginated history of sent notifications.
 */
router.get(
  '/notifications',
  rateLimitMiddleware({ windowMs: 60_000, max: 30 }),
  validateQuery(ListQuerySchema),
  NotificationController.listNotifications
)

// --- Email ---

/**
 * @route POST /admin/emails/send
 * @description Send a transactional email, optionally with PDF attachments.
 */
router.post(
  '/emails/send',
  rateLimitMiddleware({ windowMs: 60_000, max: 10 }),
  validateBody(SendEmailSchema),
  EmailController.sendEmail
)

/**
 * @route GET /admin/emails/logs
 * @description Paginated history of sent emails.
 */
router.get(
  '/emails/logs',
  rateLimitMiddleware({ windowMs: 60_000, max: 30 }),
  validateQuery(ListQuerySchema),
  EmailController.listEmailLogs
)

// --- Users ---

/**
 * @route GET /admin/users
 * @description Paginated list of registered users.
 */
router.get(
  '/users',
  rateLimitMiddleware({ windowMs: 60_000, max: 30 }),
  validateQuery(ListQuerySchema),
  UserController.listUsers
)

/**
 * @route GET /admin/users/emails
 * @description Every registered email address, for the recipient picker.
 */
router.get(
  '/users/emails',
  rateLimitMiddleware({ windowMs: 60_000, max: 30 }),
  UserController.listUserEmails
)

export default router
