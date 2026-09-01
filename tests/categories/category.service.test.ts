import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    category: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      createMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db/prisma";
import {
  createCategory,
  createStarterCategories,
  deleteCategory,
  getCategoryById,
  updateCategory,
} from "@/features/categories/category.service";

describe("category service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("gets a category only for the specified user", async () => {
    vi.mocked(prisma.category.findFirst).mockResolvedValue(null);

    await getCategoryById(1, 7);

    expect(prisma.category.findFirst).toHaveBeenCalledWith({
      where: {
        id: 7,
        userId: 1,
      },
    });
  });

  it("creates a custom category", async () => {
    vi.mocked(prisma.category.create).mockResolvedValue({} as never);

    await createCategory(1, {
      name: "Groceries",
      color: "#22c55e",
    });

    expect(prisma.category.create).toHaveBeenCalledWith({
      data: {
        userId: 1,
        name: "Groceries",
        color: "#22c55e",
      },
    });
  });

  it("rejects updating a category that does not belong to the user", async () => {
    vi.mocked(prisma.category.findFirst).mockResolvedValue(null);

    await expect(
      updateCategory(1, 99, {
        name: "Updated",
      })
    ).rejects.toThrow("Category not found");

    expect(prisma.category.update).not.toHaveBeenCalled();
  });

  it("rejects deleting a category that does not belong to the user", async () => {
    vi.mocked(prisma.category.findFirst).mockResolvedValue(null);

    await expect(
      deleteCategory(1, 99)
    ).rejects.toThrow("Category not found");

    expect(prisma.category.delete).not.toHaveBeenCalled();
  });

  it("creates only recognized starter categories", async () => {
    vi.mocked(prisma.category.createMany).mockResolvedValue({
      count: 2,
    });

    await createStarterCategories(1, [
      "Groceries",
      "Dining",
      "Fake Category",
    ]);

    expect(prisma.category.createMany).toHaveBeenCalledWith({
      data: [
        {
          userId: 1,
          name: "Groceries",
          color: "#22c55e",
        },
        {
          userId: 1,
          name: "Dining",
          color: "#f97316",
        },
      ],
      skipDuplicates: true,
    });
  });
});