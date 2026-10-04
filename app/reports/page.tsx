import { prisma } from "@/lib/prisma";
import { ReportsManager } from "@/components/reports/ReportsManager";
import { serializeToPlainObject } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Reports & Financial Hisab | Devanu-Lenvanu",
  description: "Multi-dimensional reports for monthly hisab, worker analysis, design breakdown, and payment settlements.",
};

export default async function ReportsPage() {
  const [transactions, payments, workers] = await Promise.all([
    prisma.workTransaction.findMany({
      orderBy: { issueDate: "desc" },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            address: true,
          },
        },
        colorRows: {
          orderBy: { createdAt: "asc" },
        },
        paymentAllocations: {
          select: {
            allocatedAmount: true,
          },
        },
      },
    }),
    prisma.payment.findMany({
      orderBy: { paymentDate: "desc" },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
          },
        },
        allocations: {
          include: {
            workTransaction: {
              select: {
                designNumberSnapshot: true,
                categorySnapshot: true,
              },
            },
          },
        },
      },
    }),
    prisma.customer.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        phoneNumber: true,
      },
    }),
  ]);

  return (
    <div className="p-0">
      <ReportsManager
        transactions={serializeToPlainObject(transactions) as any}
        payments={serializeToPlainObject(payments) as any}
        workers={serializeToPlainObject(workers)}
      />
    </div>
  );
}


