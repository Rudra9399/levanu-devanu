import { z } from "zod";

export const customerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Worker name must be at least 2 characters")
    .max(100, "Worker name cannot exceed 100 characters"),
  phoneNumber: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val))
    .refine((val) => !val || /^[6-9]\d{9}$/.test(val), {
      message: "Please enter a valid 10-digit Indian mobile number (e.g. 9876543210)",
    }),
  address: z
    .string()
    .trim()
    .max(250, "Address cannot exceed 250 characters")
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  notes: z
    .string()
    .trim()
    .max(500, "Notes cannot exceed 500 characters")
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  isActive: z.boolean().default(true),
});

export type CustomerFormValues = {
  name: string;
  phoneNumber?: string | null;
  address?: string | null;
  notes?: string | null;
  isActive?: boolean;
};
