import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    account: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db/prisma";
import {
  archiveAccount,
  createAccount,
  getAccountById,
  updateAccount,
} from "@/features/accounts/account.service";

describe("account service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("gets an account only for the specified user", async () => {
    vi.mocked(prisma.account.findFirst).mockResolvedValue(null);

    await getAccountById(1, 7);

    expect(prisma.account.findFirst).toHaveBeenCalledWith({
      where: {
        id: 7,
        userId: 1,
      },
    });
  });

  it("creates a credit card with a credit limit", async () => {
    vi.mocked(prisma.account.create).mockResolvedValue({} as never);

    await createAccount(1, {
      name: "Visa",
      type: "CREDIT_CARD",
      balance: 500,
      creditLimit: 5000,
    });

    expect(prisma.account.create).toHaveBeenCalledWith({
      data: {
        userId: 1,
        name: "Visa",
        type: "CREDIT_CARD",
        balance: 500,
        creditLimit: 5000,
      },
    });
  });

  it("forces creditLimit to null for non-credit accounts", async () => {
    vi.mocked(prisma.account.create).mockResolvedValue({} as never);

    await createAccount(1, {
      name: "Chequing",
      type: "CHEQUING",
      balance: 1200,
      creditLimit: 5000,
    });

    expect(prisma.account.create).toHaveBeenCalledWith({
      data: {
        userId: 1,
        name: "Chequing",
        type: "CHEQUING",
        balance: 1200,
        creditLimit: null,
      },
    });
  });

  it("rejects updating an account that does not belong to the user", async () => {
    vi.mocked(prisma.account.findFirst).mockResolvedValue(null);

    await expect(
      updateAccount(1, 99, {
        name: "Updated Account",
      })
    ).rejects.toThrow("Account not found");

    expect(prisma.account.update).not.toHaveBeenCalled();
  });

  it("archives an owned account", async () => {
    vi.mocked(prisma.account.findFirst).mockResolvedValue({
      id: 2,
      name: "Old Savings",
      type: "SAVINGS",
      balance: 1000,
      creditLimit: null,
      isArchived: false,
      userId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    vi.mocked(prisma.account.update).mockResolvedValue({} as never);

    await archiveAccount(1, 2);

    expect(prisma.account.update).toHaveBeenCalledWith({
      where: {
        id: 2,
      },
      data: {
        isArchived: true,
      },
    });
  });
});