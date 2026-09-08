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

export async function getTransactionById(
  userId: number,
  transactionId: number
) {
  return prisma.transaction.findFirst({
    where: {
      id: transactionId,
      userId,
    },
    include: {
      account: true,
      destinationAccount: true,
      category: true,
    },
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

async function applyTransactionEffects(
  tx: TransactionClient,
  userId: number,
  input: CreateTransactionInput
) {
  const account = await getOwnedAccount(tx, userId, input.accountId);

  if (input.type === "INCOME") {
    if (account.type === "CREDIT_CARD") {
      throw new Error("Income cannot be added to a credit card");
    }

    await tx.account.update({
      where: { id: account.id },
      data: { balance: { increment: input.amount } },
    });
    return;
  }

  if (input.type === "EXPENSE") {
    if (!input.categoryId) {
      throw new Error("Category is required for expenses");
    }

    const category = await tx.category.findFirst({
      where: { id: input.categoryId, userId },
    });

    if (!category) {
      throw new Error("Category not found");
    }

    if (account.type === "CREDIT_CARD") {
      if (account.creditLimit === null) {
        throw new Error("Credit card must have a credit limit");
      }

      if (account.balance.add(input.amount).greaterThan(account.creditLimit)) {
        throw new Error("Transaction exceeds credit limit");
      }

      await tx.account.update({
        where: { id: account.id },
        data: { balance: { increment: input.amount } },
      });
    } else {
      await tx.account.update({
        where: { id: account.id },
        data: { balance: { decrement: input.amount } },
      });
    }
    return;
  }

  if (!input.destinationAccountId) {
    throw new Error("Destination account is required for transfers");
  }

  if (input.accountId === input.destinationAccountId) {
    throw new Error("Source and destination accounts must be different");
  }

  if (account.type === "CREDIT_CARD") {
    throw new Error("Transfers from credit cards are not supported");
  }

  const destinationAccount = await getOwnedAccount(
    tx,
    userId,
    input.destinationAccountId
  );

  if (
    destinationAccount.type === "CREDIT_CARD" &&
    destinationAccount.balance.lessThan(input.amount)
  ) {
    throw new Error("Payment cannot exceed credit card balance");
  }

  await tx.account.update({
    where: { id: account.id },
    data: { balance: { decrement: input.amount } },
  });

  await tx.account.update({
    where: { id: destinationAccount.id },
    data: {
      balance:
        destinationAccount.type === "CREDIT_CARD"
          ? { decrement: input.amount }
          : { increment: input.amount },
    },
  });
}

type StoredTransaction = {
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: Prisma.Decimal;
  accountId: number;
  destinationAccountId: number | null;
  account: { type: "CHEQUING" | "SAVINGS" | "CASH" | "CREDIT_CARD" };
  destinationAccount: {
    type: "CHEQUING" | "SAVINGS" | "CASH" | "CREDIT_CARD";
  } | null;
};

async function reverseTransactionEffects(
  tx: TransactionClient,
  transaction: StoredTransaction
) {
  if (transaction.type === "INCOME") {
    await tx.account.update({
      where: { id: transaction.accountId },
      data: { balance: { decrement: transaction.amount } },
    });
    return;
  }

  if (transaction.type === "EXPENSE") {
    await tx.account.update({
      where: { id: transaction.accountId },
      data: {
        balance:
          transaction.account.type === "CREDIT_CARD"
            ? { decrement: transaction.amount }
            : { increment: transaction.amount },
      },
    });
    return;
  }

  await tx.account.update({
    where: { id: transaction.accountId },
    data: { balance: { increment: transaction.amount } },
  });

  if (!transaction.destinationAccountId || !transaction.destinationAccount) {
    throw new Error("Transaction destination account not found");
  }

  await tx.account.update({
    where: { id: transaction.destinationAccountId },
    data: {
      balance:
        transaction.destinationAccount.type === "CREDIT_CARD"
          ? { increment: transaction.amount }
          : { decrement: transaction.amount },
    },
  });
}

export async function createTransaction(
  userId: number,
  input: CreateTransactionInput
) {
  return prisma.$transaction(async (tx) => {
    await applyTransactionEffects(tx, userId, input);

    return tx.transaction.create({
      data: {
        userId,
        type: input.type,
        amount: input.amount,
        date: input.date,
        description: input.description,
        accountId: input.accountId,
        ...(input.type === "TRANSFER"
          ? { destinationAccountId: input.destinationAccountId }
          : {}),
        ...(input.type === "EXPENSE" ? { categoryId: input.categoryId } : {}),
      },
    });
  });
}

export async function updateTransaction(
  userId: number,
  transactionId: number,
  input: CreateTransactionInput
) {
  return prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.findFirst({
      where: { id: transactionId, userId },
      include: { account: true, destinationAccount: true },
    });

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    await reverseTransactionEffects(tx, transaction);
    await applyTransactionEffects(tx, userId, input);

    return tx.transaction.update({
      where: { id: transaction.id },
      data: {
        type: input.type,
        amount: input.amount,
        date: input.date,
        description: input.description ?? null,
        accountId: input.accountId,
        destinationAccountId:
          input.type === "TRANSFER" ? input.destinationAccountId : null,
        categoryId: input.type === "EXPENSE" ? input.categoryId : null,
      },
    });
  });
}

export async function deleteTransaction(
  userId: number,
  transactionId: number
) {
  return prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.findFirst({
      where: { id: transactionId, userId },
      include: { account: true, destinationAccount: true },
    });

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    await reverseTransactionEffects(tx, transaction);

    return tx.transaction.delete({
      where: { id: transaction.id },
    });
  });
}
