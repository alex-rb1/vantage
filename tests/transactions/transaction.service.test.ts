import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@/generated/prisma/client";

const mocks = vi.hoisted(() => ({
  accountFindFirst: vi.fn(),
  accountUpdate: vi.fn(),
  categoryFindFirst: vi.fn(),
  transactionCreate: vi.fn(),
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
    create: typeof mocks.transactionCreate;
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
          create: mocks.transactionCreate,
        },
      })
    ),
  },
}));

import { createTransaction } from "@/features/transactions/transaction.service";

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
});
