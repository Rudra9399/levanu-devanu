import { prisma } from "@/lib/prisma";
import { PaymentList } from "@/components/payments/PaymentList";
import { serializeToPlainObject } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Worker Payments & Settlements | Devanu-Lenvanu",
  description: "Track worker disbursements and issue-date based payment settlements.",
};

export default async function PaymentsPage() {
  const [payments, workOrders, workers] = await Promise.all([
    prisma.payment.findMany({
      orderBy: { paymentDate: "desc" },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            address: true,
          },
        },
        allocations: {
          include: {
            workTransaction: {
              select: {
                id: true,
                designNumberSnapshot: true,
                categorySnapshot: true,
                cuttingStyleSnapshot: true,
                issueDate: true,
                totalAmount: true,
                totalGivenPieces: true,
                totalReturnedPieces: true,
              },
            },
          },
        },
      },
    }),
    prisma.workTransaction.findMany({
      select: {
        totalAmount: true,
        paymentAllocations: {
          select: {
            allocatedAmount: true,
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
      },
    }),
  ]);

  const totalBilling = workOrders.reduce(
    (sum, o) => sum + Number(o.totalAmount),
    0
  );
  const totalAllocated = workOrders.reduce(
    (sum, o) =>
      sum +
      o.paymentAllocations.reduce(
        (aSum, a) => aSum + Number(a.allocatedAmount),
        0
      ),
    0
  );
  const totalPendingAmount = Math.max(0, totalBilling - totalAllocated);

  return (
    <PaymentList
      initialPayments={serializeToPlainObject(payments) as any}
      totalPendingAmount={totalPendingAmount}
      workers={serializeToPlainObject(workers)}
    />
  );
}


