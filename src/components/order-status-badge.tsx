import { cx } from "@/lib/cx";
import type { OrderStatus } from "@/lib/orders";

const labels: Record<OrderStatus, { text: string; className: string }> = {
  paid: { text: "پرداخت‌شده", className: "bg-board text-silk" },
  awaiting_payment: { text: "در انتظار پرداخت", className: "bg-copper/15 text-copper-deep" },
  failed: { text: "پرداخت ناموفق", className: "bg-signal/10 text-signal" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const label = labels[status];
  return (
    <span className={cx("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", label.className)}>
      {label.text}
    </span>
  );
}
