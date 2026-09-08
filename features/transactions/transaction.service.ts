import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";

export type CreateTransactionInput = {
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number;
  date: Date;
  description?: string;
  accountId: number;
  destinationAccountId?: number;
  categoryId?: number;
};

type TransactionClient = Prisma.TransactionClient;

export type TransactionFilters = {
  type?: "INCOME" | "EXPENSE" | "TRANSFER";
  accountId?: number;
  categoryId?: number;
  sort?: "newest" | "oldest" | "amount-high" | "amount-low";
};

export async function getTransactions(
  userId: number,
  filters: TransactionFilters = {}
) {
  const orderBy: Prisma.TransactionOrderByWithRelationInput =
    filters.sort === "oldest"
      ? { date: "asc" }
      : filters.sort === "amount-high"
        ? { amount: "desc" }
        : filters.sort === "amount-low"
          ? { amount: "asc" }
          : { date: "desc" };

  return prisma.transaction.findMany({
    where: {
      userId,
      type: filters.type,
      categoryId: filters.categoryId,
      ...(filters.accountId
        ? {
            OR: [
              { accountId: filters.accountId },
              { destinationAccountId: filters.accountId },
            ],
          }
        : {}),
    },
    include: {
      account: {
        select: { id: true, name: true, type: true },
      },
      destinationAccount: {
        select: { id: true, name: true, type: true },
      },
      category: {
        select: { id: true, name: true, color: true },
      },
    },
    orderBy,
  });
}

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
        if (account.creditLimit === null) {
          throw new Error("Credit card must have a credit limit");
        }

        const resultingBalance = account.balance.add(input.amount);

        if (resultingBalance.greaterThan(account.creditLimit)) {
          throw new Error("Transaction exceeds credit limit");
        }

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
    if (input.type === "TRANSFER") {
    if (!input.destinationAccountId) {
      throw new Error("Destination account is required for transfers");
    }

    if (input.accountId === input.destinationAccountId) {
      throw new Error("Source and destination accounts must be different");
    }

    const destinationAccount = await getOwnedAccount(
      tx,
      userId,
      input.destinationAccountId
    );

    if (account.type === "CREDIT_CARD") {
      throw new Error("Transfers from credit cards are not supported");
    }

    await tx.account.update({
      where: { id: account.id },
      data: {
        balance: {
          decrement: input.amount,
        },
      },
    });

    if (destinationAccount.type === "CREDIT_CARD") {
      if (input.amount > destinationAccount.balance.toNumber()) {
        throw new Error("Payment cannot exceed credit card balance");
      }

      await tx.account.update({
        where: { id: destinationAccount.id },
        data: {
          balance: {
            decrement: input.amount,
          },
        },
      });
    } else {
      await tx.account.update({
        where: { id: destinationAccount.id },
        data: {
          balance: {
            increment: input.amount,
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
        destinationAccountId: input.destinationAccountId,
      },
    });
  }

    throw new Error("Transaction type not implemented");
  });
}
