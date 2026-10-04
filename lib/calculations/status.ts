export type TransactionStatusType = "PENDING" | "PARTIALLY_RETURNED" | "COMPLETED" | "CANCELLED";

/**
 * Determines transaction status based on returned, damaged, and given piece counts.
 */
export function determineTransactionStatus(
  givenPieces: number,
  returnedPieces: number,
  damagedPieces: number,
  isCancelled: boolean = false
): TransactionStatusType {
  if (isCancelled) {
    return "CANCELLED";
  }

  const given = Number(givenPieces) || 0;
  const returned = Number(returnedPieces) || 0;
  const damaged = Number(damagedPieces) || 0;
  const totalAccounted = returned + damaged;

  if (totalAccounted <= 0) {
    return "PENDING";
  }

  if (totalAccounted < given) {
    return "PARTIALLY_RETURNED";
  }

  return "COMPLETED";
}
