import "server-only";
import { randomInt, randomUUID } from "node:crypto";
import { getDb, transaction } from "./db";
import { decrementStock } from "./products";

export type OrderStatus = "awaiting_payment" | "paid" | "failed";
export type FailureReason = "cancelled" | "verify_failed" | "gateway_error" | "out_of_stock";

export type Customer = {
  name: string;
  mobile: string;
  province: string;
  city: string;
  address: string;
  postalCode: string;
  note: string;
};

export type OrderItem = { slug: string; name: string; sku: string; unitPrice: number; qty: number };

export type Order = {
  id: string;
  code: string;
  status: OrderStatus;
  customer: Customer;
  items: OrderItem[];
  /** Amounts in Toman. */
  subtotal: number;
  shipping: number;
  total: number;
  authority: string | null;
  refId: string | null;
  cardPan: string | null;
  failure: FailureReason | null;
  createdAt: string;
  paidAt: string | null;
};

type OrderRow = {
  id: string;
  code: string;
  status: OrderStatus;
  customer_name: string;
  mobile: string;
  province: string;
  city: string;
  address: string;
  postal_code: string;
  note: string | null;
  subtotal: number;
  shipping: number;
  total: number;
  authority: string | null;
  ref_id: string | null;
  card_pan: string | null;
  failure: FailureReason | null;
  created_at: string;
  paid_at: string | null;
};

type ItemRow = { order_id: string; slug: string; name: string; sku: string; unit_price: number; qty: number };

function toOrder(row: OrderRow, items: ItemRow[]): Order {
  return {
    id: row.id,
    code: row.code,
    status: row.status,
    customer: {
      name: row.customer_name,
      mobile: row.mobile,
      province: row.province,
      city: row.city,
      address: row.address,
      postalCode: row.postal_code,
      note: row.note ?? "",
    },
    items: items.map((item) => ({
      slug: item.slug,
      name: item.name,
      sku: item.sku,
      unitPrice: item.unit_price,
      qty: item.qty,
    })),
    subtotal: row.subtotal,
    shipping: row.shipping,
    total: row.total,
    authority: row.authority,
    refId: row.ref_id,
    cardPan: row.card_pan,
    failure: row.failure,
    createdAt: row.created_at,
    paidAt: row.paid_at,
  };
}

function itemsFor(orderIds: string[]) {
  if (orderIds.length === 0) return new Map<string, ItemRow[]>();
  const rows = getDb()
    .prepare(`SELECT * FROM order_items WHERE order_id IN (${orderIds.map(() => "?").join(",")})`)
    .all(...orderIds) as ItemRow[];
  const byOrder = new Map<string, ItemRow[]>();
  for (const row of rows) byOrder.set(row.order_id, [...(byOrder.get(row.order_id) ?? []), row]);
  return byOrder;
}

function findOne(where: string, value: string) {
  const row = getDb().prepare(`SELECT * FROM orders WHERE ${where} = ?`).get(value) as OrderRow | undefined;
  return row ? toOrder(row, itemsFor([row.id]).get(row.id) ?? []) : null;
}

export function createOrder(
  customer: Customer,
  items: OrderItem[],
  totals: { subtotal: number; shipping: number; total: number },
): Order {
  const db = getDb();
  const id = randomUUID();
  transaction(db, () => {
    // Short, human-friendly code for phone support; the UUID stays the URL key.
    let code: string;
    do code = `PE-${randomInt(100_000, 1_000_000)}`;
    while (db.prepare("SELECT 1 FROM orders WHERE code = ?").get(code));

    db.prepare(
      `INSERT INTO orders (id, code, status, customer_name, mobile, province, city, address, postal_code, note,
                           subtotal, shipping, total, created_at)
       VALUES (?, ?, 'awaiting_payment', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      code,
      customer.name,
      customer.mobile,
      customer.province,
      customer.city,
      customer.address,
      customer.postalCode,
      customer.note || null,
      totals.subtotal,
      totals.shipping,
      totals.total,
      new Date().toISOString(),
    );
    const insertItem = db.prepare(
      "INSERT INTO order_items (order_id, slug, name, sku, unit_price, qty) VALUES (?, ?, ?, ?, ?, ?)",
    );
    for (const item of items) insertItem.run(id, item.slug, item.name, item.sku, item.unitPrice, item.qty);
  });
  return getOrder(id)!;
}

export const getOrder = (id: string) => findOne("id", id);

export const getOrderByAuthority = (authority: string) => findOne("authority", authority);

/** Records a new gateway session; a retried payment replaces the old authority. */
export function attachAuthority(id: string, authority: string) {
  getDb()
    .prepare("UPDATE orders SET authority = ?, status = 'awaiting_payment', failure = NULL WHERE id = ? AND status <> 'paid'")
    .run(authority, id);
}

/**
 * Marks the order paid and takes its items out of stock, atomically.
 * Idempotent: a second callback for an already-paid order changes nothing.
 */
export function completePayment(order: Order, refId: string, cardPan: string | null) {
  const db = getDb();
  return transaction(db, () => {
    const { changes } = db
      .prepare("UPDATE orders SET status = 'paid', ref_id = ?, card_pan = ?, failure = NULL, paid_at = ? WHERE id = ? AND status <> 'paid'")
      .run(refId, cardPan, new Date().toISOString(), order.id);
    if (changes > 0) decrementStock(order.items);
    return changes > 0;
  });
}

export function markFailed(id: string, reason: FailureReason) {
  getDb().prepare("UPDATE orders SET status = 'failed', failure = ? WHERE id = ? AND status <> 'paid'").run(reason, id);
}

export function listOrders(limit = 200): Order[] {
  const rows = getDb().prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT ?").all(limit) as OrderRow[];
  const items = itemsFor(rows.map((row) => row.id));
  return rows.map((row) => toOrder(row, items.get(row.id) ?? []));
}
