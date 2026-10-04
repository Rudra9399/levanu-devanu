import { z } from "zod";
import { rateUnitEnum } from "./design";

export const transactionSchema = z.object({
  customerId: z.string().min(1, "Worker is required"),
  designId: z.string().min(1, "Design is required"),
  colorId: z.string().optional().nullable(),
  colorName: z.string().optional().nullable(),
  colors: z.array(z.string().trim()).optional(),
  materialType: z.string().min(1, "Material category is required"),
  workType: z.string().min(1, "Cutting work type is required"),
  headQuantity: z.coerce
    .number()
    .int("Heads must be an integer")
    .positive("Heads must be greater than 0"),
  piecesPerHead: z.coerce
    .number()
    .int("Pieces per head must be an integer")
    .positive("Pieces per head must be greater than 0"),
  rate: z.coerce
    .number()
    .nonnegative("Rate must be 0 or greater"),
  rateUnit: rateUnitEnum.default("PER_PIECE"),
  startDate: z.string().min(1, "Start date is required"),
  notes: z.string().trim().max(500).optional(),
});

export type TransactionFormValues = {
  customerId: string;
  designId: string;
  colorId?: string | null;
  colorName?: string | null;
  colors?: string[];
  materialType: string;
  workType: string;
  headQuantity: number;
  piecesPerHead: number;
  rate: number;
  rateUnit?: "PER_PIECE" | "PER_HEAD";
  startDate: string;
  notes?: string;
};
