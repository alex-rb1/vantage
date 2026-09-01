"use client";

import { useState } from "react";
import { createStarterCategoriesAction } from "./category.actions";
import { STARTER_CATEGORIES } from "./category.constants";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function StarterCategorySelector() {
  const [open, setOpen] = useState(false);
const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");

  function toggleCategory(name: string) {
    setSelected((current) =>
      current.includes(name)
        ? current.filter((category) => category !== name)
        : [...current, name]
    );
  }

  async function handleSubmit() {
    setError("");

    const result = await createStarterCategoriesAction(selected);

    if (result.error) {
      setError(result.error);
      return;
    }

    setSelected([]);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button type="button" variant="outline">
            Add starter categories
          </Button>
        }
      />

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Choose starter categories</DialogTitle>
        </DialogHeader>

        <div className="grid gap-2 sm:grid-cols-2">
          {STARTER_CATEGORIES.map((category) => {
            const isSelected = selected.includes(category.name);

            return (
              <button
                key={category.name}
                type="button"
                onClick={() => toggleCategory(category.name)}
                className={`flex items-center gap-3 rounded-md border p-3 text-left ${
                  isSelected ? "bg-muted" : ""
                }`}
              >
                <div
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: category.color }}
                />

                <span>{category.name}</span>
              </button>
            );
          })}
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={selected.length === 0}
        >
          Add selected
        </Button>
      </DialogContent>
    </Dialog>
  );
}