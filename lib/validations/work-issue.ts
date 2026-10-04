import { z } from "zod";

export const colorRowSchema = z.object({
  colorId: z.string().optional().nullable(),
  colorName: z.string().trim().min(1, "Color name is required"),
  heads: z.coerce
    .number()
    .int("Heads must be a whole number")
    .positive("Heads must be at least 1"),
  piecesPerHead: z.coerce
    .number()
    .int("Pieces per head must be a whole number")
    .positive("Pieces per head must be at least 1"),
  rate: z.coerce
    .number()
    .nonnegative("Rate must be 0 or greater"),
});

export const workIssueSchema = z.object({
  customerId: z.string().min(1, "Worker selection is required"),
  designNumberId: z.string().optional().nullable(),
  designNumber: z.string().trim().min(1, "Design number is required"),
  categoryId: z.string().optional().nullable(),
  categoryName: z.string().trim().min(1, "Material category is required"),
  cuttingStyleId: z.string().optional().nullable(),
  cuttingStyleName: z.string().trim().min(1, "Cutting style is required"),
  issueDate: z.string().min(1, "Issue date is required"),
  notes: z.string().trim().max(500).optional().nullable(),
  colorRows: z
    .array(colorRowSchema)
    .min(1, "At least one color calculation row is required"),
});

export type ColorRowFormValues = z.infer<typeof colorRowSchema>;
export type WorkIssueFormValues = z.infer<typeof workIssueSchema>;
