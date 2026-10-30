import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function runRollbackAttack() {
  console.log("=== ATTACK A2: ROLLBACK SAFETY VERIFICATION ===");

  // 1. Read initial ticketsLeft
  const beforeEvent = await prisma.event.findUniqueOrThrow({ where: { id: 1 } });
  console.log("Initial ticketsLeft before transaction:", beforeEvent.ticketsLeft);

  // 2. Execute transaction with decrement followed by intentional create failure
  let transactionFailed = false;
  try {
    await prisma.$transaction(async (tx) => {
      // Step A: Decrement stock
      const reserved = await tx.event.updateMany({
        where: { id: 1 },
        data: { ticketsLeft: { decrement: 1 } },
      });
      console.log(`[Inside TX] Decremented event 1 ticketsLeft by 1. Count affected: ${reserved.count}`);

      // Step B: Intentionally violate database constraint or throw exception during ticket creation
      // Trying to insert ticket with duplicate primary key or throw intentional error
      throw new Error("SIMULATED_FAILURE_DURING_CREATEMANY");
    });
  } catch (err: any) {
    if (err.message === "SIMULATED_FAILURE_DURING_CREATEMANY") {
      transactionFailed = true;
      console.log("[Inside TX] Error thrown as intended: SIMULATED_FAILURE_DURING_CREATEMANY");
    } else {
      console.error("Unexpected error:", err);
    }
  }

  // 3. Query DB after rollback to assert ticketsLeft is completely unchanged
  const afterEvent = await prisma.event.findUniqueOrThrow({ where: { id: 1 } });
  console.log("Final ticketsLeft after rollback:", afterEvent.ticketsLeft);

  if (transactionFailed && afterEvent.ticketsLeft === beforeEvent.ticketsLeft) {
    console.log(">>> ATTACK A2 SUCCESS: ticketsLeft was completely rolled back! Invariant preserved.");
  } else {
    console.error(">>> ATTACK A2 FAILED: ticketsLeft changed after failure!");
    process.exit(1);
  }
}

runRollbackAttack()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
