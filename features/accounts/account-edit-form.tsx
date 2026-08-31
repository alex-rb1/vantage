"use client";

import { useActionState, useState } from "react";
import {
  archiveAccountAction,
  updateAccountAction,
} from "./account.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AccountEditFormProps = {
  account: {
    id: number;
    name: string;
    type: "CHEQUING" | "SAVINGS" | "CASH" | "CREDIT_CARD";
    balance: number;
    creditLimit: number | null;
  };
};

const initialState = {
  error: "",
};

export function AccountEditForm({
  account,
}: AccountEditFormProps) {

    const [name, setName] = useState(account.name);
    const [balance, setBalance] = useState(String(account.balance));
    const [creditLimit, setCreditLimit] = useState(
    account.creditLimit !== null ? String(account.creditLimit) : ""
    );

  const updateAction = updateAccountAction.bind(null, account.id);

  const [state, action, pending] = useActionState(
    updateAction,
    initialState
  );

  const archiveAction = archiveAccountAction.bind(null, account.id);

  return (
    <div className="space-y-8">
      <form action={action} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Account name</Label>
            <Input
                id="name"
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
            />
        </div>

        <div className="space-y-2">
          <Label htmlFor="balance">
            {account.type === "CREDIT_CARD"
              ? "Current amount owed"
              : "Current balance"}
          </Label>
            <Input
                id="balance"
                name="balance"
                type="number"
                step="0.01"
                min="0"
                value={balance}
                onChange={(event) => setBalance(event.target.value)}
                required
            />
        </div>

        {account.type === "CREDIT_CARD" && (
          <div className="space-y-2">
            <Label htmlFor="creditLimit">Credit limit</Label>
            <Input
                id="creditLimit"
                name="creditLimit"
                type="number"
                step="0.01"
                min="0"
                value={creditLimit}
                onChange={(event) => setCreditLimit(event.target.value)}
                required
            />
          </div>
        )}

        {state.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}

        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save changes"}
        </Button>
      </form>

      <form action={archiveAction}>
        <Button type="submit" variant="outline">
          Archive account
        </Button>
      </form>
    </div>
  );
}