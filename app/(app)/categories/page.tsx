import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getCategories } from "@/features/categories/category.service";
import { CategoryForm } from "@/features/categories/category-form";
import { CategoryCard } from "@/features/categories/category-card";

export default async function CategoriesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const categories = await getCategories(user.id);

  return (
    <main className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Categories</h1>
        <p className="text-sm text-muted-foreground">
          Organize your spending categories.
        </p>
      </div>

      <div className="mb-8 max-w-md">
        <CategoryForm />
      </div>

      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          You haven&apos;t added any categories yet.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <CategoryCard
                key={category.id}
                category={{
                id: category.id,
                name: category.name,
                color: category.color,
                }}
            />
            ))}
        </div>
      )}
    </main>
  );
}