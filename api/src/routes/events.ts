import { Router, Request, Response, NextFunction } from "express";
import { getUpcomingEvents } from "../services/events.js";
import { bookTickets } from "../services/booking.js";
import { validateUserId } from "../middleware/userId.js";
import { BadRequestError } from "../lib/errors.js";

export const BOOKING_MAX_QTY = 4;

const router = Router();

// GET /events -> 200 [{ id, name, venue, date, price, ticketsLeft }]
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const events = await getUpcomingEvents();
    res.status(200).json(events);
  } catch (error) {
    next(error);
  }
});

// POST /events/:id/book -> 201 { tickets: [...] }
router.post(
  "/:id/book",
  validateUserId,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rawEventId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (!rawEventId || !/^\d+$/.test(rawEventId)) {
        throw new BadRequestError("Invalid event ID format; integer required");
      }
      const eventId = parseInt(rawEventId, 10);
      if (isNaN(eventId) || eventId <= 0) {
        throw new BadRequestError("Invalid event ID");
      }

      // Route guard enforces business purchase limits before database transaction
      const { quantity } = req.body;
      if (
        typeof quantity !== "number" ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > BOOKING_MAX_QTY
      ) {
        throw new BadRequestError(`Quantity must be an integer between 1 and ${BOOKING_MAX_QTY}`);
      }

      const tickets = await bookTickets({
        eventId,
        userId: req.userId!,
        quantity,
      });

      res.status(201).json({ tickets });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
