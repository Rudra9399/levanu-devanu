import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log('🧹 Starting complete database wipe...');

  // Delete in reverse order of foreign key relationships
  const delAllocations = await prisma.paymentAllocation.deleteMany();
  console.log(`- Deleted ${delAllocations.count} payment allocations.`);

  const delPayments = await prisma.payment.deleteMany();
  console.log(`- Deleted ${delPayments.count} payments.`);

  const delColorRows = await prisma.workTransactionColor.deleteMany();
  console.log(`- Deleted ${delColorRows.count} work transaction color rows.`);

  const delWorkTransactions = await prisma.workTransaction.deleteMany();
  console.log(`- Deleted ${delWorkTransactions.count} work transactions.`);

  const delCustomers = await prisma.customer.deleteMany();
  console.log(`- Deleted ${delCustomers.count} workers/customers.`);

  const delDesignNumbers = await prisma.designNumberMaster.deleteMany();
  console.log(`- Deleted ${delDesignNumbers.count} design numbers.`);

  const delColors = await prisma.colorMaster.deleteMany();
  console.log(`- Deleted ${delColors.count} colors.`);

  const delCategories = await prisma.categoryMaster.deleteMany();
  console.log(`- Deleted ${delCategories.count} material categories.`);

  const delCuttingStyles = await prisma.cuttingMaster.deleteMany();
  console.log(`- Deleted ${delCuttingStyles.count} cutting styles.`);

  console.log('✨ All tables completely cleaned and reset to empty state!');
}

cleanDatabase()
  .catch((e) => {
    console.error('Error cleaning database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
