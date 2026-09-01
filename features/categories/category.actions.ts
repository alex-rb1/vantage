"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import {
  createCategory,
  createStarterCategories,
  deleteCategory,
  updateCategory,
} from "./category.service";
import {
  createCategorySchema,
  updateCategorySchema,
} from "./category.schemas";
import { redirect } from "next/navigation";

export type CategoryActionState = {
  error?: string;
};

export async function createCategoryAction(
  prevState: CategoryActionState,
  formData: FormData
) {
  const user = await getCurrentUser();

  if (!user) {
    return { error: "You must be logged in." };
  }

  const result = createCategorySchema.safeParse({
    name: formData.get("name"),
    color: formData.get("color"),
  });

  if (!result.success) {
    return {
      error:
        result.error.issues[0]?.message ??
        "Invalid category information.",
    };
  }

  try {
    await createCategory(user.id, result.data);
  } catch {
    // We'll improve Prisma-specific duplicate handling during refactoring.
    return { error: "Duplicate category name." };
  }

  revalidatePath("/categories");

  return {};
}

export async function updateCategoryAction(
  categoryId: number,
  prevState: CategoryActionState,
  formData: FormData
) {
  const user = await getCurrentUser();

  if (!user) {
    return { error: "You must be logged in." };
  }

  const result = updateCategorySchema.safeParse({
    name: formData.get("name"),
    color: formData.get("color"),
  });

  if (!result.success) {
    return {
      error:
        result.error.issues[0]?.message ??
        "Invalid category information.",
    };
  }

  try {
    await updateCategory(user.id, categoryId, result.data);
  } catch {
    return { error: "Could not update category." };
  }

  revalidatePath("/categories");

  return {};
}

export async function deleteCategoryAction(categoryId: number) {
  const user = await getCurrentUser();

  if (!user) {
    return;
  }

  await deleteCategory(user.id, categoryId);

  revalidatePath("/categories");
  redirect("/categories");
}

export async function createStarterCategoriesAction(
  categoryNames: string[]
) {
  const user = await getCurrentUser();

  if (!user) {
    return {
      error: "You must be logged in.",
    };
  }

  if (categoryNames.length === 0) {
    return {
      error: "Select at least one category.",
    };
  }

  await createStarterCategories(user.id, categoryNames);

  revalidatePath("/categories");

  return {};
}