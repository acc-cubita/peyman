import { categories } from "@/data/categories";
import type { Category, Product } from "./types";

const categoryMap = new Map(categories.map((c) => [c.slug, c]));

/** Synchronous lookup for components that already hold a product. */
export function categoryOf(product: Pick<Product, "category">): Category {
  const category = categoryMap.get(product.category);
  if (!category) throw new Error(`Unknown category: ${product.category}`);
  return category;
}

export const findCategory = (slug: string) => categoryMap.get(slug) ?? null;
