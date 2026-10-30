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

    // Must be integer format (no decimals, no letters)
    if (!/^\d+$/.test(headerValue.trim())) {
      throw new UnauthorizedError("Invalid X-User-Id header format; integer required");
    }

    const userId = parseInt(headerValue.trim(), 10);
    if (isNaN(userId) || userId <= 0) {
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
