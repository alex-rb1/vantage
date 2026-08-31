"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { createAccount } from "./account.service";
import { createAccountSchema } from "./account.schemas";

export type AccountActionState = {
  error?: string;
};

export async function createAccountAction(
  prevState: AccountActionState,
  formData: FormData
) {
  const user = await getCurrentUser();

  if (!user) {
    return { error: "You must be logged in." };
  }

  const rawCreditLimit = formData.get("creditLimit");

  const result = createAccountSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    balance: formData.get("balance"),
    creditLimit:
      rawCreditLimit === "" ? undefined : rawCreditLimit,
  });

  if (!result.success) {
    return {
      error: result.error.issues[0]?.message ?? "Invalid account information.",
    };
  }

  await createAccount(user.id, result.data);

  revalidatePath("/accounts");

  return {};
}