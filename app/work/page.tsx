import { prisma } from "@/lib/prisma";
import { WorkOrderList } from "@/components/work/WorkOrderList";
import { serializeToPlainObject } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Work Orders (Devanu & Lenvanu) | Devanu-Lenvanu",
  description: "Track work orders issued to workers and manage return reconciliations.",
};

export default async function WorkOrdersPage() {
  const [transactions, workers] = await Promise.all([
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
      },
    }),
    prisma.customer.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <WorkOrderList
      initialTransactions={serializeToPlainObject(transactions) as any}
      workers={serializeToPlainObject(workers)}
    />
  );
}


