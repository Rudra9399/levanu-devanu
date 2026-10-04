import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { WorkerProfileView } from "@/components/customers/WorkerProfileView";
import { serializeToPlainObject } from "@/lib/utils";

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: CustomerDetailPageProps) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    select: { name: true },
  });

  return {
    title: customer ? `${customer.name} - Worker Ledger | Devanu-Lenvanu` : "Worker Profile",
  };
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      transactions: {
        orderBy: { issueDate: "desc" },
        include: {
          colorRows: {
            orderBy: { createdAt: "asc" },
          },
        },
      },
      payments: {
        orderBy: { paymentDate: "desc" },
        include: {
          allocations: {
            include: {
              workTransaction: {
                select: {
                  id: true,
                  designNumberSnapshot: true,
                  categorySnapshot: true,
                  issueDate: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!customer) {
    notFound();
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <WorkerProfileView customer={serializeToPlainObject(customer) as any} />
    </div>
  );
}
