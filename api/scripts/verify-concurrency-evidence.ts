import { prisma } from "../src/lib/prisma.js";
import http from "http";

function postRequest(url: string, headers: Record<string, string>, body: any): Promise<{ statusCode: number; body: any }> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const postData = JSON.stringify(body);
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
          ...headers,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve({ statusCode: res.statusCode || 0, body: JSON.parse(data) });
          } catch {
            resolve({ statusCode: res.statusCode || 0, body: data });
          }
        });
      }
    );
    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

async function run() {
  console.log("=== STEP 1: CLEAN SEED (ticketsLeft = 2) ===");
  await prisma.ticket.deleteMany({});
  await prisma.event.update({
    where: { id: 1 },
    data: { ticketsLeft: 2 },
  });

  const initialEvent = await prisma.event.findUniqueOrThrow({ where: { id: 1 } });
  console.log("Initial Event State in DB:", {
    id: initialEvent.id,
    name: initialEvent.name,
    capacity: initialEvent.capacity,
    ticketsLeft: initialEvent.ticketsLeft,
  });

  console.log("\n=== STEP 2: BOOK 1 TICKET AS USER 1 (NARUTO) -> ticketsLeft: 1 ===");
  const setupBooking = await postRequest("http://127.0.0.1:3000/events/1/book", { "X-User-Id": "1" }, { quantity: 1 });
  console.log("Setup Booking HTTP Status:", setupBooking.statusCode);
  const ticket1Code = setupBooking.body.tickets[0].code;
  console.log("Ticket 1 Code:", ticket1Code);

  const midEvent = await prisma.event.findUniqueOrThrow({ where: { id: 1 } });
  console.log("Mid Event ticketsLeft in DB:", midEvent.ticketsLeft);

  console.log("\n=== STEP 3: ATTACK A1 — TWO PARALLEL OVERSELL REQUESTS (ICHIGO vs LUFFY) ===");
  // Fire both simultaneously at the exact same millisecond
  const [resIchigo, resLuffy] = await Promise.all([
    postRequest("http://127.0.0.1:3000/events/1/book", { "X-User-Id": "2" }, { quantity: 1 }),
    postRequest("http://127.0.0.1:3000/events/1/book", { "X-User-Id": "3" }, { quantity: 1 }),
  ]);

  console.log("Ichigo HTTP Result:", resIchigo.statusCode, JSON.stringify(resIchigo.body));
  console.log("Luffy HTTP Result:", resLuffy.statusCode, JSON.stringify(resLuffy.body));

  console.log("\n=== STEP 4: RAW DATABASE ASSERTIONS POST-ATTACK A1 (BEFORE ANY RESEED) ===");
  const postAttackEvent = await prisma.event.findUniqueOrThrow({ where: { id: 1 } });
  const totalTicketsInDb = await prisma.ticket.count({ where: { eventId: 1 } });
  const allTickets = await prisma.ticket.findMany({
    where: { eventId: 1 },
    select: { id: true, code: true, userId: true, createdAt: true, checkedInAt: true },
  });

  console.log("DB ASSERTION 1 - ticketsLeft:", postAttackEvent.ticketsLeft, "(MUST BE EXACTLY 0, NEVER -1)");
  console.log("DB ASSERTION 2 - total tickets created in DB:", totalTicketsInDb, "(MUST BE EXACTLY 2, NEVER 3)");
  console.table(allTickets);

  console.log("\n=== STEP 5: ATTACK A4 — TWO PARALLEL CHECK-INS FOR TICKET 1 ===");
  const [checkinA, checkinB] = await Promise.all([
    postRequest("http://127.0.0.1:3000/checkins", {}, { code: ticket1Code }),
    postRequest("http://127.0.0.1:3000/checkins", {}, { code: ticket1Code }),
  ]);

  console.log("Check-in Request A:", checkinA.statusCode, JSON.stringify(checkinA.body));
  console.log("Check-in Request B:", checkinB.statusCode, JSON.stringify(checkinB.body));

  console.log("\n=== STEP 6: RAW DATABASE ASSERTIONS POST-ATTACK A4 ===");
  const ticketAfterCheckin = await prisma.ticket.findUniqueOrThrow({
    where: { code: ticket1Code },
  });
  console.log("DB Ticket checkedInAt:", ticketAfterCheckin.checkedInAt?.toISOString());

  const winnerTimestamp = checkinA.statusCode === 200 ? checkinA.body.checkedInAt : checkinB.body.checkedInAt;
  const loser409Body = checkinA.statusCode === 409 ? checkinA.body : checkinB.body;

  console.log("Winner 200 returned timestamp:", winnerTimestamp);
  console.log("Loser 409 returned checkedInAt:", loser409Body.error.checkedInAt);
  console.log("Byte-identical comparison (Winner vs Loser):", winnerTimestamp === loser409Body.error.checkedInAt);
  console.log("Byte-identical comparison (Loser vs DB):", loser409Body.error.checkedInAt === ticketAfterCheckin.checkedInAt?.toISOString());

  console.log("\n=== STEP 7: RESTORE PRISTINE SEED STATE ===");
  await prisma.ticket.deleteMany({});
  await prisma.event.update({
    where: { id: 1 },
    data: { ticketsLeft: 2 },
  });
  console.log("Database reset to pristine state: 1 event, ticketsLeft = 2, 0 tickets.");

  await prisma.$disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
