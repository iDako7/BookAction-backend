import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors.js";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (err instanceof AppError) {
    res
      .status(err.statusCode)
      .json({ error: { code: err.statusCode, message: err.message } });
    return;
  }
  console.error("Unhandled error:", err);
  res
    .status(500)
    .json({ error: { code: 500, message: "Internal server error" } });
}
