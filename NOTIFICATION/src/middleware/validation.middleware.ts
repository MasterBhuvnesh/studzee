import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import logger from "@/utils/logger";

export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error: any) {
      logger.error({ error: error.errors }, "Validation error");
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }
  };
};
