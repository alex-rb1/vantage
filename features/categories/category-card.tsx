"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CategoryEditForm } from "./category-edit-form";

type CategoryCardProps = {
  category: {
    id: number;
    name: string;
    color: string;
  };
};

export function CategoryCard({ category }: CategoryCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            type="button"
            className="w-full text-left"
          />
        }
      >
        <Card className="h-full cursor-pointer">
          <CardHeader>
            <CardTitle>{category.name}</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="flex items-center gap-2">
              <div
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: category.color }}
              />

              <span className="text-sm text-muted-foreground">
                {category.color}
              </span>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {category.name}</DialogTitle>
        </DialogHeader>

        <CategoryEditForm category={category} />
      </DialogContent>
    </Dialog>
  );
}