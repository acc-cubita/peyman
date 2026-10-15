import "server-only";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

/*
 * SQLite through Node's built-in driver: no native add-on to install, one
 * file on disk. The host needs Node 22.13+ and a persistent disk; set
 * DATABASE_PATH to place the file outside the project directory.
 */

const migrations = [
  `CREATE TABLE orders (
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
   CREATE INDEX orders_created_at ON orders(created_at);`,
];

let db: DatabaseSync | undefined;

function migrate(database: DatabaseSync) {
  const { user_version: version } = database.prepare("PRAGMA user_version").get() as { user_version: number };
  for (let i = version; i < migrations.length; i++) {
    transaction(database, () => {
      database.exec(migrations[i]);
      database.exec(`PRAGMA user_version = ${i + 1}`);
    });
  }
}

export function getDb() {
  if (!db) {
    const file = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "peyman.db");
    mkdirSync(path.dirname(file), { recursive: true });
    db = new DatabaseSync(file);
    db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
    migrate(db);
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
