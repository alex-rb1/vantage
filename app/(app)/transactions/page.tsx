import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getAccounts } from "@/features/accounts/account.service";
import { getCurrentUser } from "@/lib/auth/session";
import { getCategories } from "@/features/categories/category.service";
import { TransactionForm } from "@/features/transactions/transaction-form";
import { TransactionList } from "@/features/transactions/transaction-list";
import {
  getTransactions,
  type TransactionFilters,
} from "@/features/transactions/transaction.service";

type TransactionSearchParams = {
  created?: string;
  deleted?: string;
  type?: string;
  accountId?: string;
  categoryId?: string;
  sort?: string;
};

function positiveInteger(value?: string) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : undefined;
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<TransactionSearchParams>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const filters: TransactionFilters = {
    type: ["INCOME", "EXPENSE", "TRANSFER"].includes(params.type ?? "")
      ? (params.type as TransactionFilters["type"])
      : undefined,
    accountId: positiveInteger(params.accountId),
    categoryId: positiveInteger(params.categoryId),
    sort: ["newest", "oldest", "amount-high", "amount-low"].includes(
      params.sort ?? ""
    )
      ? (params.sort as TransactionFilters["sort"])
      : undefined,
  };

  const [accounts, categories, transactions] = await Promise.all([
    getAccounts(user.id),
    getCategories(user.id),
    getTransactions(user.id, filters),
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

      {params.created === "true" && (
        <div
          className="mb-6 max-w-2xl rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
          role="status"
        >
          Transaction added successfully.
        </div>
      )}

      {params.deleted === "true" && (
        <div
          className="mb-6 max-w-2xl rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
          role="status"
        >
          Transaction deleted and balance effects reversed.
        </div>
      )}

      {accounts.length === 0 ? (
        <div className="max-w-2xl rounded-2xl border bg-card p-6">
          <h2 className="font-medium">Add an account first</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Transactions need an active account to update.
          </p>
          <Button
            render={<Link href="/accounts" />}
            nativeButton={false}
            className="mt-4"
          >
            Go to accounts
          </Button>
        </div>
      ) : (
        <TransactionForm
          accounts={accountOptions}
          categories={categoryOptions}
        />
      )}

      <TransactionList
        transactions={transactions.map((transaction) => ({
          id: transaction.id,
          type: transaction.type,
          amount: transaction.amount.toNumber(),
          date: transaction.date.toISOString(),
          description: transaction.description,
          account: transaction.account,
          destinationAccount: transaction.destinationAccount,
          category: transaction.category,
        }))}
        accounts={accountOptions}
        categories={categoryOptions}
        filters={params}
      />
    </div>
  );
}
