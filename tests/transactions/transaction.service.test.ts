import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@/generated/prisma/client";

const mocks = vi.hoisted(() => ({
  accountFindFirst: vi.fn(),
  accountUpdate: vi.fn(),
  categoryFindFirst: vi.fn(),
  transactionFindFirst: vi.fn(),
  transactionCreate: vi.fn(),
  transactionUpdate: vi.fn(),
  transactionDelete: vi.fn(),
}));

type MockTransactionCallback = (tx: {
  account: {
    findFirst: typeof mocks.accountFindFirst;
    update: typeof mocks.accountUpdate;
  };
  category: {
    findFirst: typeof mocks.categoryFindFirst;
  };
  transaction: {
    findFirst: typeof mocks.transactionFindFirst;
    create: typeof mocks.transactionCreate;
    update: typeof mocks.transactionUpdate;
    delete: typeof mocks.transactionDelete;
  };
}) => unknown;

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    $transaction: vi.fn(async (callback: MockTransactionCallback) =>
      callback({
        account: {
          findFirst: mocks.accountFindFirst,
          update: mocks.accountUpdate,
        },
        category: {
          findFirst: mocks.categoryFindFirst,
        },
        transaction: {
          findFirst: mocks.transactionFindFirst,
          create: mocks.transactionCreate,
          update: mocks.transactionUpdate,
          delete: mocks.transactionDelete,
        },
      })
    ),
  },
}));

import {
  createTransaction,
  deleteTransaction,
  updateTransaction,
} from "@/features/transactions/transaction.service";

describe("createTransaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a credit card expense that exceeds the credit limit", async () => {
    mocks.accountFindFirst.mockResolvedValue({
      id: 1,
      name: "Visa",
      type: "CREDIT_CARD",
      balance: new Prisma.Decimal("900.00"),
      creditLimit: new Prisma.Decimal("1000.00"),
      isArchived: false,
      userId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mocks.categoryFindFirst.mockResolvedValue({
      id: 1,
      name: "Groceries",
      color: "#22c55e",
      userId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      createTransaction(1, {
        type: "EXPENSE",
        amount: 150,
        date: new Date("2026-09-06T12:00:00.000Z"),
        description: "Groceries",
        accountId: 1,
        categoryId: 1,
      })
    ).rejects.toThrow("Transaction exceeds credit limit");

    expect(mocks.accountUpdate).not.toHaveBeenCalled();
    expect(mocks.transactionCreate).not.toHaveBeenCalled();
  });

  it("accepts a credit card expense that reaches the credit limit", async () => {
    mocks.accountFindFirst.mockResolvedValue({
      id: 1,
      balance: new Prisma.Decimal("900.00"),
      creditLimit: new Prisma.Decimal("1000.00"),
      type: "CREDIT_CARD",
    });

    mocks.categoryFindFirst.mockResolvedValue({
      id: 1,
    });

    mocks.accountUpdate.mockResolvedValue({});
    mocks.transactionCreate.mockResolvedValue({ id: 1 });

    await createTransaction(1, {
      type: "EXPENSE",
      amount: 100,
      date: new Date("2026-09-06T12:00:00.000Z"),
      description: "Groceries",
      accountId: 1,
      categoryId: 1,
    });

    expect(mocks.accountUpdate).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        balance: {
          increment: 100,
        },
      },
    });

    expect(mocks.transactionCreate).toHaveBeenCalledWith({
      data: {
        userId: 1,
        type: "EXPENSE",
        amount: 100,
        date: new Date("2026-09-06T12:00:00.000Z"),
        description: "Groceries",
        accountId: 1,
        categoryId: 1,
      },
    });
  });

  it("reverses the old expense before applying an edited amount", async () => {
    mocks.transactionFindFirst.mockResolvedValue({
      id: 10,
      type: "EXPENSE",
      amount: new Prisma.Decimal("10.00"),
      accountId: 1,
      destinationAccountId: null,
      account: { type: "CHEQUING" },
      destinationAccount: null,
    });
    mocks.accountFindFirst.mockResolvedValue({
      id: 1,
      type: "CHEQUING",
    });
    mocks.categoryFindFirst.mockResolvedValue({ id: 1 });
    mocks.accountUpdate.mockResolvedValue({});
    mocks.transactionUpdate.mockResolvedValue({ id: 10 });

    await updateTransaction(1, 10, {
      type: "EXPENSE",
      amount: 15,
      date: new Date("2026-09-08T12:00:00.000Z"),
      description: "Updated groceries",
      accountId: 1,
      categoryId: 1,
    });

    expect(mocks.accountUpdate).toHaveBeenNthCalledWith(1, {
      where: { id: 1 },
      data: { balance: { increment: new Prisma.Decimal("10.00") } },
    });
    expect(mocks.accountUpdate).toHaveBeenNthCalledWith(2, {
      where: { id: 1 },
      data: { balance: { decrement: 15 } },
    });
    expect(mocks.transactionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 10 } })
    );
  });

  it("reverses both sides before deleting a credit card payment", async () => {
    mocks.transactionFindFirst.mockResolvedValue({
      id: 20,
      type: "TRANSFER",
      amount: new Prisma.Decimal("40.00"),
      accountId: 2,
      destinationAccountId: 3,
      account: { type: "SAVINGS" },
      destinationAccount: { type: "CREDIT_CARD" },
    });
    mocks.accountUpdate.mockResolvedValue({});
    mocks.transactionDelete.mockResolvedValue({ id: 20 });

    await deleteTransaction(1, 20);

    expect(mocks.accountUpdate).toHaveBeenNthCalledWith(1, {
      where: { id: 2 },
      data: { balance: { increment: new Prisma.Decimal("40.00") } },
    });
    expect(mocks.accountUpdate).toHaveBeenNthCalledWith(2, {
      where: { id: 3 },
      data: { balance: { increment: new Prisma.Decimal("40.00") } },
    });
    expect(mocks.transactionDelete).toHaveBeenCalledWith({
      where: { id: 20 },
    });
  });

  it("rejects editing a transaction that does not belong to the user", async () => {
    mocks.transactionFindFirst.mockResolvedValue(null);

    await expect(
      updateTransaction(1, 99, {
        type: "INCOME",
        amount: 50,
        date: new Date("2026-09-08T12:00:00.000Z"),
        accountId: 1,
      })
    ).rejects.toThrow("Transaction not found");

    expect(mocks.accountUpdate).not.toHaveBeenCalled();
    expect(mocks.transactionUpdate).not.toHaveBeenCalled();
  });
});
