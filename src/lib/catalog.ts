import { cacheLife, cacheTag } from "next/cache";
import { categories } from "@/data/categories";
import { products } from "@/data/products";
import { normalizeText } from "./format";
import type { CartCatalog, Category, CategoryGroup, Product, SortKey } from "./types";

/*
 * Catalog reads. Everything is served from the local sample data for now;
 * the async + "use cache" shape lets a database replace it without touching
 * the pages that call these functions.
 */

const categoryMap = new Map(categories.map((c) => [c.slug, c]));

/** Synchronous lookup for components that already hold a product. */
export function categoryOf(product: Pick<Product, "category">): Category {
  const category = categoryMap.get(product.category);
  if (!category) throw new Error(`Unknown category: ${product.category}`);
  return category;
}

export async function getCategories(group?: CategoryGroup) {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");
  return group ? categories.filter((c) => c.group === group) : [...categories];
}

export async function getCategory(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");
  return categoryMap.get(slug) ?? null;
}

export async function getCategoryCounts() {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");
  const counts: Record<string, number> = {};
  for (const p of products) counts[p.category] = (counts[p.category] ?? 0) + 1;
  return counts;
}

export async function getProducts() {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");
  return [...products];
}

export async function getProduct(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");
  return products.find((p) => p.slug === slug) ?? null;
}

export async function getProductsByCategory(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");
  return products.filter((p) => p.category === slug);
}

export async function getFeaturedProducts(group: CategoryGroup) {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");
  return products.filter((p) => p.featured && categoryOf(p).group === group);
}

/** Same-category products first, then the rest of the department. */
export async function getRelatedProducts(slug: string, limit = 4) {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");
  const product = products.find((p) => p.slug === slug);
  if (!product) return [];
  const group = categoryOf(product).group;
  const others = products.filter((p) => p.slug !== slug && p.stock > 0);
  const sameCategory = others.filter((p) => p.category === product.category);
  const sameGroup = others.filter(
    (p) => p.category !== product.category && categoryOf(p).group === group,
  );
  return [...sameCategory, ...sameGroup].slice(0, limit);
}

/** Price list shipped to the browser for the cart and checkout pages. */
export async function getCartCatalog(): Promise<CartCatalog> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");
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
  cacheLife("hours");
  cacheTag("catalog");
  const terms = normalizeText(query).split(" ").filter(Boolean);
  if (terms.length === 0) return [];
  return products.filter((p) => {
    const haystack = normalizeText(
      [p.name, p.nameEn, p.brand, p.sku, categoryOf(p).name].join(" "),
    );
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
    (p) =>
      (!filters.brand || p.brand === filters.brand) &&
      (!filters.inStock || p.stock > 0),
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
