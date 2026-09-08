import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getAccounts } from "@/features/accounts/account.service";
import { getCurrentUser } from "@/lib/auth/session";
import { getCategories } from "@/features/categories/category.service";
import { TransactionForm } from "@/features/transactions/transaction-form";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [{ created }, accounts, categories] = await Promise.all([
    searchParams,
    getAccounts(user.id),
    getCategories(user.id),
  ]);

  const accountOptions = accounts.map((account) => ({
    id: account.id,
    name: account.name,
    type: account.type,
  }));
  const categoryOptions = categories.map((category) => ({
    id: category.id,
    name: category.name,
  }));

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Transactions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Record money coming in, going out, or moving between accounts.
        </p>
      </div>

      {created === "true" && (
        <div
          className="mb-6 max-w-2xl rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
          role="status"
        >
          Transaction added successfully.
        </div>
      )}

      {accounts.length === 0 ? (
        <div className="max-w-2xl rounded-2xl border bg-card p-6">
          <h2 className="font-medium">Add an account first</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Transactions need an active account to update.
          </p>
          <Button render={<Link href="/accounts" />} className="mt-4">
            Go to accounts
          </Button>
        </div>
      ) : (
        <TransactionForm
          accounts={accountOptions}
          categories={categoryOptions}
        />
      )}
    </div>
  );
}
