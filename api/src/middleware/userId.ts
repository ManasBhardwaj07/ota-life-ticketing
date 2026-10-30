import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

export async function validateUserId(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const headerValue = req.headers["x-user-id"];
    if (!headerValue || typeof headerValue !== "string") {
      throw new UnauthorizedError("Missing X-User-Id header");
    }

    const trimmed = headerValue.trim();
    // Rejects decimals ("1.5"), alphanumeric ("2abc"), and empty strings
    if (!/^\d+$/.test(trimmed)) {
      throw new UnauthorizedError("Invalid X-User-Id header format; integer required");
    }

    const userId = Number(trimmed);
    if (!Number.isInteger(userId) || !Number.isSafeInteger(userId) || userId <= 0) {
      throw new UnauthorizedError("Invalid X-User-Id header value");
    }

    // Verify existence in DB (R4 / Traceability Spine Row 9: missing/abc/999 -> 401)
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedError(`User with id ${userId} not found`);
    }

    req.userId = userId;
    next();
  } catch (error) {
    next(error);
  }
}
