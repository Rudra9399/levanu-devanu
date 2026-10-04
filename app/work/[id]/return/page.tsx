import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ReturnWorkForm } from "@/components/work/ReturnWorkForm";
import { serializeToPlainObject } from "@/lib/utils";

interface ReturnPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Record Work Return (Lenvanu) | Devanu-Lenvanu",
  description: "Record color-wise returned pieces and damaged scrap.",
};

export default async function ReturnWorkPage({ params }: ReturnPageProps) {
  const { id } = await params;

  const transaction = await prisma.workTransaction.findUnique({
    where: { id },
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
  });

  if (!transaction) {
    notFound();
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <ReturnWorkForm transaction={serializeToPlainObject(transaction) as any} />
    </div>
  );
}
