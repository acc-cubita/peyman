import "server-only";
import { getDb, transaction } from "./db";
import type { Product, Spec } from "./types";

/*
 * Direct, uncached product queries. Storefront pages read through the cached
 * wrappers in catalog.ts; checkout, payment and admin call these so they
 * always see current prices and stock.
 */

type ProductRow = {
  slug: string;
  sku: string;
  name: string;
  name_en: string;
  brand: string;
  category: string;
  price: number;
  compare_at_price: number | null;
  stock: number;
  rating: number;
  review_count: number;
  warranty_months: number;
  summary: string;
  description: string;
  highlights: string;
  specs: string;
  featured: number;
  active: number;
  updated_at: string;
};

function toProduct(row: ProductRow): Product {
  return {
    slug: row.slug,
    sku: row.sku,
    name: row.name,
    nameEn: row.name_en,
    brand: row.brand,
    category: row.category,
    price: row.price,
    compareAtPrice: row.compare_at_price ?? undefined,
    stock: row.stock,
    rating: row.rating,
    reviewCount: row.review_count,
    warrantyMonths: row.warranty_months,
    summary: row.summary,
    description: row.description,
    highlights: JSON.parse(row.highlights) as string[],
    specs: JSON.parse(row.specs) as Spec[],
    featured: row.featured === 1,
    active: row.active === 1,
    updatedAt: row.updated_at,
  };
}

export function listProducts({ includeHidden = false } = {}): Product[] {
  const rows = getDb()
    .prepare(`SELECT * FROM products ${includeHidden ? "" : "WHERE active = 1"} ORDER BY category, position`)
    .all() as ProductRow[];
  return rows.map(toProduct);
}

export function findProduct(slug: string): Product | null {
  const row = getDb().prepare("SELECT * FROM products WHERE slug = ?").get(slug) as ProductRow | undefined;
  return row ? toProduct(row) : null;
}

/** Fields an admin can edit. Ratings come from reviews, not from the form. */
export type ProductInput = Omit<Product, "rating" | "reviewCount" | "updatedAt">;

export class DuplicateError extends Error {
  constructor(public field: "slug" | "sku") {
    super(`Duplicate ${field}`);
  }
}

function assertUnique(input: Pick<ProductInput, "slug" | "sku">, currentSlug?: string) {
  const db = getDb();
  if (!currentSlug && db.prepare("SELECT 1 FROM products WHERE slug = ?").get(input.slug)) {
    throw new DuplicateError("slug");
  }
  if (db.prepare("SELECT 1 FROM products WHERE sku = ? AND slug <> ?").get(input.sku, currentSlug ?? input.slug)) {
    throw new DuplicateError("sku");
  }
}

export function createProduct(input: ProductInput) {
  const db = getDb();
  transaction(db, () => {
    assertUnique(input);
    const now = new Date().toISOString();
    const { next } = db
      .prepare("SELECT COALESCE(MAX(position), -1) + 1 AS next FROM products WHERE category = ?")
      .get(input.category) as { next: number };
    db.prepare(
      `INSERT INTO products (slug, sku, name, name_en, brand, category, price, compare_at_price, stock,
                             warranty_months, summary, description, highlights, specs, featured, active, position,
                             created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      input.slug, input.sku, input.name, input.nameEn, input.brand, input.category, input.price,
      input.compareAtPrice ?? null, input.stock, input.warrantyMonths, input.summary, input.description,
      JSON.stringify(input.highlights), JSON.stringify(input.specs), input.featured ? 1 : 0,
      input.active ? 1 : 0, next, now, now,
    );
  });
}

/** The slug is the product's URL and never changes after creation. */
export function updateProduct(slug: string, input: Omit<ProductInput, "slug">) {
  const db = getDb();
  transaction(db, () => {
    assertUnique({ slug, sku: input.sku }, slug);
    db.prepare(
      `UPDATE products SET sku = ?, name = ?, name_en = ?, brand = ?, category = ?, price = ?, compare_at_price = ?,
                           stock = ?, warranty_months = ?, summary = ?, description = ?, highlights = ?, specs = ?,
                           featured = ?, active = ?, updated_at = ?
       WHERE slug = ?`,
    ).run(
      input.sku, input.name, input.nameEn, input.brand, input.category, input.price, input.compareAtPrice ?? null,
      input.stock, input.warrantyMonths, input.summary, input.description, JSON.stringify(input.highlights),
      JSON.stringify(input.specs), input.featured ? 1 : 0, input.active ? 1 : 0, new Date().toISOString(), slug,
    );
  });
}

export function updatePriceAndStock(slug: string, price: number, stock: number) {
  getDb()
    .prepare("UPDATE products SET price = ?, stock = ?, updated_at = ? WHERE slug = ?")
    .run(price, stock, new Date().toISOString(), slug);
}

export function deleteProduct(slug: string) {
  // Order items keep their own copy of name, SKU and price, so history survives.
  getDb().prepare("DELETE FROM products WHERE slug = ?").run(slug);
}

/** Items whose stock no longer covers the ordered quantity. */
export function findShortages(items: ReadonlyArray<{ slug: string; qty: number }>) {
  const stockOf = getDb().prepare("SELECT stock, active FROM products WHERE slug = ?");
  return items.filter((item) => {
    const row = stockOf.get(item.slug) as { stock: number; active: number } | undefined;
    return !row || row.active !== 1 || row.stock < item.qty;
  });
}

/** Must run inside the caller's transaction. Clamps at zero rather than failing a paid order. */
export function decrementStock(items: ReadonlyArray<{ slug: string; qty: number }>) {
  const update = getDb().prepare(
    "UPDATE products SET stock = MAX(stock - ?, 0), updated_at = ? WHERE slug = ?",
  );
  const now = new Date().toISOString();
  for (const item of items) update.run(item.qty, now, item.slug);
}
