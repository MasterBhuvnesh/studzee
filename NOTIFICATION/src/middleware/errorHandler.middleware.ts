import { Request, Response, NextFunction } from "express";
import logger from "@/utils/logger";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Check if it's a JSON parsing error
  if (err instanceof SyntaxError && 'body' in err) {
    logger.error(
      {
        error: err.message,
        path: req.path,
        method: req.method,
      },
      "Invalid JSON in request body"
    );

    return res.status(400).json({
      success: false,
      message: "Invalid JSON format in request body",
      error: process.env.NODE_ENV === "development" 
        ? `JSON parsing failed: ${err.message}. Please check that property names are quoted and there are no trailing commas.` 
        : "Malformed JSON",
    });
  }

  logger.error(
    {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    },
    "Unhandled error"
  );

  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
};
