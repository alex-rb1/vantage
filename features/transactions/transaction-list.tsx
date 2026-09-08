import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  ArrowLeftRightIcon,
  ArrowUp01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type TransactionListProps = {
  transactions: Array<{
    id: number;
    type: "INCOME" | "EXPENSE" | "TRANSFER";
    amount: number;
    date: string;
    description: string | null;
    account: { name: string; type: string };
    destinationAccount: { name: string; type: string } | null;
    category: { name: string; color: string } | null;
  }>;
  accounts: Array<{ id: number; name: string }>;
  categories: Array<{ id: number; name: string }>;
  filters: {
    type?: string;
    accountId?: string;
    categoryId?: string;
    sort?: string;
  };
};

const selectClassName =
  "h-9 rounded-4xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

function transactionPresentation(transaction: TransactionListProps["transactions"][number]) {
  if (transaction.type === "INCOME") {
    return {
      label: "Income",
      amountPrefix: "+",
      amountClassName: "text-green-700",
      icon: ArrowDown01Icon,
    };
  }

  if (transaction.type === "EXPENSE") {
    return {
      label: transaction.category?.name ?? "Expense",
      amountPrefix: "−",
      amountClassName: "text-destructive",
      icon: ArrowUp01Icon,
    };
  }

  return {
    label:
      transaction.destinationAccount?.type === "CREDIT_CARD"
        ? "Credit card payment"
        : "Transfer",
    amountPrefix: "",
    amountClassName: "text-foreground",
    icon: ArrowLeftRightIcon,
  };
}

export function TransactionList({
  transactions,
  accounts,
  categories,
  filters,
}: TransactionListProps) {
  return (
    <section className="mt-10" aria-labelledby="transaction-history-heading">
      <div className="mb-4">
        <h2 id="transaction-history-heading" className="text-xl font-semibold">
          Transaction history
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Review money moving through your accounts.
        </p>
      </div>

      <form className="mb-5 flex flex-wrap items-end gap-3" method="get">
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Type</span>
          <select name="type" defaultValue={filters.type ?? ""} className={selectClassName}>
            <option value="">All types</option>
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
            <option value="TRANSFER">Transfer / payment</option>
          </select>
        </label>

        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Account</span>
          <select
            name="accountId"
            defaultValue={filters.accountId ?? ""}
            className={selectClassName}
          >
            <option value="">All accounts</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Category</span>
          <select
            name="categoryId"
            defaultValue={filters.categoryId ?? ""}
            className={selectClassName}
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Sort</span>
          <select name="sort" defaultValue={filters.sort ?? "newest"} className={selectClassName}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="amount-high">Highest amount</option>
            <option value="amount-low">Lowest amount</option>
          </select>
        </label>

        <Button type="submit" variant="secondary">
          Apply
        </Button>
        <Button
          render={<Link href="/transactions" />}
          nativeButton={false}
          variant="ghost"
        >
          Clear
        </Button>
      </form>

      {transactions.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No transactions match these filters.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {transactions.map((transaction) => {
            const presentation = transactionPresentation(transaction);
            const accountDescription = transaction.destinationAccount
              ? `${transaction.account.name} → ${transaction.destinationAccount.name}`
              : transaction.account.name;

            return (
              <Link key={transaction.id} href={`/transactions/${transaction.id}`}>
                <Card className="mb-2 transition-colors hover:bg-muted/50" size="sm">
                  <CardContent className="flex items-center gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                      <HugeiconsIcon icon={presentation.icon} strokeWidth={2} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {transaction.category && (
                          <span
                            className="size-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: transaction.category.color }}
                          />
                        )}
                        <p className="truncate font-medium">
                          {transaction.description || presentation.label}
                        </p>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {presentation.label} · {accountDescription} ·{" "}
                        {new Intl.DateTimeFormat("en-CA", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          timeZone: "UTC",
                        }).format(new Date(transaction.date))}
                      </p>
                    </div>

                    <p className={cn("shrink-0 font-semibold", presentation.amountClassName)}>
                      {presentation.amountPrefix}${transaction.amount.toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
