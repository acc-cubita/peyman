import { site } from "./site";

/**
 * Order totals in Toman. Shared by the cart UI, the checkout summary and the
 * server action that creates the order, so the shipping rule lives in one place.
 */
export function orderTotals(lines: ReadonlyArray<{ price: number; qty: number }>) {
  const count = lines.reduce((sum, line) => sum + line.qty, 0);
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.qty, 0);
  const shipping = subtotal === 0 || subtotal >= site.freeShippingFrom ? 0 : site.shippingFee;
  return { count, subtotal, shipping, total: subtotal + shipping };
}
