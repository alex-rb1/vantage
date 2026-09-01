"use client";

import { useActionState, useState } from "react";
import {
  deleteCategoryAction,
  updateCategoryAction,
} from "./category.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CategoryEditFormProps = {
  category: {
    id: number;
    name: string;
    color: string;
  };
};

const initialState = {
  error: "",
};

export function CategoryEditForm({
  category,
}: CategoryEditFormProps) {
  const [name, setName] = useState(category.name);
  const [color, setColor] = useState(category.color);

  const updateAction = updateCategoryAction.bind(
    null,
    category.id
  );

  const [state, action, pending] = useActionState(
    updateAction,
    initialState
  );

  const deleteAction = deleteCategoryAction.bind(
    null,
    category.id
  );

  return (
    <div className="space-y-8">
      <form action={action} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Category name</Label>
          <Input
            id="name"
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
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
          {pending ? "Saving..." : "Save changes"}
        </Button>
      </form>

      <form action={deleteAction}>
        <Button type="submit" variant="outline">
          Delete category
        </Button>
      </form>
    </div>
  );
}