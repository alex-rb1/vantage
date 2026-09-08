"use client";

import { useActionState, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  createTransactionAction,
  deleteTransactionAction,
  type TransactionActionState,
  updateTransactionAction,
} from "./transaction.actions";

type AccountOption = {
  id: number;
  name: string;
  type: "CHEQUING" | "SAVINGS" | "CASH" | "CREDIT_CARD";
};

type TransactionFormProps = {
  accounts: AccountOption[];
  categories: Array<{
    id: number;
    name: string;
  }>;
  transaction?: {
    id: number;
    type: "INCOME" | "EXPENSE" | "TRANSFER";
    amount: number;
    date: string;
    description: string;
    accountId: number;
    destinationAccountId: number | null;
    categoryId: number | null;
  };
};

const initialState: TransactionActionState = {};

export function TransactionForm({
  accounts,
  categories,
  transaction,
}: TransactionFormProps) {
  const submitAction = transaction
    ? updateTransactionAction.bind(null, transaction.id)
    : createTransactionAction;
  const [state, action, pending] = useActionState(
    submitAction,
    initialState
  );
  const [type, setType] = useState<"INCOME" | "EXPENSE" | "TRANSFER">(
    transaction?.type ?? "EXPENSE"
  );
  const [accountId, setAccountId] = useState(
    transaction ? String(transaction.accountId) : ""
  );

  const sourceAccounts = useMemo(
    () =>
      type === "INCOME" || type === "TRANSFER"
        ? accounts.filter((account) => account.type !== "CREDIT_CARD")
        : accounts,
    [accounts, type]
  );

  const destinationAccounts = accounts.filter(
    (account) => String(account.id) !== accountId
  );

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{transaction ? "Edit transaction" : "Add transaction"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">Transaction type</Label>
              <select
                id="type"
                name="type"
                value={type}
                onChange={(event) => {
                  setType(event.target.value as typeof type);
                  setAccountId("");
                }}
                className="h-9 w-full rounded-4xl border border-input bg-input/30 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <option value="EXPENSE">Expense</option>
                <option value="INCOME">Income</option>
                <option value="TRANSFER">Transfer / card payment</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                defaultValue={transaction?.amount}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountId">
                {type === "TRANSFER" ? "From account" : "Account"}
              </Label>
              <select
                id="accountId"
                name="accountId"
                value={accountId}
                onChange={(event) => setAccountId(event.target.value)}
                className="h-9 w-full rounded-4xl border border-input bg-input/30 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                required
              >
                <option value="">Select an account</option>
                {sourceAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.type.replace("_", " ")})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={
                  transaction?.date ?? new Date().toLocaleDateString("en-CA")
                }
                required
              />
            </div>
          </div>

          {type === "EXPENSE" && (
            <div className="space-y-2">
              <Label htmlFor="categoryId">Category</Label>
              <select
                id="categoryId"
                name="categoryId"
                defaultValue={transaction?.categoryId ?? ""}
                className="h-9 w-full rounded-4xl border border-input bg-input/30 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                required
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {type === "TRANSFER" && (
            <div className="space-y-2">
              <Label htmlFor="destinationAccountId">To account</Label>
              <select
                id="destinationAccountId"
                name="destinationAccountId"
                defaultValue={transaction?.destinationAccountId ?? ""}
                className="h-9 w-full rounded-4xl border border-input bg-input/30 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                required
              >
                <option value="">Select a destination</option>
                {destinationAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.type.replace("_", " ")})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              placeholder="Optional note"
              defaultValue={transaction?.description}
            />
          </div>

          {state.error && (
            <p className="text-sm text-destructive" aria-live="polite">
              {state.error}
            </p>
          )}

          <Button type="submit" disabled={pending || sourceAccounts.length === 0}>
            {pending
              ? "Saving transaction..."
              : transaction
                ? "Save changes"
                : "Add transaction"}
          </Button>
        </form>

        {transaction && (
          <div className="mt-8 border-t pt-6">
            <p className="mb-3 text-sm text-muted-foreground">
              Deleting this transaction will reverse its account balance effects.
            </p>
            <Dialog>
              <DialogTrigger
                render={
                  <Button type="button" variant="destructive">
                    Delete transaction
                  </Button>
                }
              />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete this transaction?</DialogTitle>
                  <DialogDescription>
                    This will reverse the transaction&apos;s balance effects and
                    permanently remove its record.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose render={<Button type="button" variant="outline" />}>
                    Cancel
                  </DialogClose>
                  <form action={deleteTransactionAction.bind(null, transaction.id)}>
                    <Button type="submit" variant="destructive">
                      Delete transaction
                    </Button>
                  </form>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
