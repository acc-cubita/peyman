"use client";

import { useSyncExternalStore } from "react";
import type { CartCatalog } from "./types";

export type CartLine = { slug: string; qty: number };

/* Bump the version suffix whenever the stored shape changes. */
const STORAGE_KEY = "peyman-cart:v1";
const EMPTY: CartLine[] = [];

let lines: CartLine[] | null = null;
const listeners = new Set<() => void>();

function isLine(value: unknown): value is CartLine {
  if (typeof value !== "object" || value === null) return false;
  const line = value as Record<string, unknown>;
  return (
    typeof line.slug === "string" &&
    typeof line.qty === "number" &&
    Number.isInteger(line.qty) &&
    line.qty > 0
  );
}

function readStorage(): CartLine[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter(isLine) : [];
  } catch {
    return [];
  }
}

function current(): CartLine[] {
  lines ??= readStorage();
  return lines;
}

function commit(next: CartLine[]) {
  lines = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage can be full or blocked; the in-memory cart still works.
  }
  for (const listener of listeners) listener();
}

function onStorage(event: StorageEvent) {
  if (event.key !== STORAGE_KEY) return;
  lines = readStorage();
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

const noopSubscribe = () => () => {};

/**
 * False during server render and hydration, true afterwards. Lets cart views
 * show a placeholder instead of flashing "your cart is empty".
 */
export function useHydrated() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

export function useCart() {
  return useSyncExternalStore(subscribe, current, () => EMPTY);
}

/** Cart lines joined with current prices; unavailable items drop out and quantities cap at stock. */
export function useCartLines(catalog: CartCatalog) {
  return useCart().flatMap((line) => {
    const item = catalog[line.slug];
    return item && item.stock > 0 ? [{ ...item, qty: Math.min(line.qty, item.stock) }] : [];
  });
}

export function useCartCount() {
  return useSyncExternalStore(
    subscribe,
    () => current().reduce((sum, line) => sum + line.qty, 0),
    () => 0,
  );
}

export function addToCart(slug: string, qty: number, max: number) {
  const existing = current().find((line) => line.slug === slug);
  const nextQty = Math.min((existing?.qty ?? 0) + qty, max);
  if (nextQty <= 0) return;
  commit(
    existing
      ? current().map((line) => (line.slug === slug ? { slug, qty: nextQty } : line))
      : [...current(), { slug, qty: nextQty }],
  );
}

export function setQuantity(slug: string, qty: number) {
  commit(
    qty <= 0
      ? current().filter((line) => line.slug !== slug)
      : current().map((line) => (line.slug === slug ? { slug, qty } : line)),
  );
}

export function removeFromCart(slug: string) {
  commit(current().filter((line) => line.slug !== slug));
}

const CLEARED_KEY = "peyman-cart:cleared-for";

/**
 * Empties the cart once per paid order, so revisiting an old receipt does
 * not wipe items added since.
 */
export function clearCartForOrder(orderId: string) {
  try {
    if (localStorage.getItem(CLEARED_KEY) === orderId) return;
    localStorage.setItem(CLEARED_KEY, orderId);
  } catch {
    // Without storage the guard is lost, but clearing is still correct.
  }
  commit([]);
}
