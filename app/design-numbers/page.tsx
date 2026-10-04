import { prisma } from "@/lib/prisma";
import { DesignNumberList } from "@/components/design-numbers/DesignNumberList";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Design Numbers Master | Devanu-Lenvanu",
  description: "Manage design number identifiers for color-wise job-work calculation.",
};

export default async function DesignNumbersPage() {
  const designs = await prisma.designNumberMaster.findMany({
    orderBy: { designNumber: "asc" },
    include: {
      _count: {
        select: { transactions: true },
      },
    },
  });

  return (
    <div className="p-0">
      <DesignNumberList designs={designs as any} />
    </div>
  );
}

