import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getAccounts } from "@/features/accounts/account.service";
import { getCategories } from "@/features/categories/category.service";
import { TransactionForm } from "@/features/transactions/transaction-form";
import { getTransactionById } from "@/features/transactions/transaction.service";
import { getCurrentUser } from "@/lib/auth/session";

export default async function TransactionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ transactionId: string }>;
  searchParams: Promise<{ updated?: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [{ transactionId }, { updated }] = await Promise.all([
    params,
    searchParams,
  ]);
  const id = Number(transactionId);

  if (!Number.isInteger(id) || id <= 0) {
    notFound();
  }

  const [transaction, accounts, categories] = await Promise.all([
    getTransactionById(user.id, id),
    getAccounts(user.id),
    getCategories(user.id),
  ]);

  if (!transaction) {
    notFound();
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6">
        <Button
          render={<Link href="/transactions" />}
          nativeButton={false}
          variant="ghost"
          size="sm"
        >
          ← Back to transactions
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Transaction details</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Changes are applied atomically to the affected account balances.
        </p>
      </div>

      {updated === "true" && (
        <div
          className="mb-6 max-w-2xl rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
          role="status"
        >
          Transaction updated successfully.
        </div>
      )}

      <TransactionForm
        accounts={accounts.map((account) => ({
          id: account.id,
          name: account.name,
          type: account.type,
        }))}
        categories={categories.map((category) => ({
          id: category.id,
          name: category.name,
        }))}
        transaction={{
          id: transaction.id,
          type: transaction.type,
          amount: transaction.amount.toNumber(),
          date: transaction.date.toISOString().slice(0, 10),
          description: transaction.description ?? "",
          accountId: transaction.accountId,
          destinationAccountId: transaction.destinationAccountId,
          categoryId: transaction.categoryId,
        }}
      />
    </div>
  );
}
