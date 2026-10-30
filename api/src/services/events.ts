import { prisma } from "../lib/prisma.js";

export async function getUpcomingEvents() {
  const now = new Date();
  const events = await prisma.event.findMany({
    where: {
      date: {
        gte: now,
      },
    },
    orderBy: {
      date: "asc",
    },
    select: {
      id: true,
      name: true,
      venue: true,
      date: true,
      price: true,
      ticketsLeft: true,
    },
  });

  return events;
}
