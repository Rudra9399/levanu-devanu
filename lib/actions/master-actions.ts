"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type ActionResult<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

// ==========================================
// 1. COLOR MASTER ACTIONS
// ==========================================
export async function createColorAction(name: string): Promise<ActionResult<{ id: string }>> {
  try {
    const trimmed = name.trim();
    if (!trimmed) return { success: false, error: "Color name is required." };

    const existing = await prisma.colorMaster.findUnique({
      where: { name: trimmed },
    });
    if (existing) {
      return { success: false, error: `Color "${trimmed}" already exists in master.` };
    }

    const created = await prisma.colorMaster.create({
      data: { name: trimmed, isActive: true },
    });

    revalidatePath("/masters");
    revalidatePath("/work/new");
    return { success: true, data: { id: created.id } };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to create color." };
  }
}

export async function updateColorAction(id: string, name: string): Promise<ActionResult> {
  try {
    const trimmed = name.trim();
    if (!trimmed) return { success: false, error: "Color name is required." };

    const existing = await prisma.colorMaster.findUnique({
      where: { id },
    });
    if (!existing) return { success: false, error: "Color not found." };

    if (existing.name !== trimmed) {
      const conflict = await prisma.colorMaster.findUnique({
        where: { name: trimmed },
      });
      if (conflict) {
        return { success: false, error: `Color "${trimmed}" is already defined.` };
      }
    }

    await prisma.colorMaster.update({
      where: { id },
      data: { name: trimmed },
    });

    revalidatePath("/masters");
    revalidatePath("/work/new");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to update color." };
  }
}

export async function toggleColorActiveAction(id: string): Promise<ActionResult<{ isActive: boolean }>> {
  try {
    const existing = await prisma.colorMaster.findUnique({
      where: { id },
      select: { isActive: true },
    });
    if (!existing) return { success: false, error: "Color not found." };

    const updated = await prisma.colorMaster.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });

    revalidatePath("/masters");
    revalidatePath("/work/new");
    return { success: true, data: { isActive: updated.isActive } };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to toggle status." };
  }
}

export async function deleteColorAction(id: string): Promise<ActionResult> {
  try {
    const linked = await prisma.workTransactionColor.count({
      where: { colorId: id },
    });
    if (linked > 0) {
      return {
        success: false,
        error: `Cannot delete color because it is recorded in ${linked} work order item(s). You can mark it inactive instead.`,
      };
    }

    await prisma.colorMaster.delete({
      where: { id },
    });
    revalidatePath("/masters");
    revalidatePath("/work/new");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to delete color." };
  }
}

// ==========================================
// 2. CATEGORY MASTER ACTIONS
// ==========================================
export async function createCategoryAction(name: string): Promise<ActionResult<{ id: string }>> {
  try {
    const trimmed = name.trim();
    if (!trimmed) return { success: false, error: "Category name is required." };

    const existing = await prisma.categoryMaster.findUnique({
      where: { name: trimmed },
    });
    if (existing) {
      return { success: false, error: `Category "${trimmed}" already exists in master.` };
    }

    const created = await prisma.categoryMaster.create({
      data: { name: trimmed, isActive: true },
    });

    revalidatePath("/masters");
    revalidatePath("/work/new");
    return { success: true, data: { id: created.id } };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to create category." };
  }
}

export async function updateCategoryAction(id: string, name: string): Promise<ActionResult> {
  try {
    const trimmed = name.trim();
    if (!trimmed) return { success: false, error: "Category name is required." };

    const existing = await prisma.categoryMaster.findUnique({
      where: { id },
    });
    if (!existing) return { success: false, error: "Category not found." };

    if (existing.name !== trimmed) {
      const conflict = await prisma.categoryMaster.findUnique({
        where: { name: trimmed },
      });
      if (conflict) {
        return { success: false, error: `Category "${trimmed}" is already defined.` };
      }
    }

    await prisma.categoryMaster.update({
      where: { id },
      data: { name: trimmed },
    });

    revalidatePath("/masters");
    revalidatePath("/work/new");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to update category." };
  }
}

export async function toggleCategoryActiveAction(id: string): Promise<ActionResult<{ isActive: boolean }>> {
  try {
    const existing = await prisma.categoryMaster.findUnique({
      where: { id },
      select: { isActive: true },
    });
    if (!existing) return { success: false, error: "Category not found." };

    const updated = await prisma.categoryMaster.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });

    revalidatePath("/masters");
    revalidatePath("/work/new");
    return { success: true, data: { isActive: updated.isActive } };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to toggle status." };
  }
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  try {
    const linked = await prisma.workTransaction.count({
      where: { categoryId: id },
    });
    if (linked > 0) {
      return {
        success: false,
        error: `Cannot delete category because it is used in ${linked} work order(s). You can mark it inactive instead.`,
      };
    }

    await prisma.categoryMaster.delete({
      where: { id },
    });
    revalidatePath("/masters");
    revalidatePath("/work/new");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to delete category." };
  }
}

// ==========================================
// 3. CUTTING MASTER ACTIONS
// ==========================================
export async function createCuttingAction(name: string): Promise<ActionResult<{ id: string }>> {
  try {
    const trimmed = name.trim();
    if (!trimmed) return { success: false, error: "Cutting style name is required." };

    const existing = await prisma.cuttingMaster.findUnique({
      where: { name: trimmed },
    });
    if (existing) {
      return { success: false, error: `Cutting style "${trimmed}" already exists in master.` };
    }

    const created = await prisma.cuttingMaster.create({
      data: { name: trimmed, isActive: true },
    });

    revalidatePath("/masters");
    revalidatePath("/work/new");
    return { success: true, data: { id: created.id } };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to create cutting style." };
  }
}

export async function updateCuttingAction(id: string, name: string): Promise<ActionResult> {
  try {
    const trimmed = name.trim();
    if (!trimmed) return { success: false, error: "Cutting style name is required." };

    const existing = await prisma.cuttingMaster.findUnique({
      where: { id },
    });
    if (!existing) return { success: false, error: "Cutting style not found." };

    if (existing.name !== trimmed) {
      const conflict = await prisma.cuttingMaster.findUnique({
        where: { name: trimmed },
      });
      if (conflict) {
        return { success: false, error: `Cutting style "${trimmed}" is already defined.` };
      }
    }

    await prisma.cuttingMaster.update({
      where: { id },
      data: { name: trimmed },
    });

    revalidatePath("/masters");
    revalidatePath("/work/new");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to update cutting style." };
  }
}

export async function toggleCuttingActiveAction(id: string): Promise<ActionResult<{ isActive: boolean }>> {
  try {
    const existing = await prisma.cuttingMaster.findUnique({
      where: { id },
      select: { isActive: true },
    });
    if (!existing) return { success: false, error: "Cutting style not found." };

    const updated = await prisma.cuttingMaster.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });

    revalidatePath("/masters");
    revalidatePath("/work/new");
    return { success: true, data: { isActive: updated.isActive } };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to toggle status." };
  }
}

export async function deleteCuttingAction(id: string): Promise<ActionResult> {
  try {
    const linked = await prisma.workTransaction.count({
      where: { cuttingStyleId: id },
    });
    if (linked > 0) {
      return {
        success: false,
        error: `Cannot delete cutting style because it is used in ${linked} work order(s). You can mark it inactive instead.`,
      };
    }

    await prisma.cuttingMaster.delete({
      where: { id },
    });
    revalidatePath("/masters");
    revalidatePath("/work/new");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to delete cutting style." };
  }
}
