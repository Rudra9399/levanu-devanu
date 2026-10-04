import { prisma } from "@/lib/prisma";
import { CustomerList } from "@/components/customers/CustomerList";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Workers Directory | Devanu-Lenvanu",
  description: "Manage worker accounts, track active pieces outside, and view hisab financial ledgers.",
};

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { transactions: true, payments: true },
      },
      transactions: {
        select: {
          id: true,
          workStatus: true,
          paymentStatus: true,
          totalGivenPieces: true,
          totalReturnedPieces: true,
          totalDamagedPieces: true,
          totalAmount: true,
        },
      },
      payments: {
        select: {
          id: true,
          paymentAmount: true,
        },
      },
    },
  });

  const formattedCustomers = customers.map((c) => {
    // Active / Pending Transactions
    const activeTransactions = c.transactions.filter(
      (tx) => tx.workStatus === "PENDING" || tx.workStatus === "PARTIALLY_RETURNED"
    );
    const pendingCount = activeTransactions.length;
    const pendingPieces = activeTransactions.reduce(
      (sum, tx) => sum + (tx.totalGivenPieces - (tx.totalReturnedPieces + tx.totalDamagedPieces)),
      0
    );

    // Total Financials
    const totalPayable = c.transactions.reduce(
      (sum, tx) => sum + Number(tx.totalAmount),
      0
    );
    const totalPaid = c.payments.reduce(
      (sum, p) => sum + Number(p.paymentAmount),
      0
    );
    const outstandingBalance = totalPayable - totalPaid;

    return {
      id: c.id,
      name: c.name,
      phoneNumber: c.phoneNumber,
      address: c.address,
      notes: c.notes,
      isActive: c.isActive,
      _count: {
        transactions: c._count.transactions,
        payments: c._count.payments,
      },
      pendingCount,
      pendingPieces,
      totalPayable,
      totalPaid,
      outstandingBalance,
    };
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <CustomerList initialCustomers={formattedCustomers} />
    </div>
  );
}
