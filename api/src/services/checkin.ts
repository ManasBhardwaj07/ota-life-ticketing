import { prisma } from "../lib/prisma.js";
import { NotFoundError, AlreadyCheckedInError, BadRequestError } from "../lib/errors.js";

export async function checkInTicket(code: string) {
  if (!code || typeof code !== "string" || code.trim().length === 0) {
    throw new BadRequestError("Ticket code must be a non-empty string");
  }

  const trimmedCode = code.trim();
  const checkInTimestamp = new Date();

  // R2 DEFENSE: Atomic conditional update on checkedInAt === null
  const stamped = await prisma.ticket.updateMany({
    where: {
      code: trimmedCode,
      checkedInAt: null,
    },
    data: {
      checkedInAt: checkInTimestamp,
    },
  });

  if (stamped.count === 1) {
    return {
      code: trimmedCode,
      checkedInAt: checkInTimestamp,
    };
  }

  // count 0: lost race OR unknown code. State is stable now — safe to read:
  const t = await prisma.ticket.findUnique({
    where: { code: trimmedCode },
  });

  if (!t) {
    throw new NotFoundError(`Ticket with code "${trimmedCode}" not found`);
  }

  // Throw 409 with the ORIGINAL stored timestamp that won the race
  throw new AlreadyCheckedInError(t.checkedInAt);
}
