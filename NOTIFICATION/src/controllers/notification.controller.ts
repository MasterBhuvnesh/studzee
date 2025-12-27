import { Request, Response } from "express";
import { sendExpoNotification } from "@/services/expo.service";
import {
  saveNotification,
  getNotifications,
} from "@/services/notification.service";
import { getUsersByEmails, getAllUsersTokens } from "@/services/user.service";
import logger from "@/utils/logger";

export const sendPushNotification = async (req: Request, res: Response) => {
  try {
    const clerkId = req.auth().userId;
    const { title, message, imageUrl, sendToAll, emails } = req.body;

    logger.info({ clerkId, sendToAll, emails }, "Sending push notification");

    let expoTokens: string[] = [];
    let recipientEmails: string[] = [];

    if (sendToAll) {
      const tokens = await getAllUsersTokens();
      expoTokens = tokens;
      recipientEmails = [];
    } else {
      if (!emails || emails.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Emails are required when sendToAll is false",
        });
      }
      const users = await getUsersByEmails(emails);
      expoTokens = users.flatMap((user) => user.expoTokens);
      recipientEmails = emails;
    }

    if (expoTokens.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No valid expo tokens found",
      });
    }

    // Send notification to Expo
    const result = await sendExpoNotification(
      expoTokens,
      title,
      message,
      imageUrl
    );

    // Save notification to database
    await saveNotification({
      title,
      message,
      imageUrl,
      sentBy: clerkId!,
      sentTo: recipientEmails,
      sentToAll: sendToAll,
      status: result.success ? "sent" : "failed",
    });

    return res.status(200).json({
      success: true,
      message: "Notification sent successfully",
      data: result,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Failed to send notification");
    return res.status(500).json({
      success: false,
      message: "Failed to send notification",
      error: error.message,
    });
  }
};

export const getAllNotifications = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const order = (req.query.order as "asc" | "desc") || "desc";

    const notifications = await getNotifications(page, limit, sortBy, order);

    return res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Failed to fetch notifications");
    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
};
