"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { createTransactionSchema } from "./transaction.schemas";
import { createTransaction } from "./transaction.service";

export type TransactionActionState = {
  error?: string;
};

const transactionErrors = new Set([
  "Account not found",
  "Category is required for expenses",
  "Category not found",
  "Credit card must have a credit limit",
  "Transaction exceeds credit limit",
  "Income cannot be added to a credit card",
  "Destination account is required for transfers",
  "Source and destination accounts must be different",
  "Transfers from credit cards are not supported",
  "Payment cannot exceed credit card balance",
]);

function optionalFormValue(value: FormDataEntryValue | null) {
  return value === null || value === "" ? undefined : value;
}

export async function createTransactionAction(
  prevState: TransactionActionState,
  formData: FormData
) {
  const user = await getCurrentUser();

  if (!user) {
    return { error: "You must be logged in." };
  }

  const result = createTransactionSchema.safeParse({
    type: formData.get("type"),
    amount: formData.get("amount"),
    date: formData.get("date"),
    description: optionalFormValue(formData.get("description")),
    accountId: formData.get("accountId"),
    destinationAccountId: optionalFormValue(
      formData.get("destinationAccountId")
    ),
    categoryId: optionalFormValue(formData.get("categoryId")),
  });

  if (!result.success) {
    return {
      error:
        result.error.issues[0]?.message ?? "Invalid transaction information.",
    };
  }

  try {
    await createTransaction(user.id, result.data);
  } catch (error) {
    if (error instanceof Error && transactionErrors.has(error.message)) {
      return { error: error.message };
    }

    throw error;
  }

  revalidatePath("/accounts");
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  redirect("/transactions?created=true");
}
