import { Request, Response } from "express";
import { registerOrUpdateUser } from "@/services/user.service";
import logger from "@/utils/logger";

export const registerUser = async (req: Request, res: Response) => {
  try {
    const clerkId = req.auth().userId;
    const { email, expoToken } = req.body;

    logger.info({ clerkId, email }, "User registration attempt");

    const user = await registerOrUpdateUser(clerkId!, email, expoToken);

    return res.status(200).json({
      success: true,
      message: "User registered/updated successfully",
      data: user,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "User registration failed");
    return res.status(500).json({
      success: false,
      message: "Failed to register user",
      error: error.message,
    });
  }
};
