export type RateUnitType = "PER_PIECE" | "PER_HEAD";

/**
 * Calculates earnings/payable amount for a transaction.
 *
 * @param completedPieces - Number of completed/returned pieces (or accounted pieces if damage is paid)
 * @param rate - Rate snapshot on transaction
 * @param rateUnit - Whether rate applies per piece or per head
 * @param piecesPerHead - Pieces per head ratio (needed if rate is PER_HEAD)
 */
export function calculatePayableAmount({
  completedPieces,
  rate,
  rateUnit = "PER_PIECE",
  piecesPerHead = 1,
}: {
  completedPieces: number;
  rate: number;
  rateUnit?: RateUnitType;
  piecesPerHead?: number;
}): number {
  const pieces = Number(completedPieces) || 0;
  const rateNum = Number(rate) || 0;
  const pph = Number(piecesPerHead) > 0 ? Number(piecesPerHead) : 1;

  if (rateUnit === "PER_PIECE") {
    return Number((pieces * rateNum).toFixed(2));
  } else if (rateUnit === "PER_HEAD") {
    const heads = pieces / pph;
    return Number((heads * rateNum).toFixed(2));
  }

  return 0;
}
