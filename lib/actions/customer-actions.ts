"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { customerSchema, type CustomerFormValues } from "@/lib/validations/customer";

export type ActionResult<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Creates a new customer/karigar.
 */
export async function createCustomerAction(
  rawInput: CustomerFormValues
): Promise<ActionResult<{ id: string }>> {
  try {
    const validated = customerSchema.parse(rawInput);

    const customer = await prisma.customer.create({
      data: {
        name: validated.name,
        phoneNumber: validated.phoneNumber || null,
        address: validated.address || null,
        notes: validated.notes || null,
        isActive: validated.isActive ?? true,
      },
    });

    revalidatePath("/");
    revalidatePath("/customers");
    revalidatePath("/work/new");

    return { success: true, data: { id: customer.id } };
  } catch (error: any) {
    console.error("Error creating customer:", error);
    return {
      success: false,
      error: error?.message || "Failed to create customer. Please check the inputs.",
    };
  }
}

/**
 * Updates an existing customer/karigar.
 */
export async function updateCustomerAction(
  id: string,
  rawInput: CustomerFormValues
): Promise<ActionResult<{ id: string }>> {
  try {
    const validated = customerSchema.parse(rawInput);

    const existing = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "Customer not found." };
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        name: validated.name,
        phoneNumber: validated.phoneNumber || null,
        address: validated.address || null,
        notes: validated.notes || null,
        isActive: validated.isActive ?? existing.isActive,
      },
    });

    revalidatePath("/");
    revalidatePath("/customers");
    revalidatePath(`/customers/${id}`);
    revalidatePath("/work/new");

    return { success: true, data: { id: updated.id } };
  } catch (error: any) {
    console.error("Error updating customer:", error);
    return {
      success: false,
      error: error?.message || "Failed to update customer.",
    };
  }
}

/**
 * Toggles active / archived status of a customer.
 */
export async function toggleArchiveCustomerAction(
  id: string
): Promise<ActionResult<{ isActive: boolean }>> {
  try {
    const existing = await prisma.customer.findUnique({
      where: { id },
      select: { isActive: true },
    });

    if (!existing) {
      return { success: false, error: "Customer not found." };
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });

    revalidatePath("/");
    revalidatePath("/customers");
    revalidatePath(`/customers/${id}`);
    revalidatePath("/work/new");

    return { success: true, data: { isActive: updated.isActive } };
  } catch (error: any) {
    console.error("Error toggling customer status:", error);
    return {
      success: false,
      error: error?.message || "Failed to update customer archive status.",
    };
  }
}

/**
 * Safely deletes a customer if no transaction history exists.
 * If historical transactions exist, blocks deletion and advises archiving.
 */
export async function deleteCustomerAction(
  id: string
): Promise<ActionResult> {
  try {
    const txCount = await prisma.workTransaction.count({
      where: { customerId: id },
    });

    if (txCount > 0) {
      return {
        success: false,
        error: `Cannot delete this customer because they have ${txCount} historical work transaction(s). Please archive the customer instead to preserve hisab history.`,
      };
    }

    await prisma.customer.delete({
      where: { id },
    });

    revalidatePath("/");
    revalidatePath("/customers");
    revalidatePath("/work/new");

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting customer:", error);
    return {
      success: false,
      error: error?.message || "Failed to delete customer.",
    };
  }
}
