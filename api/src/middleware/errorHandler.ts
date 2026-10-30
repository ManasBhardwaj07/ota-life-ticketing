import { Request, Response, NextFunction } from "express";
import { AppError } from "../lib/errors.js";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof AppError) {
    const errorBody: Record<string, unknown> = {
      code: err.code,
      message: err.message,
    };
    if (err.details) {
      Object.assign(errorBody, err.details);
    }
    return res.status(err.statusCode).json({ error: errorBody });
  }

  // Handle JSON parse errors from express.json()
  const isBadJson =
    (typeof err === "object" && err !== null && "type" in err && (err as { type: string }).type === "entity.parse.failed") ||
    (err instanceof SyntaxError && "body" in err);

  if (isBadJson) {
    return res.status(400).json({
      error: {
        code: "BAD_REQUEST",
        message: "Malformed JSON payload",
      },
    });
  }

  // Unexpected errors: logged server-side, generic 500 to client (Section 5 D5)
  console.error("Unexpected internal server error:", err);
  return res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected internal server error occurred",
    },
  });
}
