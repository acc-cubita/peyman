import { cx } from "@/lib/cx";
import type { Fulfillment, Order, OrderStatus } from "@/lib/orders";

type State = Exclude<OrderStatus, "paid"> | Fulfillment;

const labels: Record<State, { text: string; className: string }> = {
  awaiting_payment: { text: "در انتظار پرداخت", className: "bg-line/70 text-muted" },
  failed: { text: "پرداخت ناموفق", className: "bg-signal/10 text-signal" },
  processing: { text: "در انتظار ارسال", className: "bg-copper/15 text-copper-deep ring-1 ring-copper/40" },
  shipped: { text: "ارسال‌شده", className: "bg-board/10 text-board" },
  delivered: { text: "تحویل‌شده", className: "bg-board text-silk" },
};

export const fulfillmentLabel = (fulfillment: Fulfillment) => labels[fulfillment].text;

/** One badge for where an order stands: unpaid, failed, or its delivery step once paid. */
export function OrderStatusBadge({ order }: { order: Pick<Order, "status" | "fulfillment"> }) {
  const state: State = order.status === "paid" ? (order.fulfillment ?? "processing") : order.status;
  const label = labels[state];
  return (
    <span className={cx("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", label.className)}>
      {label.text}
    </span>
  );
}
