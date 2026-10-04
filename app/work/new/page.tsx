import { prisma } from "@/lib/prisma";
import { IssueWorkForm } from "@/components/work/IssueWorkForm";

interface NewWorkPageProps {
  searchParams: Promise<{ customerId?: string; designNumberId?: string }>;
}

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Issue Work (Devanu) | Devanu-Lenvanu",
  description: "Create color-wise piece cutting assignment for worker.",
};

export default async function NewWorkPage({ searchParams }: NewWorkPageProps) {
  const { customerId, designNumberId } = await searchParams;

  const [customers, designNumbers, categories, cuttingStyles, colorsMaster] =
    await Promise.all([
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

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <IssueWorkForm
        customers={customers}
        designNumbers={designNumbers}
        categories={categories}
        cuttingStyles={cuttingStyles}
        colorsMaster={colorsMaster}
        preselectedCustomerId={customerId}
        preselectedDesignNumberId={designNumberId}
      />
    </div>
  );
}
