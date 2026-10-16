import { cacheLife, cacheTag } from "next/cache";
import { categories } from "@/data/categories";
import { categoryOf, findCategory } from "./categories";
import { normalizeText } from "./format";
import { listProducts } from "./products";
import type { CartCatalog, CategoryGroup, Product, SortKey } from "./types";

/*
 * Cached storefront reads. Products come from the database (active ones
 * only); everything here is tagged "catalog", which admin edits and paid
 * orders invalidate. Categories are fixed in code.
 */

export const CATALOG_TAG = "catalog";

export { categoryOf };

// Admin edits and paid orders invalidate the tag immediately; the short
// lifetime bounds staleness if an invalidation is ever missed (e.g. a restart).
function cached() {
  cacheLife("minutes");
  cacheTag(CATALOG_TAG);
}

export async function getCategories(group?: CategoryGroup) {
  "use cache";
  cached();
  return group ? categories.filter((c) => c.group === group) : [...categories];
}

export async function getCategory(slug: string) {
  "use cache";
  cached();
  return findCategory(slug);
}

export async function getCategoryCounts() {
  "use cache";
  cached();
  const counts: Record<string, number> = {};
  for (const p of listProducts()) counts[p.category] = (counts[p.category] ?? 0) + 1;
  return counts;
}

export async function getProducts() {
  "use cache";
  cached();
  return listProducts();
}

export async function getProduct(slug: string) {
  "use cache";
  cached();
  return listProducts().find((p) => p.slug === slug) ?? null;
}

export async function getProductsByCategory(slug: string) {
  "use cache";
  cached();
  return listProducts().filter((p) => p.category === slug);
}

export async function getFeaturedProducts(group: CategoryGroup) {
  "use cache";
  cached();
  return listProducts()
    .filter((p) => p.featured && p.stock > 0 && categoryOf(p).group === group)
    .slice(0, 8);
}

/** Same-category products first, then the category's related ones, then the rest of the department. */
export async function getRelatedProducts(slug: string, limit = 4) {
  "use cache";
  cached();
  const products = listProducts();
  const product = products.find((p) => p.slug === slug);
  if (!product) return [];
  const { group, related = [] } = categoryOf(product);
  const others = products.filter((p) => p.slug !== slug && p.stock > 0);
  const sameCategory = others.filter((p) => p.category === product.category);
  const nearby = related.flatMap((category) => others.filter((p) => p.category === category));
  const sameGroup = others.filter(
    (p) => p.category !== product.category && !related.includes(p.category) && categoryOf(p).group === group,
  );
  return [...sameCategory, ...nearby, ...sameGroup].slice(0, limit);
}

/**
 * Price list shipped to the browser for the cart and checkout pages. Those
 * pages build it from a fresh database read so the total a customer sees is
 * the total they are charged.
 */
export function toCartCatalog(products: readonly Product[]): CartCatalog {
  return Object.fromEntries(
    products.map((p) => {
      const category = categoryOf(p);
      return [
        p.slug,
        {
          slug: p.slug,
          name: p.name,
          sku: p.sku,
          price: p.price,
          stock: p.stock,
          icon: category.icon,
          onBoard: category.group === "components",
        },
      ];
    }),
  );
}

export async function searchProducts(query: string) {
  "use cache";
  cached();
  const terms = normalizeText(query).split(" ").filter(Boolean);
  if (terms.length === 0) return [];
  return listProducts().filter((p) => {
    const haystack = normalizeText([p.name, p.nameEn, p.brand, p.sku, categoryOf(p).name].join(" "));
    return terms.every((term) => haystack.includes(term));
  });
}

export type ListingFilters = {
  brand?: string;
  inStock?: boolean;
  sort: SortKey;
};

/** Pure filter + sort for a category listing; out-of-stock items sink last. */
export function applyListing(items: readonly Product[], filters: ListingFilters) {
  const filtered = items.filter(
    (p) => (!filters.brand || p.brand === filters.brand) && (!filters.inStock || p.stock > 0),
  );
  const byStock = (a: Product, b: Product) => Number(b.stock > 0) - Number(a.stock > 0);
  const compare: Record<SortKey, (a: Product, b: Product) => number> = {
    featured: (a, b) => byStock(a, b) || Number(!!b.featured) - Number(!!a.featured),
    "price-asc": (a, b) => byStock(a, b) || a.price - b.price,
    "price-desc": (a, b) => byStock(a, b) || b.price - a.price,
    rating: (a, b) => byStock(a, b) || b.rating - a.rating,
  };
  return filtered.toSorted(compare[filters.sort]);
}
