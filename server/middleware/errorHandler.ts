import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: any;

  constructor(message: string, statusCode = 400, code = "BAD_REQUEST", details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      type: `https://api.ecommerce.com/errors/${err.code.toLowerCase()}`,
      title: err.message,
      status: err.statusCode,
      code: err.code,
      details: err.details || null,
      timestamp: new Date().toISOString(),
    });
  }

  if (err instanceof ZodError) {
    return res.status(422).json({
      type: "https://api.ecommerce.com/errors/validation-failed",
      title: "Input validation failed",
      status: 422,
      code: "VALIDATION_ERROR",
      details: err.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
      timestamp: new Date().toISOString(),
    });
  }

  console.error("Unhandled Internal Error:", err);

  return res.status(500).json({
    type: "https://api.ecommerce.com/errors/internal-server-error",
    title: "An unexpected internal error occurred",
    status: 500,
    code: "INTERNAL_SERVER_ERROR",
    timestamp: new Date().toISOString(),
  });
};
