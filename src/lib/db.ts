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

  // 2 — products (sample products are added by migration 3)
  (db) =>
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
    `),

  // 3 — the store makes its own power protectors and fire alarm equipment and
  // no longer resells digital goods. Products get a warranty, and the sample
  // ratings, which were made up, are cleared.
  (db) => {
    db.exec(`
      ALTER TABLE products ADD COLUMN warranty_months INTEGER NOT NULL DEFAULT 0 CHECK (warranty_months >= 0);
      DELETE FROM products WHERE category IN ('mobile', 'laptop', 'audio', 'wearables', 'accessories');
      UPDATE products SET rating = 0, review_count = 0;
    `);
    seedEmptyCategories(db);
  },

  // 4 — shipping status for paid orders, and the online support chat
  (db) =>
    db.exec(`
      ALTER TABLE orders ADD COLUMN fulfillment TEXT;
      ALTER TABLE orders ADD COLUMN tracking_code TEXT;
      ALTER TABLE orders ADD COLUMN shipped_at TEXT;
      ALTER TABLE orders ADD COLUMN delivered_at TEXT;
      ALTER TABLE orders ADD COLUMN admin_note TEXT;
      UPDATE orders SET fulfillment = 'processing' WHERE status = 'paid';
      CREATE INDEX orders_mobile ON orders(mobile);
      CREATE INDEX orders_paid_at ON orders(paid_at);

      CREATE TABLE support_conversations (
        id               TEXT PRIMARY KEY,
        token_hash       TEXT NOT NULL UNIQUE,
        name             TEXT NOT NULL,
        mobile           TEXT,
        page             TEXT,
        status           TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
        admin_read_id    INTEGER NOT NULL DEFAULT 0,
        customer_read_id INTEGER NOT NULL DEFAULT 0,
        created_at       TEXT NOT NULL,
        last_message_at  TEXT NOT NULL
      );
      CREATE INDEX support_conversations_recent ON support_conversations(status, last_message_at);
      CREATE INDEX support_conversations_mobile ON support_conversations(mobile);
      CREATE TABLE support_messages (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id TEXT NOT NULL REFERENCES support_conversations(id) ON DELETE CASCADE,
        sender          TEXT NOT NULL CHECK (sender IN ('customer', 'admin')),
        body            TEXT NOT NULL,
        created_at      TEXT NOT NULL
      );
      CREATE INDEX support_messages_conversation ON support_messages(conversation_id, id);

      CREATE TABLE settings (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `),

  // 5 — customer accounts: mobile number plus a one-time SMS code
  (db) =>
    db.exec(`
      CREATE TABLE customers (
        mobile        TEXT PRIMARY KEY,
        name          TEXT,
        created_at    TEXT NOT NULL,
        last_login_at TEXT
      );
      CREATE TABLE login_codes (
        mobile       TEXT PRIMARY KEY,
        code_hash    TEXT NOT NULL,
        expires_at   INTEGER NOT NULL,
        attempts     INTEGER NOT NULL DEFAULT 0,
        sent_at      INTEGER NOT NULL,
        window_start INTEGER NOT NULL,
        sends        INTEGER NOT NULL
      );
      -- The account that placed the order, when the recipient's mobile differs.
      ALTER TABLE orders ADD COLUMN account_mobile TEXT;
      CREATE INDEX orders_account_mobile ON orders(account_mobile);
    `),
];

/** Adds the sample products of every category that has no products yet. */
function seedEmptyCategories(db: DatabaseSync) {
  const filled = new Set(
    (db.prepare("SELECT DISTINCT category FROM products").all() as Array<{ category: string }>).map((r) => r.category),
  );
  const insert = db.prepare(`
    INSERT OR IGNORE INTO products (slug, sku, name, name_en, brand, category, price, compare_at_price, stock,
                                    warranty_months,
                          summary, description, highlights, specs, featured, active, position, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`);
  const now = new Date().toISOString();
  sampleProducts.forEach((p, index) => {
    if (filled.has(p.category)) return;
    insert.run(
      p.slug, p.sku, p.name, p.nameEn, p.brand, p.category, p.price, p.compareAtPrice ?? null, p.stock,
      p.warrantyMonths ?? 0, p.summary, p.description, JSON.stringify(p.highlights), JSON.stringify(p.specs),
      p.featured ? 1 : 0, index, now, now,
    );
  });
}

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
