"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  workIssueSchema,
  type WorkIssueFormValues,
} from "@/lib/validations/work-issue";
import {
  returnWorkSchema,
  type ReturnWorkFormValues,
} from "@/lib/validations/return";

export type ActionResult<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Creates a new Work Issue Transaction ("Devanu") with color-wise calculation rows.
 * Executes atomically in a database transaction with server-calculated invariants.
 */
export async function createWorkTransactionAction(
  rawInput: WorkIssueFormValues
): Promise<ActionResult<{ id: string }>> {
  try {
    const validated = workIssueSchema.parse(rawInput);

    // 1. Verify worker exists
    const customer = await prisma.customer.findUnique({
      where: { id: validated.customerId },
    });
    if (!customer) {
      return { success: false, error: "Selected worker not found." };
    }

    // 2. Prepare color calculations and snapshots
    let totalGivenPieces = 0;
    let totalAmount = 0;

    const calculatedColorRows = validated.colorRows.map((row) => {
      const givenPieces = Math.round(row.heads * row.piecesPerHead);
      const rowAmount = Number((givenPieces * row.rate).toFixed(2));

      totalGivenPieces += givenPieces;
      totalAmount += rowAmount;

      return {
        colorId: row.colorId || null,
        colorNameSnapshot: row.colorName.trim(),
        heads: row.heads,
        piecesPerHead: row.piecesPerHead,
        givenPieces,
        returnedPieces: 0,
        damagedPieces: 0,
        rate: row.rate,
        amount: rowAmount,
      };
    });

    const issueDate = new Date(validated.issueDate);

    // 3. Atomic Database Insertion
    const transaction = await prisma.$transaction(async (tx) => {
      return tx.workTransaction.create({
        data: {
          customerId: validated.customerId,
          designNumberId: validated.designNumberId || null,
          designNumberSnapshot: validated.designNumber.trim().toUpperCase(),
          categoryId: validated.categoryId || null,
          categorySnapshot: validated.categoryName.trim(),
          cuttingStyleId: validated.cuttingStyleId || null,
          cuttingStyleSnapshot: validated.cuttingStyleName.trim(),
          issueDate,
          totalGivenPieces,
          totalReturnedPieces: 0,
          totalDamagedPieces: 0,
          totalAmount: totalAmount,
          workStatus: "PENDING",
          paymentStatus: "UNPAID",
          notes: validated.notes || null,
          colorRows: {
            create: calculatedColorRows,
          },
        },
        include: {
          colorRows: true,
        },
      });
    });

    // 4. Revalidate cache
    revalidatePath("/");
    revalidatePath("/work");
    revalidatePath("/customers");
    revalidatePath(`/customers/${validated.customerId}`);
    revalidatePath("/reports");

    return { success: true, data: { id: transaction.id } };
  } catch (error: any) {
    console.error("Error creating work transaction:", error);
    return {
      success: false,
      error: error?.message || "Failed to create work transaction.",
    };
  }
}

/**
 * Records a Work Return ("Lenvanu") with per-color reconciliation and damaged tracking.
 * Automatically updates child color rows and parent ledger status (PENDING / PARTIALLY_RETURNED / COMPLETED).
 */
export async function recordColorReturnAction(
  transactionId: string,
  rawInput: ReturnWorkFormValues
): Promise<ActionResult<{ id: string; status: string }>> {
  try {
    const validated = returnWorkSchema.parse(rawInput);

    const existing = await prisma.workTransaction.findUnique({
      where: { id: transactionId },
      include: { colorRows: true, customer: true },
    });

    if (!existing) {
      return { success: false, error: "Work transaction not found." };
    }

    const rowMap = new Map(existing.colorRows.map((r) => [r.id, r]));

    // Validate each row invariant
    for (const inputRow of validated.colorRows) {
      const dbRow = rowMap.get(inputRow.id);
      if (!dbRow) {
        return {
          success: false,
          error: `Color row ID ${inputRow.id} does not belong to this transaction.`,
        };
      }

      if (inputRow.returnedPieces + inputRow.damagedPieces > dbRow.givenPieces) {
        return {
          success: false,
          error: `Returned (${inputRow.returnedPieces}) + Damaged (${inputRow.damagedPieces}) exceeds Given (${dbRow.givenPieces}) for color ${dbRow.colorNameSnapshot}.`,
        };
      }
    }

    const returnDate = new Date(validated.returnDate);

    // Atomic reconciliation transaction
    const result = await prisma.$transaction(async (tx) => {
      let totalReturnedPieces = 0;
      let totalDamagedPieces = 0;
      let totalGivenPieces = 0;

      for (const inputRow of validated.colorRows) {
        const dbRow = rowMap.get(inputRow.id)!;
        totalGivenPieces += dbRow.givenPieces;
        totalReturnedPieces += inputRow.returnedPieces;
        totalDamagedPieces += inputRow.damagedPieces;

        await tx.workTransactionColor.update({
          where: { id: inputRow.id },
          data: {
            returnedPieces: inputRow.returnedPieces,
            damagedPieces: inputRow.damagedPieces,
          },
        });
      }

      // Determine parent status
      let workStatus: "PENDING" | "PARTIALLY_RETURNED" | "COMPLETED" = "PENDING";
      const totalAccounted = totalReturnedPieces + totalDamagedPieces;

      if (totalAccounted >= totalGivenPieces) {
        workStatus = "COMPLETED";
      } else if (totalAccounted > 0) {
        workStatus = "PARTIALLY_RETURNED";
      }

      const updated = await tx.workTransaction.update({
        where: { id: transactionId },
        data: {
          totalReturnedPieces,
          totalDamagedPieces,
          workStatus,
          returnDate: workStatus === "COMPLETED" ? returnDate : existing.returnDate || returnDate,
          notes: validated.notes !== undefined ? validated.notes : existing.notes,
        },
      });

      return updated;
    });

    revalidatePath("/");
    revalidatePath("/work");
    revalidatePath(`/work/${transactionId}`);
    revalidatePath(`/customers/${existing.customerId}`);
    revalidatePath("/reports");

    return {
      success: true,
      data: { id: result.id, status: result.workStatus },
    };
  } catch (error: any) {
    console.error("Error recording color return:", error);
    return {
      success: false,
      error: error?.message || "Failed to record return reconciliation.",
    };
  }
}

/**
 * Updates an existing Work Issue Transaction ("Devanu") and synchronizes color rows.
 */
export async function updateWorkTransactionAction(
  id: string,
  rawInput: WorkIssueFormValues
): Promise<ActionResult<{ id: string }>> {
  try {
    const validated = workIssueSchema.parse(rawInput);

    const existing = await prisma.workTransaction.findUnique({
      where: { id },
      include: {
        colorRows: true,
        paymentAllocations: true,
      },
    });

    if (!existing) {
      return { success: false, error: "Work transaction not found." };
    }

    // 1. Verify worker exists
    const customer = await prisma.customer.findUnique({
      where: { id: validated.customerId },
    });
    if (!customer) {
      return { success: false, error: "Selected worker not found." };
    }

    // 2. Prepare color calculations and snapshots
    let totalGivenPieces = 0;
    let totalAmount = 0;
    let totalReturnedPieces = 0;
    let totalDamagedPieces = 0;

    const calculatedColorRows = validated.colorRows.map((row) => {
      const givenPieces = Math.round(row.heads * row.piecesPerHead);
      const rowAmount = Number((givenPieces * row.rate).toFixed(2));

      totalGivenPieces += givenPieces;
      totalAmount += rowAmount;

      // Check if matching color existed to preserve returned / damaged pieces
      const matchedExisting = existing.colorRows.find(
        (er) =>
          (row.colorId && er.colorId === row.colorId) ||
          er.colorNameSnapshot.toLowerCase() === row.colorName.trim().toLowerCase()
      );

      const returnedPieces = matchedExisting
        ? Math.min(matchedExisting.returnedPieces, givenPieces)
        : 0;
      const damagedPieces = matchedExisting
        ? Math.min(matchedExisting.damagedPieces, Math.max(0, givenPieces - returnedPieces))
        : 0;

      totalReturnedPieces += returnedPieces;
      totalDamagedPieces += damagedPieces;

      return {
        colorId: row.colorId || null,
        colorNameSnapshot: row.colorName.trim(),
        heads: row.heads,
        piecesPerHead: row.piecesPerHead,
        givenPieces,
        returnedPieces,
        damagedPieces,
        rate: row.rate,
        amount: rowAmount,
      };
    });

    const issueDate = new Date(validated.issueDate);
    const totalAccounted = totalReturnedPieces + totalDamagedPieces;

    let workStatus: "PENDING" | "PARTIALLY_RETURNED" | "COMPLETED" = "PENDING";
    if (totalAccounted >= totalGivenPieces && totalGivenPieces > 0) {
      workStatus = "COMPLETED";
    } else if (totalAccounted > 0) {
      workStatus = "PARTIALLY_RETURNED";
    }

    await prisma.$transaction(async (tx) => {
      // 1. Delete previous color rows
      await tx.workTransactionColor.deleteMany({
        where: { workTransactionId: id },
      });

      // 2. Update parent transaction and recreate color rows
      return tx.workTransaction.update({
        where: { id },
        data: {
          customerId: validated.customerId,
          designNumberId: validated.designNumberId || null,
          designNumberSnapshot: validated.designNumber.trim().toUpperCase(),
          categoryId: validated.categoryId || null,
          categorySnapshot: validated.categoryName.trim(),
          cuttingStyleId: validated.cuttingStyleId || null,
          cuttingStyleSnapshot: validated.cuttingStyleName.trim(),
          issueDate,
          totalGivenPieces,
          totalReturnedPieces,
          totalDamagedPieces,
          totalAmount,
          workStatus,
          notes: validated.notes || null,
          colorRows: {
            create: calculatedColorRows,
          },
        },
      });
    });

    revalidatePath("/");
    revalidatePath("/work");
    revalidatePath(`/work/${id}`);
    revalidatePath(`/work/${id}/edit`);
    revalidatePath(`/work/${id}/return`);
    revalidatePath("/customers");
    revalidatePath(`/customers/${validated.customerId}`);
    if (existing.customerId !== validated.customerId) {
      revalidatePath(`/customers/${existing.customerId}`);
    }
    revalidatePath("/reports");

    return { success: true, data: { id } };
  } catch (error: any) {
    console.error("Error updating work transaction:", error);
    return {
      success: false,
      error: error?.message || "Failed to update work transaction.",
    };
  }
}

/**
 * Deletes a work transaction (with integrity guard against allocated payments).
 */
export async function deleteWorkTransactionAction(
  id: string
): Promise<ActionResult> {
  try {
    const existing = await prisma.workTransaction.findUnique({
      where: { id },
      include: {
        paymentAllocations: true,
      },
    });

    if (!existing) {
      return { success: false, error: "Work transaction not found." };
    }

    if (existing.paymentAllocations && existing.paymentAllocations.length > 0) {
      return {
        success: false,
        error: "Cannot delete an order with allocated payments. Delete the payment records first.",
      };
    }

    await prisma.workTransaction.delete({
      where: { id },
    });

    revalidatePath("/");
    revalidatePath("/work");
    revalidatePath(`/customers/${existing.customerId}`);
    revalidatePath("/reports");

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting work transaction:", error);
    return {
      success: false,
      error: error?.message || "Failed to delete work transaction.",
    };
  }
}

