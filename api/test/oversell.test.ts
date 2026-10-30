import { prisma } from "../src/lib/prisma";
import { bookTickets } from "../src/services/booking";
import { SoldOutError } from "../src/lib/errors";

describe("Concurrency Oversell Defense (R1 & D1)", () => {
  let testEventId: number;

  beforeAll(async () => {
    // Create an isolated test event with exactly 1 ticket remaining
    const testDate = new Date();
    testDate.setDate(testDate.getDate() + 10);

    const event = await prisma.event.create({
      data: {
        name: "Jest Concurrency Test Event",
        venue: "Virtual Arena",
        date: testDate,
        price: 1000,
        capacity: 10,
        ticketsLeft: 1, // Only 1 ticket left
      },
    });

    testEventId = event.id;
  });

  afterAll(async () => {
    // Clean up created tickets and test event
    if (testEventId) {
      await prisma.ticket.deleteMany({ where: { eventId: testEventId } });
      await prisma.event.delete({ where: { id: testEventId } });
    }
    await prisma.$disconnect();
  });

  it("handles two parallel bookings for 1 remaining ticket: one wins, one gets SoldOutError (409), ticketsLeft reaches 0 and never -1", async () => {
    // Launch parallel booking requests simultaneously via Promise.allSettled
    const [resultA, resultB] = await Promise.allSettled([
      bookTickets({ eventId: testEventId, userId: 1, quantity: 1 }),
      bookTickets({ eventId: testEventId, userId: 2, quantity: 1 }),
    ]);

    const successes = [resultA, resultB].filter((r) => r.status === "fulfilled");
    const rejections = [resultA, resultB].filter((r) => r.status === "rejected");

    // Exactly one must succeed
    expect(successes).toHaveLength(1);
    // Exactly one must fail
    expect(rejections).toHaveLength(1);

    // Assert the rejection was SoldOutError (409)
    const rejectionReason = (rejections[0] as PromiseRejectedResult).reason;
    expect(rejectionReason).toBeInstanceOf(SoldOutError);
    expect(rejectionReason.statusCode).toBe(409);

    // Assert Database state (HTTP can lie; the DB cannot)
    const finalEvent = await prisma.event.findUniqueOrThrow({
      where: { id: testEventId },
    });
    expect(finalEvent.ticketsLeft).toBe(0);

    const ticketCount = await prisma.ticket.count({
      where: { eventId: testEventId },
    });
    expect(ticketCount).toBe(1);
  });
});
