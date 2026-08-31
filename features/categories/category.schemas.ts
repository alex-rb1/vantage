import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required"),
  color: z.string().trim().min(1, "Color is required"),
});

export const updateCategorySchema = createCategorySchema.partial();