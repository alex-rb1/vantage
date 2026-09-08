import { z } from "zod";

export const transactionTypeSchema = z.enum([
  "INCOME",
  "EXPENSE",
  "TRANSFER",
]);

const transactionBaseSchema = z.object({
  type: transactionTypeSchema,
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  date: z.coerce.date(),
  description: z.string().trim().optional(),
  accountId: z.coerce.number().int().positive(),
  destinationAccountId: z.coerce.number().int().positive().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
});

export const createTransactionSchema = transactionBaseSchema.superRefine(
  (data, ctx) => {
    if (data.type === "EXPENSE" && !data.categoryId) {
      ctx.addIssue({
        code: "custom",
        path: ["categoryId"],
        message: "Category is required for expenses",
      });
    }

    if (data.type === "TRANSFER") {
      if (!data.destinationAccountId) {
        ctx.addIssue({
          code: "custom",
          path: ["destinationAccountId"],
          message: "Destination account is required for transfers",
        });
      }

      if (data.destinationAccountId === data.accountId) {
        ctx.addIssue({
          code: "custom",
          path: ["destinationAccountId"],
          message: "Source and destination accounts must be different",
        });
      }
    }
  }
);

export const updateTransactionSchema = createTransactionSchema;
