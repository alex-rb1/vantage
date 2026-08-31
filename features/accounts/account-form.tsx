"use client";

import { useActionState, useState } from "react";
import { createAccountAction } from "./account.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState = {
  error: "",
};

export function AccountForm() {
  const [state, action, pending] = useActionState(
    createAccountAction,
    initialState
  );

  const [type, setType] = useState("CHEQUING");

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Account name</Label>
        <Input
          id="name"
          name="name"
          placeholder="Everyday Chequing"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Account type</Label>
        <select
          id="type"
          name="type"
          value={type}
          onChange={(event) => setType(event.target.value)}
          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
        >
          <option value="CHEQUING">Chequing</option>
          <option value="SAVINGS">Savings</option>
          <option value="CASH">Cash</option>
          <option value="CREDIT_CARD">Credit Card</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="balance">
          {type === "CREDIT_CARD" ? "Current amount owed" : "Current balance"}
        </Label>
        <Input
          id="balance"
          name="balance"
          type="number"
          step="0.01"
          min="0"
          required
        />
      </div>

      {type === "CREDIT_CARD" && (
        <div className="space-y-2">
          <Label htmlFor="creditLimit">Credit limit</Label>
          <Input
            id="creditLimit"
            name="creditLimit"
            type="number"
            step="0.01"
            min="0"
            required
          />
        </div>
      )}

      {state.error && (
        <p className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Adding account..." : "Add account"}
      </Button>
    </form>
  );
}