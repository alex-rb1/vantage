import { z } from "zod";

export const accountTypeSchema = z.enum([
  "CHEQUING",
  "SAVINGS",
  "CASH",
  "CREDIT_CARD",
]);

const accountBaseSchema = z.object({
  name: z.string().trim().min(1, "Account name is required"),
  type: accountTypeSchema,
  balance: z.coerce.number().min(0, "Balance cannot be negative"),
  creditLimit: z.coerce
    .number()
    .min(0, "Credit limit cannot be negative")
    .optional(),
});

export const createAccountSchema = accountBaseSchema.refine(
  (data) =>
    data.type !== "CREDIT_CARD" ||
    data.creditLimit !== undefined,
  {
    message: "Credit limit is required for credit cards",
    path: ["creditLimit"],
  }
);

export const updateAccountSchema = accountBaseSchema.partial();