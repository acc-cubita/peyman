import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";

/*
 * Single-password admin access. The session cookie is `<expiry>.<hmac>`,
 * signed with ADMIN_PASSWORD, so changing the password logs everyone out.
 */

export const ADMIN_COOKIE = "peyman_admin";
const SESSION_MS = 12 * 60 * 60 * 1000;

function secret() {
  const password = process.env.ADMIN_PASSWORD;
  return password && password.length >= 8 ? password : null;
}

export const adminEnabled = () => secret() !== null;

const digest = (value: string) => createHash("sha256").update(value).digest();

export function passwordMatches(input: string) {
  const password = secret();
  return password !== null && timingSafeEqual(digest(input), digest(password));
}

function sign(expires: number) {
  return createHmac("sha256", secret()!).update(`admin:${expires}`).digest("base64url");
}

export function newSession() {
  const expires = Date.now() + SESSION_MS;
  return { value: `${expires}.${sign(expires)}`, expires: new Date(expires) };
}

export async function isAdmin() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token || !adminEnabled()) return false;
  // The expiry check reads the clock, so it must run per request, never in a
  // prerender or a cookie-aware prefetch.
  await connection();
  const [rawExpiry, signature = ""] = token.split(".");
  const expires = Number(rawExpiry);
  if (!Number.isFinite(expires) || expires < Date.now()) return false;
  const expected = Buffer.from(sign(expires));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** Call at the top of every admin page and server action. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
