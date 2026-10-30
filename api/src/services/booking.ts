import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { generateTicketCode } from "../lib/ticketCode.js";
import { NotFoundError, SoldOutError, AppError } from "../lib/errors.js";

export interface BookTicketsParams {
  eventId: number;
  userId: number;
  quantity: number;
}

export async function bookTickets({ eventId, userId, quantity }: BookTicketsParams) {
  return await prisma.$transaction(async (tx) => {
    // 1. Verify event exists
    const event = await tx.event.findUnique({
      where: { id: eventId },
    });
    if (!event) {
      throw new NotFoundError(`Event with id ${eventId} not found`);
    }

    // 2. R1 DEFENSE: Conditional atomic decrement in single statement under InnoDB row lock
    const reserved = await tx.event.updateMany({
      where: {
        id: eventId,
        ticketsLeft: { gte: quantity },
      },
      data: {
        ticketsLeft: { decrement: quantity },
      },
    });

    if (reserved.count === 0) {
      throw new SoldOutError("Insufficient tickets remaining for this event");
    }

    // 3. R3: Generate random codes; on P2002 collision from createMany, regenerate and retry (max 3)
    let ticketsToInsert: { code: string; userId: number; eventId: number }[] = [];
    let attempts = 0;
    const maxRetries = 3;

    while (attempts < maxRetries) {
      try {
        ticketsToInsert = Array.from({ length: quantity }, () => ({
          code: generateTicketCode(),
          userId,
          eventId,
        }));

        await tx.ticket.createMany({
          data: ticketsToInsert,
        });

        break;
      } catch (err: any) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
          attempts++;
          if (attempts >= maxRetries) {
            throw new AppError(500, "CODE_COLLISION", "Failed to generate unique ticket codes after retries");
          }
        } else {
          throw err;
        }
      }
    }

    // Retrieve committed tickets with event info
    const createdTickets = await tx.ticket.findMany({
      where: {
        code: { in: ticketsToInsert.map((t) => t.code) },
      },
      select: {
        code: true,
        createdAt: true,
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

    return createdTickets;
  });
}
