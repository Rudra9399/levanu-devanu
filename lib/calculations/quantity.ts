/**
 * Quantity calculation utilities for Devanu-Lenvanu workflow.
 */

/**
 * Calculates given pieces from head count and pieces per head.
 * Formula: heads * piecesPerHead
 */
export function calculateGivenPieces(headQuantity: number, piecesPerHead: number): number {
  const heads = Number(headQuantity) || 0;
  const pph = Number(piecesPerHead) || 0;
  if (heads < 0 || pph < 0) {
    throw new Error("Head quantity and pieces per head must be non-negative.");
  }
  return Math.round(heads * pph);
}

/**
 * Calculates remaining pieces that are still un-accounted for.
 * Formula: givenPieces - (returnedPieces + damagedPieces)
 */
export function calculateRemainingPieces(
  givenPieces: number,
  returnedPieces: number,
  damagedPieces: number
): number {
  const given = Number(givenPieces) || 0;
  const returned = Number(returnedPieces) || 0;
  const damaged = Number(damagedPieces) || 0;

  return given - (returned + damaged);
}

/**
 * Validates whether the returned and damaged pieces do not exceed given pieces.
 */
export function validateQuantityBalance(
  givenPieces: number,
  returnedPieces: number,
  damagedPieces: number
): { isValid: boolean; message?: string } {
  const given = Number(givenPieces) || 0;
  const returned = Number(returnedPieces) || 0;
  const damaged = Number(damagedPieces) || 0;

  if (returned < 0) {
    return { isValid: false, message: "Returned pieces cannot be negative." };
  }
  if (damaged < 0) {
    return { isValid: false, message: "Damaged pieces cannot be negative." };
  }

  const accounted = returned + damaged;
  if (accounted > given) {
    return {
      isValid: false,
      message: `Total accounted pieces (${accounted}) cannot exceed given pieces (${given}).`,
    };
  }

  return { isValid: true };
}
