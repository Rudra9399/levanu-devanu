"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { designNumberSchema, type DesignNumberFormValues } from "@/lib/validations/design-number";

export type ActionResult<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Creates a new Design Number in Master.
 */
export async function createDesignNumberAction(
  rawInput: DesignNumberFormValues
): Promise<ActionResult<{ id: string }>> {
  try {
    const validated = designNumberSchema.parse(rawInput);

    const existing = await prisma.designNumberMaster.findUnique({
      where: { designNumber: validated.designNumber },
    });

    if (existing) {
      return {
        success: false,
        error: `Design number "${validated.designNumber}" already exists in master.`,
      };
    }

    const created = await prisma.designNumberMaster.create({
      data: {
        designNumber: validated.designNumber,
        isActive: validated.isActive ?? true,
      },
    });

    revalidatePath("/design-numbers");
    revalidatePath("/work/new");
    revalidatePath("/");

    return { success: true, data: { id: created.id } };
  } catch (error: any) {
    console.error("Error creating design number:", error);
    return {
      success: false,
      error: error?.message || "Failed to create design number.",
    };
  }
}

/**
 * Updates an existing Design Number in Master.
 */
export async function updateDesignNumberAction(
  id: string,
  rawInput: DesignNumberFormValues
): Promise<ActionResult<{ id: string }>> {
  try {
    const validated = designNumberSchema.parse(rawInput);

    const existing = await prisma.designNumberMaster.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "Design number record not found." };
    }

    // If changing the design number string, check for conflict
    if (validated.designNumber !== existing.designNumber) {
      const conflict = await prisma.designNumberMaster.findUnique({
        where: { designNumber: validated.designNumber },
      });
      if (conflict) {
        return {
          success: false,
          error: `Design number "${validated.designNumber}" is already in use.`,
        };
      }
    }

    const updated = await prisma.designNumberMaster.update({
      where: { id },
      data: {
        designNumber: validated.designNumber,
        isActive: validated.isActive ?? existing.isActive,
      },
    });

    revalidatePath("/design-numbers");
    revalidatePath("/work/new");
    revalidatePath("/");

    return { success: true, data: { id: updated.id } };
  } catch (error: any) {
    console.error("Error updating design number:", error);
    return {
      success: false,
      error: error?.message || "Failed to update design number.",
    };
  }
}

/**
 * Toggles active / inactive status of a Design Number.
 */
export async function toggleActiveDesignNumberAction(
  id: string
): Promise<ActionResult<{ isActive: boolean }>> {
  try {
    const existing = await prisma.designNumberMaster.findUnique({
      where: { id },
      select: { isActive: true, designNumber: true },
    });

    if (!existing) {
      return { success: false, error: "Design number not found." };
    }

    const updated = await prisma.designNumberMaster.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });

    revalidatePath("/design-numbers");
    revalidatePath("/work/new");
    revalidatePath("/");

    return { success: true, data: { isActive: updated.isActive } };
  } catch (error: any) {
    console.error("Error toggling design number status:", error);
    return {
      success: false,
      error: error?.message || "Failed to toggle status.",
    };
  }
}

/**
 * Deletes a Design Number if no work orders are linked to it.
 */
export async function deleteDesignNumberAction(id: string): Promise<ActionResult> {
  try {
    const usageCount = await prisma.workTransaction.count({
      where: { designNumberId: id },
    });

    if (usageCount > 0) {
      return {
        success: false,
        error: `Cannot delete this design number because it is linked to ${usageCount} work order(s). You can mark it inactive instead.`,
      };
    }

    await prisma.designNumberMaster.delete({
      where: { id },
    });

    revalidatePath("/design-numbers");
    revalidatePath("/work/new");
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting design number:", error);
    return {
      success: false,
      error: error?.message || "Failed to delete design number.",
    };
  }
}
