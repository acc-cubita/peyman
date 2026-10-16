import "server-only";
import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getDb, transaction } from "./db";

/*
 * Customer accounts: the mobile number is the account, proven with a one-time
 * SMS code. The session cookie is `<mobile>.<expiry>.<hmac>`, signed with a
 * random secret generated once and kept in the database.
 */

export const CUSTOMER_COOKIE = "peyman_customer";
const SESSION_MS = 30 * 24 * 60 * 60 * 1000;

const CODE_TTL_MS = 2 * 60 * 1000;
export const RESEND_AFTER_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;
const MAX_SENDS_PER_HOUR = 5;
const HOUR_MS = 60 * 60 * 1000;

export type Customer = { mobile: string; name: string | null };

function secret() {
  const db = getDb();
  db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('customer_session_secret', ?)").run(
    randomBytes(32).toString("base64url"),
  );
  return (db.prepare("SELECT value FROM settings WHERE key = 'customer_session_secret'").get() as { value: string }).value;
}

const hmac = (value: string) => createHmac("sha256", secret()).update(value).digest("base64url");

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

// ── Sessions ─────────────────────────────────────────────────

export function newCustomerSession(mobile: string) {
  const expires = Date.now() + SESSION_MS;
  return { value: `${mobile}.${expires}.${hmac(`customer:${mobile}:${expires}`)}`, expires: new Date(expires) };
}

/** The signed-in customer, or null. Reads the clock, so it runs per request. */
export async function getCustomer(): Promise<Customer | null> {
  const token = (await cookies()).get(CUSTOMER_COOKIE)?.value;
  if (!token) return null;
  await connection();
  const [mobile = "", rawExpiry = "", signature = ""] = token.split(".");
  const expires = Number(rawExpiry);
  if (!/^09\d{9}$/.test(mobile) || !Number.isFinite(expires) || expires < Date.now()) return null;
  if (!safeEqual(signature, hmac(`customer:${mobile}:${expires}`))) return null;
  const row = getDb().prepare("SELECT mobile, name FROM customers WHERE mobile = ?").get(mobile) as Customer | undefined;
  return row ?? null;
}

/** Call at the top of every account page; `next` is where to return after signing in. */
export async function requireCustomer(next: string) {
  const customer = await getCustomer();
  if (!customer) redirect(`/account/login?next=${encodeURIComponent(next)}`);
  return customer;
}

export function updateCustomerName(mobile: string, name: string) {
  getDb().prepare("UPDATE customers SET name = ? WHERE mobile = ?").run(name || null, mobile);
}

// ── One-time codes ───────────────────────────────────────────

type CodeRow = {
  mobile: string;
  code_hash: string;
  expires_at: number;
  attempts: number;
  sent_at: number;
  window_start: number;
  sends: number;
};

const hashCode = (mobile: string, code: string) => hmac(`code:${mobile}:${code}`);

export type IssueResult = { ok: true; code: string; resendAt: number } | { ok: false; error: string; resendAt?: number };

/** Creates a fresh code for the number, unless it asked too recently or too often. */
export function issueLoginCode(mobile: string): IssueResult {
  const db = getDb();
  return transaction(db, () => {
    const now = Date.now();
    const row = db.prepare("SELECT * FROM login_codes WHERE mobile = ?").get(mobile) as CodeRow | undefined;
    // A code still waiting to be used holds back a new one for a minute; a used one does not.
    if (row && row.expires_at > now && now - row.sent_at < RESEND_AFTER_MS) {
      return { ok: false, error: "کد قبلی تازه ارسال شده است. کمی صبر کنید.", resendAt: row.sent_at + RESEND_AFTER_MS };
    }
    const sameWindow = row !== undefined && now - row.window_start < HOUR_MS;
    if (sameWindow && row.sends >= MAX_SENDS_PER_HOUR) {
      return { ok: false, error: "برای این شماره بیش از حد کد درخواست شده است. یک ساعت دیگر دوباره تلاش کنید." };
    }
    const code = String(randomInt(10_000, 100_000));
    db.prepare(
      `INSERT INTO login_codes (mobile, code_hash, expires_at, attempts, sent_at, window_start, sends)
       VALUES (?, ?, ?, 0, ?, ?, ?)
       ON CONFLICT(mobile) DO UPDATE SET code_hash = excluded.code_hash, expires_at = excluded.expires_at,
         attempts = 0, sent_at = excluded.sent_at, window_start = excluded.window_start, sends = excluded.sends`,
    ).run(mobile, hashCode(mobile, code), now + CODE_TTL_MS, now, sameWindow ? row.window_start : now, sameWindow ? row.sends + 1 : 1);
    return { ok: true, code, resendAt: now + RESEND_AFTER_MS };
  });
}

/** Lets the visitor ask again right away when the SMS could not be sent. */
export function forgetFailedSend(mobile: string) {
  getDb().prepare("UPDATE login_codes SET sent_at = 0, expires_at = 0 WHERE mobile = ?").run(mobile);
}

/** Checks a code; on success the code is used up and the customer record exists. */
export function verifyLoginCode(mobile: string, code: string): { ok: true } | { ok: false; error: string } {
  const db = getDb();
  return transaction(db, () => {
    const now = Date.now();
    const row = db.prepare("SELECT * FROM login_codes WHERE mobile = ?").get(mobile) as CodeRow | undefined;
    if (!row || row.expires_at < now) return { ok: false, error: "کد منقضی شده است. کد جدید بگیرید." };
    if (row.attempts >= MAX_ATTEMPTS) return { ok: false, error: "تعداد تلاش‌ها زیاد بود. کد جدید بگیرید." };
    if (!safeEqual(row.code_hash, hashCode(mobile, code))) {
      db.prepare("UPDATE login_codes SET attempts = attempts + 1 WHERE mobile = ?").run(mobile);
      return { ok: false, error: "کد واردشده درست نیست." };
    }
    db.prepare("UPDATE login_codes SET expires_at = 0 WHERE mobile = ?").run(mobile);

    // A first sign-in borrows the name from the customer's latest order.
    const lastName = db
      .prepare("SELECT customer_name FROM orders WHERE mobile = ? ORDER BY created_at DESC LIMIT 1")
      .get(mobile) as { customer_name: string } | undefined;
    const iso = new Date(now).toISOString();
    db.prepare(
      `INSERT INTO customers (mobile, name, created_at, last_login_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(mobile) DO UPDATE SET last_login_at = excluded.last_login_at`,
    ).run(mobile, lastName?.customer_name ?? null, iso, iso);
    return { ok: true };
  });
}

// Best effort, per server process: SMS costs money, so cap requests per address too.
const requestsByIp = new Map<string, number[]>();

export function allowCodeRequest(ip: string, limit = 10) {
  const hourAgo = Date.now() - HOUR_MS;
  const recent = (requestsByIp.get(ip) ?? []).filter((time) => time > hourAgo);
  if (recent.length >= limit) return false;
  requestsByIp.set(ip, [...recent, Date.now()]);
  if (requestsByIp.size > 10_000) requestsByIp.clear();
  return true;
}
