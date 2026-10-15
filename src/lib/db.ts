import "server-only";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { sampleProducts } from "@/data/sample-products";

/*
 * SQLite through Node's built-in driver: no native add-on to install, one
 * file on disk. The host needs Node 22.13+ and a persistent disk; set
 * DATABASE_PATH to place the file outside the project directory.
 */

type Migration = (db: DatabaseSync) => void;

const migrations: Migration[] = [
  // 1 — orders
  (db) =>
    db.exec(`
      CREATE TABLE orders (
        id            TEXT PRIMARY KEY,
        code          TEXT NOT NULL UNIQUE,
        status        TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        mobile        TEXT NOT NULL,
        province      TEXT NOT NULL,
        city          TEXT NOT NULL,
        address       TEXT NOT NULL,
        postal_code   TEXT NOT NULL,
        note          TEXT,
        subtotal      INTEGER NOT NULL,
        shipping      INTEGER NOT NULL,
        total         INTEGER NOT NULL,
        authority     TEXT UNIQUE,
        ref_id        TEXT,
        card_pan      TEXT,
        failure       TEXT,
        created_at    TEXT NOT NULL,
        paid_at       TEXT
      );
      CREATE TABLE order_items (
        order_id   TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        slug       TEXT NOT NULL,
        name       TEXT NOT NULL,
        sku        TEXT NOT NULL,
        unit_price INTEGER NOT NULL,
        qty        INTEGER NOT NULL,
        PRIMARY KEY (order_id, slug)
      );
      CREATE INDEX orders_created_at ON orders(created_at);
    `),

  // 2 — products, seeded once from the sample catalog
  (db) => {
    db.exec(`
      CREATE TABLE products (
        slug             TEXT PRIMARY KEY,
        sku              TEXT NOT NULL UNIQUE,
        name             TEXT NOT NULL,
        name_en          TEXT NOT NULL,
        brand            TEXT NOT NULL,
        category         TEXT NOT NULL,
        price            INTEGER NOT NULL CHECK (price > 0),
        compare_at_price INTEGER,
        stock            INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
        rating           REAL NOT NULL DEFAULT 0,
        review_count     INTEGER NOT NULL DEFAULT 0,
        summary          TEXT NOT NULL,
        description      TEXT NOT NULL,
        highlights       TEXT NOT NULL DEFAULT '[]',
        specs            TEXT NOT NULL DEFAULT '[]',
        featured         INTEGER NOT NULL DEFAULT 0,
        active           INTEGER NOT NULL DEFAULT 1,
        position         INTEGER NOT NULL DEFAULT 0,
        created_at       TEXT NOT NULL,
        updated_at       TEXT NOT NULL
      );
      CREATE INDEX products_category ON products(category, position);
    `);
    const insert = db.prepare(`
      INSERT INTO products (slug, sku, name, name_en, brand, category, price, compare_at_price, stock, rating,
                            review_count, summary, description, highlights, specs, featured, active, position,
                            created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`);
    sampleProducts.forEach((p, index) =>
      insert.run(
        p.slug, p.sku, p.name, p.nameEn, p.brand, p.category, p.price, p.compareAtPrice ?? null, p.stock,
        p.rating, p.reviewCount, p.summary, p.description, JSON.stringify(p.highlights), JSON.stringify(p.specs),
        p.featured ? 1 : 0, index, p.updatedAt, p.updatedAt,
      ),
    );
  },
];

let db: DatabaseSync | undefined;

/**
 * Applies pending migrations one at a time. The version is re-read after the
 * write lock is taken, so several processes opening a fresh file at once
 * (e.g. parallel build workers) apply each migration exactly once.
 */
function migrate(database: DatabaseSync) {
  for (;;) {
    const done = transaction(database, () => {
      const { user_version: version } = database.prepare("PRAGMA user_version").get() as { user_version: number };
      if (version >= migrations.length) return true;
      migrations[version](database);
      database.exec(`PRAGMA user_version = ${version + 1}`);
      return false;
    });
    if (done) return;
  }
}

export function getDb() {
  if (!db) {
    const file = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "peyman.db");
    mkdirSync(path.dirname(file), { recursive: true });
    const database = new DatabaseSync(file);
    database.exec("PRAGMA busy_timeout = 10000; PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
    migrate(database);
    db = database;
  }
  return db;
}

export function transaction<T>(database: DatabaseSync, work: () => T): T {
  database.exec("BEGIN IMMEDIATE");
  try {
    const result = work();
    database.exec("COMMIT");
    return result;
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}
