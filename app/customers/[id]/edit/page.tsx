import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CustomerForm } from "@/components/customers/CustomerForm";

interface EditCustomerPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCustomerPage({ params }: EditCustomerPageProps) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
  });

  if (!customer) {
    notFound();
  }

  return (
    <CustomerForm
      isEdit
      initialData={{
        id: customer.id,
        name: customer.name,
        phoneNumber: customer.phoneNumber || "",
        address: customer.address || "",
        notes: customer.notes || "",
        isActive: customer.isActive,
      }}
    />
  );
}
