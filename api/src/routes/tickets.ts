import { Router, Request, Response, NextFunction } from "express";
import { validateUserId } from "../middleware/userId.js";
import { prisma } from "../lib/prisma.js";

const router = Router();

// GET /me/tickets (header X-User-Id) -> 200
// [{ code, createdAt, checkedInAt, event: { id, name, venue, date } }]
// Query is WHERE userId = <header> — scoped in SQL, never post-filtered (R4).
// Doubles as reconciliation read.
router.get("/", validateUserId, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tickets = await prisma.ticket.findMany({
      where: {
        userId: req.userId!,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        code: true,
        createdAt: true,
        checkedInAt: true,
        event: {
          select: {
            id: true,
            name: true,
            venue: true,
            date: true,
          },
        },
      },
    });

    res.status(200).json(tickets);
  } catch (error) {
    next(error);
  }
});

export default router;
