import { z } from "zod";

export const rateUnitEnum = z.enum(["PER_PIECE", "PER_HEAD"]);

export const designSchema = z.object({
  designNumber: z
    .string()
    .trim()
    .min(1, "Design number is required")
    .max(50, "Design number cannot exceed 50 characters")
    .transform((val) => val.toUpperCase()),
  materialType: z.string().trim().min(1, "At least one material category is required"),
  categoryId: z.string().optional().nullable(),
  headQuantity: z.coerce.number().int().nonnegative().optional().nullable(),
  piecesPerHead: z.coerce
    .number({ invalid_type_error: "Pieces per head is required" })
    .int("Pieces per head must be a whole number"),
  categoryPieces: z.record(z.string(), z.coerce.number()).optional().nullable(),
  defaultRate: z.coerce
    .number({ invalid_type_error: "Default rate is required" })
    .min(0, "Default rate must be 0 or greater"),
  rateUnit: rateUnitEnum.default("PER_PIECE"),
  colors: z
    .array(z.string().trim().min(1, "Color name cannot be empty"))
    .min(1, "At least one color variation is required"),
  notes: z.string().trim().max(500).optional(),
  isActive: z.boolean().default(true),
});

export type DesignFormValues = {
  designNumber: string;
  materialType: string;
  categoryId?: string | null;
  piecesPerHead: number;
  categoryPieces?: Record<string, number> | null;
  headQuantity?: number | null;
  defaultRate: number;
  rateUnit?: "PER_PIECE" | "PER_HEAD";
  colors: string[];
  notes?: string;
  isActive?: boolean;
};
