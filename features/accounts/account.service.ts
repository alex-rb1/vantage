import { prisma } from "@/lib/db/prisma";

type CreateAccountInput = {
  name: string;
  type: "CHEQUING" | "SAVINGS" | "CASH" | "CREDIT_CARD";
  balance: number;
  creditLimit?: number;
};

type UpdateAccountInput = {
  name?: string;
  balance?: number;
  creditLimit?: number;
};

export async function getAccounts(userId: number) {
  return prisma.account.findMany({
    where: {
      userId,
      isArchived: false,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function getAccountById(
  userId: number,
  accountId: number
) {
  return prisma.account.findFirst({
    where: {
      id: accountId,
      userId,
    },
  });
}

export async function createAccount(
  userId: number,
  input: CreateAccountInput
) {
  return prisma.account.create({
    data: {
      userId,
      name: input.name,
      type: input.type,
      balance: input.balance,
      creditLimit:
        input.type === "CREDIT_CARD"
          ? input.creditLimit
          : null,
    },
  });
}

export async function updateAccount(
  userId: number,
  accountId: number,
  input: UpdateAccountInput
) {
  const account = await getAccountById(userId, accountId);

  if (!account) {
    throw new Error("Account not found");
  }

  return prisma.account.update({
    where: {
      id: accountId,
    },
    data: {
      name: input.name,
      balance: input.balance,
      creditLimit:
        account.type === "CREDIT_CARD"
          ? input.creditLimit
          : undefined,
    },
  });
}

export async function archiveAccount(
  userId: number,
  accountId: number
) {
  const account = await getAccountById(userId, accountId);

  if (!account) {
    throw new Error("Account not found");
  }

  return prisma.account.update({
    where: {
      id: accountId,
    },
    data: {
      isArchived: true,
    },
  });
}