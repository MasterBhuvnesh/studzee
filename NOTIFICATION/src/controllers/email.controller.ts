import { Request, Response } from "express";
import { sendEmailWithAttachments } from "@/services/email.service";
import {
  saveEmailLog,
  getEmailLogs as fetchEmailLogs,
} from "@/services/notification.service";
import logger from "@/utils/logger";

export const sendEmail = async (req: Request, res: Response) => {
  try {
    const clerkId = req.auth().userId;
    const { emails, subject, message, pdfUrls } = req.body;

    if (!clerkId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID not found",
      });
    }

    logger.info({ clerkId, emails }, "Sending email");

    const result = await sendEmailWithAttachments(
      emails,
      subject,
      message,
      pdfUrls
    );

    // Save email log
    await saveEmailLog({
      subject,
      message,
      pdfUrls: pdfUrls || [],
      sentBy: clerkId,
      sentTo: emails,
      status: result.success ? "sent" : "failed",
    });

    return res.status(200).json({
      success: true,
      message: "Email sent successfully",
      data: result,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Failed to send email");
    return res.status(500).json({
      success: false,
      message: "Failed to send email",
      error: error.message,
    });
  }
};

export const getEmailLogs = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const order = (req.query.order as "asc" | "desc") || "desc";

    const logs = await fetchEmailLogs(page, limit, sortBy, order);

    return res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Failed to fetch email logs");
    return res.status(500).json({
      success: false,
      message: "Failed to fetch email logs",
      error: error.message,
    });
  }
};
