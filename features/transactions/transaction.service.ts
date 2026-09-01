import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";

type CreateTransactionInput = {
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number;
  date: Date;
  description?: string;
  accountId: number;
  destinationAccountId?: number;
  categoryId?: number;
};

type TransactionClient = Prisma.TransactionClient;

async function getOwnedAccount(
  tx: TransactionClient,
  userId: number,
  accountId: number
) {
  const account = await tx.account.findFirst({
    where: {
      id: accountId,
      userId,
      isArchived: false,
    },
  });

  if (!account) {
    throw new Error("Account not found");
  }

  return account;
}

export async function createTransaction(
  userId: number,
  input: CreateTransactionInput
) {
  return prisma.$transaction(async (tx) => {
    const account = await getOwnedAccount(tx, userId, input.accountId);

    if (input.type === "INCOME") {
      if (account.type === "CREDIT_CARD") {
        throw new Error("Income cannot be added to a credit card");
      }

      await tx.account.update({
        where: { id: account.id },
        data: {
          balance: {
            increment: input.amount,
          },
        },
      });

      return tx.transaction.create({
        data: {
          userId,
          type: input.type,
          amount: input.amount,
          date: input.date,
          description: input.description,
          accountId: input.accountId,
        },
      });
    }

    if (input.type === "EXPENSE") {
    if (!input.categoryId) {
      throw new Error("Category is required for expenses");
    }

    const category = await tx.category.findFirst({
      where: {
        id: input.categoryId,
        userId,
      },
    });

    if (!category) {
      throw new Error("Category not found");
    }

    if (account.type === "CREDIT_CARD") {
      await tx.account.update({
        where: { id: account.id },
        data: {
          balance: {
            increment: input.amount,
          },
        },
      });
    } else {
      await tx.account.update({
        where: { id: account.id },
        data: {
          balance: {
            decrement: input.amount,
          },
        },
      });
    }

    return tx.transaction.create({
      data: {
        userId,
        type: input.type,
        amount: input.amount,
        date: input.date,
        description: input.description,
        accountId: input.accountId,
        categoryId: input.categoryId,
      },
    });
  }

    throw new Error("Transaction type not implemented");
  });
}