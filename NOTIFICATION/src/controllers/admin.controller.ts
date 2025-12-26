import { Request, Response } from "express";
import { getUsers, getUserEmails } from "@/services/user.service";
import logger from "@/utils/logger";

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const users = await getUsers(page, limit);

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Failed to fetch users");
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

export const getAllEmails = async (_req: Request, res: Response) => {
  try {
    const emails = await getUserEmails();

    return res.status(200).json({
      success: true,
      data: emails,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Failed to fetch emails");
    return res.status(500).json({
      success: false,
      message: "Failed to fetch emails",
      error: error.message,
    });
  }
};
