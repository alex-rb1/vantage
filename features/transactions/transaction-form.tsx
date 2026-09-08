"use client";

import { useActionState, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createTransactionAction,
  type TransactionActionState,
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
};

const initialState: TransactionActionState = {};

export function TransactionForm({ accounts, categories }: TransactionFormProps) {
  const [state, action, pending] = useActionState(
    createTransactionAction,
    initialState
  );
  const [type, setType] = useState<"INCOME" | "EXPENSE" | "TRANSFER">(
    "EXPENSE"
  );
  const [accountId, setAccountId] = useState("");

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
        <CardTitle>Add transaction</CardTitle>
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
                defaultValue={new Date().toLocaleDateString("en-CA")}
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
            />
          </div>

          {state.error && (
            <p className="text-sm text-destructive" aria-live="polite">
              {state.error}
            </p>
          )}

          <Button type="submit" disabled={pending || sourceAccounts.length === 0}>
            {pending ? "Saving transaction..." : "Add transaction"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
