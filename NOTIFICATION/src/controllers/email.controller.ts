import { Request, Response } from 'express';

import { sendEmailWithAttachments } from '@/services/email.service';
import {
  saveEmailLog,
  getEmailLogs as fetchEmailLogs,
} from '@/services/notification.service';
import logger from '@/utils/logger';

export const sendEmail = async (req: Request, res: Response) => {
  try {
    const clerkId = req.auth().userId;
    const { emails, subject, title, body, footer, pdfUrls } = req.body;

    if (!clerkId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User ID not found',
      });
    }

    // Validate required fields
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one email recipient is required',
      });
    }

    if (!subject || !title || !body) {
      return res.status(400).json({
        success: false,
        message: 'Subject, title, and body are required fields',
      });
    }

    logger.info({ clerkId, emails, subject }, 'Sending email');

    const result = await sendEmailWithAttachments(
      emails,
      subject,
      title,
      body,
      footer, // Optional, will use default if not provided
      pdfUrls,
    );

    // Save email log
    await saveEmailLog({
      subject,
      message: body,
      pdfUrls: pdfUrls || [],
      sentBy: clerkId,
      sentTo: emails,
      status: result.success ? 'sent' : 'failed',
    });

    return res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      data: result,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Failed to send email');
    return res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message,
    });
  }
};

export const getEmailLogs = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const order = (req.query.order as 'asc' | 'desc') || 'desc';

    const logs = await fetchEmailLogs(page, limit, sortBy, order);

    return res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Failed to fetch email logs');
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch email logs',
      error: error.message,
    });
  }
};
