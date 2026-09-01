"use client";

import { useActionState, useState } from "react";
import { createCategoryAction } from "./category.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState = {
  error: "",
};

export function CategoryForm() {
  const [state, action, pending] = useActionState(
    createCategoryAction,
    initialState
  );

  const [color, setColor] = useState("#64748b");

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Category name</Label>
        <Input
          id="name"
          name="name"
          placeholder="Groceries"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="color">Color</Label>

        <div className="flex items-center gap-3">
          <input
            id="color"
            name="color"
            type="color"
            value={color}
            onChange={(event) => setColor(event.target.value)}
            className="h-10 w-14 cursor-pointer rounded border"
          />

          <span className="text-sm text-muted-foreground">
            {color}
          </span>
        </div>
      </div>

      {state.error && (
        <p className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Adding category..." : "Add category"}
      </Button>
    </form>
  );
}