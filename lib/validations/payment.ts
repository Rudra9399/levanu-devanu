import { z } from "zod";

export const paymentSchema = z.object({
  customerId: z.string().min(1, "Worker selection is required"),
  fromDate: z.string().min(1, "From date is required"),
  toDate: z.string().min(1, "To date is required"),
  paymentDate: z.string().min(1, "Payment date is required"),
  paymentAmount: z.coerce
    .number({ invalid_type_error: "Payment amount must be a number" })
    .positive("Payment amount must be greater than 0"),
  notes: z.string().trim().max(500).optional().nullable(),
});

export type PaymentFormValues = z.infer<typeof paymentSchema>;
