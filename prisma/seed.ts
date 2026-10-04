import { PrismaClient, TransactionStatus, PaymentStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Devanu-Lenvanu database with new architecture & wireframe demo data...");

  // 1. Wipe all tables
  await prisma.paymentAllocation.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.workTransactionColor.deleteMany();
  await prisma.workTransaction.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.designNumberMaster.deleteMany();
  await prisma.cuttingMaster.deleteMany();
  await prisma.categoryMaster.deleteMany();
  await prisma.colorMaster.deleteMany();

  // 2. Seed Colors Master
  const colorsList = [
    "Black",
    "Red",
    "Blue",
    "Green",
    "Yellow",
    "White",
    "Maroon",
    "Orange",
    "Pink",
    "Golden",
    "Navy Blue",
  ];
  const colorMap = new Map<string, string>();
  for (const name of colorsList) {
    const c = await prisma.colorMaster.create({ data: { name } });
    colorMap.set(name, c.id);
  }
  console.log(`✓ Seeded ${colorsList.length} Colors in ColorMaster`);

  // 3. Seed Material Categories Master
  const categoriesList = ["Net", "Velvet", "Packing", "Bhagvan Assen Net", "Watwat"];
  const categoryMap = new Map<string, string>();
  for (const name of categoriesList) {
    const cat = await prisma.categoryMaster.create({ data: { name } });
    categoryMap.set(name, cat.id);
  }
  console.log(`✓ Seeded ${categoriesList.length} Categories in CategoryMaster`);

  // 4. Seed Cutting Styles Master
  const cuttingList = ["Katar Cutting", "Reniya Cutting", "Vinit Cutting"];
  const cuttingMap = new Map<string, string>();
  for (const name of cuttingList) {
    const cut = await prisma.cuttingMaster.create({ data: { name } });
    cuttingMap.set(name, cut.id);
  }
  console.log(`✓ Seeded ${cuttingList.length} Cutting Styles in CuttingMaster`);

  // 5. Seed Design Numbers Master (Design codes only)
  const designNumberList = [
    "D-1001",
    "D-1002",
    "D-1003",
    "D-1004",
    "D-1005",
    "D-1006",
    "D-1007",
  ];
  const designNumberMap = new Map<string, string>();
  for (const num of designNumberList) {
    const d = await prisma.designNumberMaster.create({ data: { designNumber: num } });
    designNumberMap.set(num, d.id);
  }
  console.log(`✓ Seeded ${designNumberList.length} Design Numbers in DesignNumberMaster`);

  // 6. Seed Workers (matching wireframe)
  const workersData = [
    { name: "Raj Patel", phoneNumber: "9876543210", address: "Surat" },
    { name: "Amit Shah", phoneNumber: "9876543211", address: "Surat" },
    { name: "Meena Ben", phoneNumber: "9876543212", address: "Pal, Surat" },
    { name: "Kiran Bhai", phoneNumber: "9876543213", address: "Udhna, Surat" },
    { name: "Suresh Bhai", phoneNumber: "9876543214", address: "Varachha, Surat" },
    { name: "Mitin Patel", phoneNumber: "9876543215", address: "Adajan, Surat" },
    { name: "Pooja Ben", phoneNumber: "9876543216", address: "Katargam, Surat" },
  ];
  const workerMap = new Map<string, string>();
  for (const w of workersData) {
    const created = await prisma.customer.create({ data: { ...w, isActive: true } });
    workerMap.set(w.name, created.id);
  }
  console.log(`✓ Seeded ${workersData.length} Workers in Customer`);

  // 7. Seed Sample Work Issues (matching wireframe)
  // Work Issue #1: Raj Patel, D-1002, Net, Katar Cutting (Oct 02, 2026) -> 2,700 pieces total (3 colors)
  const issueDate1 = new Date("2026-10-02T09:00:00Z");
  const tx1 = await prisma.workTransaction.create({
    data: {
      customerId: workerMap.get("Raj Patel")!,
      designNumberId: designNumberMap.get("D-1002")!,
      designNumberSnapshot: "D-1002",
      categoryId: categoryMap.get("Net")!,
      categorySnapshot: "Net",
      cuttingStyleId: cuttingMap.get("Katar Cutting")!,
      cuttingStyleSnapshot: "Katar Cutting",
      issueDate: issueDate1,
      totalGivenPieces: 2700,
      totalReturnedPieces: 2680,
      totalDamagedPieces: 20,
      totalAmount: 675.0,
      workStatus: TransactionStatus.COMPLETED,
      paymentStatus: PaymentStatus.PAID,
      notes: "Sample completed work order with 3 colors",
      colorRows: {
        create: [
          {
            colorId: colorMap.get("Black"),
            colorNameSnapshot: "Black",
            heads: 120,
            piecesPerHead: 10,
            givenPieces: 1200,
            returnedPieces: 1190,
            damagedPieces: 10,
            rate: 0.25,
            amount: 300.0,
          },
          {
            colorId: colorMap.get("Red"),
            colorNameSnapshot: "Red",
            heads: 100,
            piecesPerHead: 10,
            givenPieces: 1000,
            returnedPieces: 1000,
            damagedPieces: 0,
            rate: 0.25,
            amount: 250.0,
          },
          {
            colorId: colorMap.get("Green"),
            colorNameSnapshot: "Green",
            heads: 50,
            piecesPerHead: 10,
            givenPieces: 500,
            returnedPieces: 490,
            damagedPieces: 10,
            rate: 0.25,
            amount: 125.0,
          },
        ],
      },
    },
  });

  // Work Issue #2: Amit Shah, D-1005, Velvet, Reniya Cutting (Sep 28, 2026) -> 8,500 pcs (Pending)
  const issueDate2 = new Date("2026-09-28T10:00:00Z");
  const tx2 = await prisma.workTransaction.create({
    data: {
      customerId: workerMap.get("Amit Shah")!,
      designNumberId: designNumberMap.get("D-1005")!,
      designNumberSnapshot: "D-1005",
      categoryId: categoryMap.get("Velvet")!,
      categorySnapshot: "Velvet",
      cuttingStyleId: cuttingMap.get("Reniya Cutting")!,
      cuttingStyleSnapshot: "Reniya Cutting",
      issueDate: issueDate2,
      totalGivenPieces: 8500,
      totalReturnedPieces: 0,
      totalDamagedPieces: 0,
      totalAmount: 4250.0,
      workStatus: TransactionStatus.PENDING,
      paymentStatus: PaymentStatus.UNPAID,
      notes: "Pending cutting dispatch",
      colorRows: {
        create: [
          {
            colorId: colorMap.get("White"),
            colorNameSnapshot: "White",
            heads: 400,
            piecesPerHead: 10,
            givenPieces: 4000,
            returnedPieces: 0,
            damagedPieces: 0,
            rate: 0.5,
            amount: 2000.0,
          },
          {
            colorId: colorMap.get("Maroon"),
            colorNameSnapshot: "Maroon",
            heads: 450,
            piecesPerHead: 10,
            givenPieces: 4500,
            returnedPieces: 0,
            damagedPieces: 0,
            rate: 0.5,
            amount: 2250.0,
          },
        ],
      },
    },
  });

  // 8. Seed Sample Payment (matching wireframe)
  // Payment: Raj Patel, period 10 Aug - 10 Oct, ₹10,000 paid
  const payment1 = await prisma.payment.create({
    data: {
      customerId: workerMap.get("Raj Patel")!,
      fromDate: new Date("2026-08-10T00:00:00Z"),
      toDate: new Date("2026-10-10T23:59:59Z"),
      paymentDate: new Date("2026-10-12T11:00:00Z"),
      paymentAmount: 10000.0,
      notes: "Cash payment settled",
      allocations: {
        create: [
          {
            workTransactionId: tx1.id,
            allocatedAmount: 675.0,
          },
        ],
      },
    },
  });

  console.log("=========================================");
  console.log("✅ Milestone 1 Database Seeding COMPLETE!");
  console.log("=========================================");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
