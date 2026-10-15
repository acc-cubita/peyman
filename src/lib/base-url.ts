import "server-only";
import { headers } from "next/headers";

/**
 * Absolute origin for links the payment gateway sends the customer back to.
 * Production should set NEXT_PUBLIC_SITE_URL; in development the request host
 * is used so callbacks reach localhost.
 */
export async function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const list = await headers();
  const host = list.get("x-forwarded-host") ?? list.get("host") ?? "localhost:3000";
  const proto = list.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
