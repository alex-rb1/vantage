"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { archiveAccount, createAccount, updateAccount } from "./account.service";
import { createAccountSchema, updateAccountSchema } from "./account.schemas";
import { redirect } from "next/navigation";

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

export async function updateAccountAction(
  accountId: number,
  prevState: AccountActionState,
  formData: FormData
) {
  const user = await getCurrentUser();

  if (!user) {
    return { error: "You must be logged in." };
  }

  const rawCreditLimit = formData.get("creditLimit");

  const result = updateAccountSchema.safeParse({
    name: formData.get("name"),
    balance: formData.get("balance"),
    creditLimit:
      rawCreditLimit === null || rawCreditLimit === ""
        ? undefined
        : rawCreditLimit,
  });

  if (!result.success) {
    return {
      error:
        result.error.issues[0]?.message ??
        "Invalid account information.",
    };
  }

  try {
    await updateAccount(user.id, accountId, result.data);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Account not found"
    ) {
      return { error: "Account not found." };
    }

    throw error;
  }

  revalidatePath("/accounts");
  revalidatePath(`/accounts/${accountId}`);

  redirect("/accounts");
}

export async function archiveAccountAction(accountId: number) {
  const user = await getCurrentUser();

  if (!user) {
    return;
  }

  await archiveAccount(user.id, accountId);

  redirect("/accounts");
}