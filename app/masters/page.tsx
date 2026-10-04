import { prisma } from "@/lib/prisma";
import { MasterManager } from "@/components/masters/MasterManager";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "System Masters | Devanu-Lenvanu",
  description: "Configure system masters for Colors, Material Categories, and Cutting Styles.",
};

export default async function MastersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const initialTab =
    params.tab === "categories"
      ? "category"
      : params.tab === "cutting"
      ? "cutting"
      : "color";

  const [colors, categories, cuttings] = await Promise.all([
    prisma.colorMaster.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { colorRows: true },
        },
      },
    }),
    prisma.categoryMaster.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    }),
    prisma.cuttingMaster.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    }),
  ]);

  return (
    <div className="p-0">
      <MasterManager
        colors={colors as any}
        categories={categories as any}
        cuttings={cuttings as any}
        initialTab={initialTab}
      />
    </div>
  );
}

