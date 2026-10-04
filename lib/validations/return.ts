import { z } from "zod";

export const colorReturnRowSchema = z
  .object({
    id: z.string().min(1, "Color row ID is required"),
    colorName: z.string().optional(),
    givenPieces: z.coerce.number().int().nonnegative(),
    returnedPieces: z.coerce
      .number()
      .int("Returned pieces must be an integer")
      .nonnegative("Returned pieces cannot be negative"),
    damagedPieces: z.coerce
      .number()
      .int("Damaged pieces must be an integer")
      .nonnegative("Damaged pieces cannot be negative"),
  })
  .refine(
    (data) => data.returnedPieces + data.damagedPieces <= data.givenPieces,
    {
      message: "Returned + Damaged pieces cannot exceed Given pieces",
      path: ["returnedPieces"],
    }
  );

export const returnWorkSchema = z.object({
  returnDate: z.string().min(1, "Return date is required"),
  notes: z.string().trim().max(500).optional().nullable(),
  colorRows: z
    .array(colorReturnRowSchema)
    .min(1, "At least one color row is required"),
});

export type ColorReturnRowFormValues = z.infer<typeof colorReturnRowSchema>;
export type ReturnWorkFormValues = z.infer<typeof returnWorkSchema>;
