import { prisma } from "@/lib/db/prisma";
import { STARTER_CATEGORIES } from "./category.constants";

type CreateCategoryInput = {
  name: string;
  color: string;
};

type UpdateCategoryInput = {
  name?: string;
  color?: string;
};

export async function getCategories(userId: number) {
  return prisma.category.findMany({
    where: {
      userId,
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function getCategoryById(
  userId: number,
  categoryId: number
) {
  return prisma.category.findFirst({
    where: {
      id: categoryId,
      userId,
    },
  });
}

export async function createCategory(
  userId: number,
  input: CreateCategoryInput
) {
  return prisma.category.create({
    data: {
      userId,
      name: input.name,
      color: input.color,
    },
  });
}

export async function updateCategory(
  userId: number,
  categoryId: number,
  input: UpdateCategoryInput
) {
  const category = await getCategoryById(userId, categoryId);

  if (!category) {
    throw new Error("Category not found");
  }

  return prisma.category.update({
    where: {
      id: categoryId,
    },
    data: input,
  });
}

export async function deleteCategory(
  userId: number,
  categoryId: number
) {
  const category = await getCategoryById(userId, categoryId);

  if (!category) {
    throw new Error("Category not found");
  }

  return prisma.category.delete({
    where: {
      id: categoryId,
    },
  });
}

export async function createStarterCategories(
  userId: number,
  categoryNames: string[]
) {
  const selectedCategories = STARTER_CATEGORIES.filter((category) =>
    categoryNames.includes(category.name)
  );

  return prisma.category.createMany({
    data: selectedCategories.map((category) => ({
      userId,
      name: category.name,
      color: category.color,
    })),
    skipDuplicates: true,
  });
}