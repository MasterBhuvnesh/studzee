import { Router } from 'express'
import * as AdminController from '@/api/controllers/admin.controller'
import * as AiController from '@/api/controllers/ai.controller'
import * as EmailController from '@/api/controllers/email.controller'
import * as NotificationController from '@/api/controllers/notification.controller'
import * as QuestController from '@/api/controllers/quest.controller'
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
import {
  ApproveDraftSchema,
  GenerateContentSchema,
  GenerateNotesSchema,
  GenerateNotificationSchema,
  GenerateQuestSchema,
  GenerateQuizSchema,
  ListDraftsQuerySchema,
  RejectDraftSchema,
} from '@/models/ai.validation'
import { CreateQuestSchema } from '@/models/quest.validation'

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

// --- Quests ---

/**
 * @route POST /admin/quests
 * @description Create a limited time quest. Graded types carry their
 *              questions in payload; read_blog carries a contentId.
 */
router.post(
  '/quests',
  rateLimitMiddleware({ windowMs: 60_000, max: 20 }),
  validateBody(CreateQuestSchema),
  QuestController.createQuestAdmin
)

/**
 * @route GET /admin/quests
 * @description Every quest, newest first, including expired and withdrawn ones.
 */
router.get(
  '/quests',
  rateLimitMiddleware({ windowMs: 60_000, max: 30 }),
  QuestController.listAllQuestsAdmin
)

// --- AI generation and draft review ---
//
// Generation is limited at the same budget as sending email, the lowest in the
// service. A model call is the most expensive thing an admin can trigger, and
// it blocks the request for as long as the model takes.
//
// Nothing in this block publishes. Every generate route ends at a pending
// draft, and approving one is what applies it.

const generateLimit = () => rateLimitMiddleware({ windowMs: 60_000, max: 10 })

/**
 * @route POST /admin/ai/generate/content
 * @description Draft a whole study document from a title, a topic and an
 * optional brief. Three model calls deep, so it is slow even by the standards
 * of this section.
 */
router.post(
  '/ai/generate/content',
  generateLimit(),
  validateBody(GenerateContentSchema),
  AiController.generateContent
)

/**
 * @route POST /admin/ai/generate/quiz
 * @description Draft quiz questions from an existing document.
 */
router.post(
  '/ai/generate/quiz',
  generateLimit(),
  validateBody(GenerateQuizSchema),
  AiController.generateQuiz
)

/**
 * @route POST /admin/ai/generate/notes
 * @description Draft a summary and key notes for an existing document.
 */
router.post(
  '/ai/generate/notes',
  generateLimit(),
  validateBody(GenerateNotesSchema),
  AiController.generateNotes
)

/**
 * @route POST /admin/ai/generate/quest
 * @description Draft a quest from a document. The model writes the title,
 *              description and questions; the type, gems, window and pass mark
 *              come from the request.
 */
router.post(
  '/ai/generate/quest',
  generateLimit(),
  validateBody(GenerateQuestSchema),
  AiController.generateQuest
)

/**
 * @route POST /admin/ai/generate/notification
 * @description Draft push copy for a document or a quest. Drafting never
 *              sends; approving the draft does.
 */
router.post(
  '/ai/generate/notification',
  generateLimit(),
  validateBody(GenerateNotificationSchema),
  AiController.generateNotification
)

/**
 * @route GET /admin/ai/drafts
 * @description Paginated drafts, filterable by status and kind.
 */
router.get(
  '/ai/drafts',
  rateLimitMiddleware({ windowMs: 60_000, max: 30 }),
  validateQuery(ListDraftsQuerySchema),
  AiController.listAiDrafts
)

/**
 * @route GET /admin/ai/drafts/:id
 * @description One draft with its full payload.
 */
router.get(
  '/ai/drafts/:id',
  rateLimitMiddleware({ windowMs: 60_000, max: 30 }),
  AiController.getAiDraft
)

/**
 * @route POST /admin/ai/drafts/:id/approve
 * @description Apply a pending draft through the same service the manual admin
 *              route uses. An optional overrides object is merged over the
 *              payload first and re-validated.
 */
router.post(
  '/ai/drafts/:id/approve',
  rateLimitMiddleware({ windowMs: 60_000, max: 20 }),
  validateBody(ApproveDraftSchema),
  AiController.approveAiDraft
)

/**
 * @route POST /admin/ai/drafts/:id/reject
 * @description Mark a pending draft rejected, with an optional reason.
 */
router.post(
  '/ai/drafts/:id/reject',
  rateLimitMiddleware({ windowMs: 60_000, max: 20 }),
  validateBody(RejectDraftSchema),
  AiController.rejectAiDraft
)

/**
 * @route POST /admin/ai/kb/reindex
 * @description Rebuild the support knowledge base. Embeds every chunk, so it
 *              is limited far harder than the listings.
 */
router.post(
  '/ai/kb/reindex',
  rateLimitMiddleware({ windowMs: 60_000, max: 2 }),
  AiController.reindexKb
)

export default router
