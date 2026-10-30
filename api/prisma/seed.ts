import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.ticket.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.user.deleteMany({});

  // Reset auto-increment
  await prisma.$executeRawUnsafe(`ALTER TABLE Ticket AUTO_INCREMENT = 1;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE Event AUTO_INCREMENT = 1;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE User AUTO_INCREMENT = 1;`);

  // Create 3 users
  const user1 = await prisma.user.create({
    data: { id: 1, name: "Naruto" },
  });
  const user2 = await prisma.user.create({
    data: { id: 2, name: "Ichigo" },
  });
  const user3 = await prisma.user.create({
    data: { id: 3, name: "Luffy" },
  });

  // Create 1 event with ticketsLeft = EXACTLY 2, capacity >= 2
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);

  const event = await prisma.event.create({
    data: {
      id: 1,
      name: "OTA TOKYO Fan Fest",
      venue: "Tokyo Dome City Hall",
      date: futureDate,
      price: new Prisma.Decimal("4500.00"),
      capacity: 100,
      ticketsLeft: 2,
    },
  });

  console.log("Seeded successfully:", {
    users: [user1.name, user2.name, user3.name],
    event: {
      id: event.id,
      name: event.name,
      capacity: event.capacity,
      ticketsLeft: event.ticketsLeft,
    },
  });
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
