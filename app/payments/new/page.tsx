import { prisma } from "@/lib/prisma";
import { PaymentForm } from "@/components/payments/PaymentForm";

interface NewPaymentPageProps {
  searchParams: Promise<{ customerId?: string }>;
}

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Record Worker Payment | Devanu-Lenvanu",
  description: "Disburse cash or digital payment to worker with date range allocation.",
};

export default async function NewPaymentPage({ searchParams }: NewPaymentPageProps) {
  const { customerId } = await searchParams;

  const workers = await prisma.customer.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      phoneNumber: true,
      address: true,
    },
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PaymentForm workers={workers} preselectedWorkerId={customerId} />
    </div>
  );
}
