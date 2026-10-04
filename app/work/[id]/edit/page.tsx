import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { IssueWorkForm } from "@/components/work/IssueWorkForm";
import { serializeToPlainObject } from "@/lib/utils";

interface EditWorkOrderPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: EditWorkOrderPageProps) {
  const { id } = await params;
  const transaction = await prisma.workTransaction.findUnique({
    where: { id },
    select: { designNumberSnapshot: true },
  });

  return {
    title: transaction
      ? `Edit #${transaction.designNumberSnapshot} | Devanu-Lenvanu`
      : "Edit Work Order",
    description: "Update work order details and color-wise piece calculations.",
  };
}

export default async function EditWorkOrderPage({
  params,
}: EditWorkOrderPageProps) {
  const { id } = await params;

  const [
    transaction,
    customers,
    designNumbers,
    categories,
    cuttingStyles,
    colorsMaster,
  ] = await Promise.all([
    prisma.workTransaction.findUnique({
      where: { id },
      include: {
        customer: true,
        colorRows: {
          orderBy: { createdAt: "asc" },
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
        address: true,
      },
    }),
    prisma.designNumberMaster.findMany({
      where: { isActive: true },
      orderBy: { designNumber: "asc" },
      select: {
        id: true,
        designNumber: true,
      },
    }),
    prisma.categoryMaster.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.cuttingMaster.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.colorMaster.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
      },
    }),
  ]);

  if (!transaction) {
    notFound();
  }

  const initialData = {
    id: transaction.id,
    customerId: transaction.customerId,
    designNumberId: transaction.designNumberId,
    designNumber: transaction.designNumberSnapshot,
    categoryId: transaction.categoryId,
    categoryName: transaction.categorySnapshot || "",
    cuttingStyleId: transaction.cuttingStyleId,
    cuttingStyleName: transaction.cuttingStyleSnapshot || "",
    issueDate: new Date(transaction.issueDate).toISOString().split("T")[0],
    notes: transaction.notes,
    colorRows: transaction.colorRows.map((r) => ({
      id: r.id,
      colorId: r.colorId,
      colorName: r.colorNameSnapshot,
      heads: r.heads,
      piecesPerHead: r.piecesPerHead,
      rate: Number(r.rate),
    })),
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <IssueWorkForm
        isEdit={true}
        transactionId={transaction.id}
        initialData={serializeToPlainObject(initialData)}
        customers={serializeToPlainObject(customers)}
        designNumbers={serializeToPlainObject(designNumbers)}
        categories={serializeToPlainObject(categories)}
        cuttingStyles={serializeToPlainObject(cuttingStyles)}
        colorsMaster={serializeToPlainObject(colorsMaster)}
      />
    </div>
  );
}
