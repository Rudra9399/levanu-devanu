import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting full database wipe...");

  await prisma.paymentAllocation.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.workTransactionColor.deleteMany();
  await prisma.workTransaction.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.designNumberMaster.deleteMany();
  await prisma.colorMaster.deleteMany();
  await prisma.categoryMaster.deleteMany();
  await prisma.cuttingMaster.deleteMany();

  console.log("✅ Database is now completely clean and empty!");
}

main()
  .catch((e) => {
    console.error("Error wiping database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
