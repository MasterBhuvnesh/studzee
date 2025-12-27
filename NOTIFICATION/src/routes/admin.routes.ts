import { Router } from 'express';

import { getAllUsers, getAllEmails } from '@/controllers/admin.controller';
import { sendEmail, getEmailLogs } from '@/controllers/email.controller';
import {
  sendPushNotification,
  getAllNotifications,
} from '@/controllers/notification.controller';
import {
  clerkAuthMiddleware,
  requireAuth,
  requireAdmin,
} from '@/middleware/clerk.middleware';
import { rateLimitMiddleware } from '@/middleware/rateLimit.middleware';
import { validateRequest } from '@/middleware/validation.middleware';
import { sendNotificationSchema, sendEmailSchema } from '@/utils/validation';

const router = Router();

// Apply auth middleware to all admin routes
router.use(clerkAuthMiddleware, requireAuth, requireAdmin);

/**
 * @route   POST /api/admin/notification/send
 * @desc    Send push notification to all or specific users
 * @access  Admin only
 */
router.post(
  '/notification/send',
  rateLimitMiddleware({ windowMs: 60000, max: 20 }), // 20 req/min
  validateRequest(sendNotificationSchema),
  sendPushNotification,
);

/**
 * @route   GET /api/admin/notifications
 * @desc    Get all sent notifications with pagination
 * @access  Admin only
 */
router.get(
  '/notifications',
  rateLimitMiddleware({ windowMs: 60000, max: 30 }),
  getAllNotifications,
);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with pagination
 * @access  Admin only
 */
router.get(
  '/users',
  rateLimitMiddleware({ windowMs: 60000, max: 30 }),
  getAllUsers,
);

/**
 * @route   GET /api/admin/emails
 * @desc    Get all user emails
 * @access  Admin only
 */
router.get(
  '/emails',
  rateLimitMiddleware({ windowMs: 60000, max: 30 }),
  getAllEmails,
);

/**
 * @route   POST /api/admin/email/send
 * @desc    Send email to specific users
 * @access  Admin only
 */
router.post(
  '/email/send',
  rateLimitMiddleware({ windowMs: 60000, max: 10 }), // 10 req/min
  validateRequest(sendEmailSchema),
  sendEmail,
);

/**
 * @route   GET /api/admin/email/logs
 * @desc    Get all email logs with pagination
 * @access  Admin only
 */
router.get(
  '/email/logs',
  rateLimitMiddleware({ windowMs: 60000, max: 30 }),
  getEmailLogs,
);

export default router;
