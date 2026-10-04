"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { paymentSchema, type PaymentFormValues } from "@/lib/validations/payment";

export type ActionResult<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Fetches work orders for a specific worker and issueDate range for payment preview.
 */
export async function getOrdersForPaymentAction(params: {
  customerId: string;
  fromDate: string;
  toDate: string;
}): Promise<
  ActionResult<{
    orders: Array<{
      id: string;
      designNumberSnapshot: string;
      categorySnapshot: string | null;
      cuttingStyleSnapshot: string | null;
      issueDate: string;
      totalGivenPieces: number;
      totalReturnedPieces: number;
      totalAmount: number;
      alreadyAllocated: number;
      pendingAmount: number;
      paymentStatus: string;
    }>;
    summary: {
      totalOrders: number;
      totalPayable: number;
      totalAlreadyPaid: number;
      outstandingPeriodBalance: number;
    };
  }>
> {
  try {
    const { customerId, fromDate, toDate } = params;
    if (!customerId || !fromDate || !toDate) {
      return { success: false, error: "Worker and date range are required." };
    }

    const start = new Date(fromDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(toDate);
    end.setHours(23, 59, 59, 999);

    const transactions = await prisma.workTransaction.findMany({
      where: {
        customerId,
        issueDate: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { issueDate: "asc" },
      include: {
        paymentAllocations: {
          select: {
            allocatedAmount: true,
          },
        },
      },
    });

    let totalPayable = 0;
    let totalAlreadyPaid = 0;

    const formattedOrders = transactions.map((tx) => {
      const orderAmount = Number(tx.totalAmount);
      const alreadyAllocated = tx.paymentAllocations.reduce(
        (sum, a) => sum + Number(a.allocatedAmount),
        0
      );
      const pendingAmount = Math.max(0, orderAmount - alreadyAllocated);

      totalPayable += orderAmount;
      totalAlreadyPaid += alreadyAllocated;

      return {
        id: tx.id,
        designNumberSnapshot: tx.designNumberSnapshot,
        categorySnapshot: tx.categorySnapshot,
        cuttingStyleSnapshot: tx.cuttingStyleSnapshot,
        issueDate: tx.issueDate.toISOString(),
        totalGivenPieces: tx.totalGivenPieces,
        totalReturnedPieces: tx.totalReturnedPieces,
        totalAmount: orderAmount,
        alreadyAllocated,
        pendingAmount,
        paymentStatus: tx.paymentStatus,
      };
    });

    const outstandingPeriodBalance = Math.max(0, totalPayable - totalAlreadyPaid);

    return {
      success: true,
      data: {
        orders: formattedOrders,
        summary: {
          totalOrders: formattedOrders.length,
          totalPayable: Number(totalPayable.toFixed(2)),
          totalAlreadyPaid: Number(totalAlreadyPaid.toFixed(2)),
          outstandingPeriodBalance: Number(outstandingPeriodBalance.toFixed(2)),
        },
      },
    };
  } catch (error: any) {
    console.error("Error fetching payment preview orders:", error);
    return {
      success: false,
      error: error?.message || "Failed to load orders for payment preview.",
    };
  }
}

/**
 * Creates a Payment record and automatically allocates money across eligible work issues.
 */
export async function createPaymentAction(
  rawInput: PaymentFormValues
): Promise<ActionResult<{ id: string }>> {
  try {
    const validated = paymentSchema.parse(rawInput);

    const customer = await prisma.customer.findUnique({
      where: { id: validated.customerId },
    });
    if (!customer) {
      return { success: false, error: "Selected worker not found." };
    }

    const start = new Date(validated.fromDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(validated.toDate);
    end.setHours(23, 59, 59, 999);

    const paymentDate = new Date(validated.paymentDate);

    // Fetch transactions in range
    const transactions = await prisma.workTransaction.findMany({
      where: {
        customerId: validated.customerId,
        issueDate: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { issueDate: "asc" },
      include: {
        paymentAllocations: {
          select: { allocatedAmount: true },
        },
      },
    });

    const payment = await prisma.$transaction(async (tx) => {
      // 1. Create parent Payment record
      const newPayment = await tx.payment.create({
        data: {
          customerId: validated.customerId,
          fromDate: start,
          toDate: end,
          paymentDate,
          paymentAmount: validated.paymentAmount,
          notes: validated.notes || null,
        },
      });

      // 2. FIFO Allocation across eligible transactions
      let remainingToAllocate = validated.paymentAmount;

      for (const order of transactions) {
        if (remainingToAllocate <= 0) break;

        const orderAmount = Number(order.totalAmount);
        const alreadyAllocated = order.paymentAllocations.reduce(
          (sum, a) => sum + Number(a.allocatedAmount),
          0
        );
        const orderPending = Math.max(0, orderAmount - alreadyAllocated);

        if (orderPending > 0) {
          const allocateForThisOrder = Math.min(remainingToAllocate, orderPending);
          remainingToAllocate -= allocateForThisOrder;

          // Create allocation
          await tx.paymentAllocation.create({
            data: {
              paymentId: newPayment.id,
              workTransactionId: order.id,
              allocatedAmount: allocateForThisOrder,
            },
          });

          // Update transaction paymentStatus
          const newTotalAllocated = alreadyAllocated + allocateForThisOrder;
          let newStatus: "UNPAID" | "PARTIALLY_PAID" | "PAID" = "PARTIALLY_PAID";
          if (newTotalAllocated >= orderAmount) {
            newStatus = "PAID";
          } else if (newTotalAllocated <= 0) {
            newStatus = "UNPAID";
          }

          await tx.workTransaction.update({
            where: { id: order.id },
            data: { paymentStatus: newStatus },
          });
        }
      }

      // If all orders were already paid or there's excess amount, link to at least the first order if exists
      if (transactions.length > 0 && remainingToAllocate > 0) {
        const firstOrder = transactions[0];
        const existingAlloc = await tx.paymentAllocation.findUnique({
          where: {
            paymentId_workTransactionId: {
              paymentId: newPayment.id,
              workTransactionId: firstOrder.id,
            },
          },
        });

        if (!existingAlloc) {
          await tx.paymentAllocation.create({
            data: {
              paymentId: newPayment.id,
              workTransactionId: firstOrder.id,
              allocatedAmount: remainingToAllocate,
            },
          });
        }
      }

      return newPayment;
    });

    revalidatePath("/");
    revalidatePath("/payments");
    revalidatePath("/work");
    revalidatePath("/customers");
    revalidatePath(`/customers/${validated.customerId}`);
    revalidatePath("/reports");

    return { success: true, data: { id: payment.id } };
  } catch (error: any) {
    console.error("Error creating payment:", error);
    return {
      success: false,
      error: error?.message || "Failed to record payment.",
    };
  }
}

/**
 * Deletes a Payment and recalculates payment status for affected work transactions.
 */
export async function deletePaymentAction(paymentId: string): Promise<ActionResult> {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { allocations: true },
    });

    if (!payment) {
      return { success: false, error: "Payment record not found." };
    }

    const affectedTransactionIds = payment.allocations.map((a) => a.workTransactionId);

    await prisma.$transaction(async (tx) => {
      // 1. Delete allocations & payment
      await tx.paymentAllocation.deleteMany({
        where: { paymentId },
      });

      await tx.payment.delete({
        where: { id: paymentId },
      });

      // 2. Recalibrate status on all affected transactions
      for (const txId of affectedTransactionIds) {
        const order = await tx.workTransaction.findUnique({
          where: { id: txId },
          include: {
            paymentAllocations: {
              select: { allocatedAmount: true },
            },
          },
        });

        if (order) {
          const totalAllocated = order.paymentAllocations.reduce(
            (sum, a) => sum + Number(a.allocatedAmount),
            0
          );
          const orderAmount = Number(order.totalAmount);

          let newStatus: "UNPAID" | "PARTIALLY_PAID" | "PAID" = "UNPAID";
          if (totalAllocated >= orderAmount && orderAmount > 0) {
            newStatus = "PAID";
          } else if (totalAllocated > 0) {
            newStatus = "PARTIALLY_PAID";
          }

          await tx.workTransaction.update({
            where: { id: txId },
            data: { paymentStatus: newStatus },
          });
        }
      }
    });

    revalidatePath("/");
    revalidatePath("/payments");
    revalidatePath("/work");
    revalidatePath("/customers");
    revalidatePath(`/customers/${payment.customerId}`);
    revalidatePath("/reports");

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting payment:", error);
    return {
      success: false,
      error: error?.message || "Failed to delete payment.",
    };
  }
}
