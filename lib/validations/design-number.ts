import { z } from "zod";

export const designNumberSchema = z.object({
  designNumber: z
    .string()
    .trim()
    .min(1, "Design number is required")
    .max(50, "Design number cannot exceed 50 characters")
    .transform((val) => val.toUpperCase()),
  isActive: z.boolean().default(true),
});

export type DesignNumberFormValues = z.infer<typeof designNumberSchema>;
