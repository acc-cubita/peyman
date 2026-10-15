import { LogOut } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { isAdmin } from "@/lib/admin-auth";
import { faNumber, formatDateTime, formatToman } from "@/lib/format";
import { listOrders, type Order } from "@/lib/orders";
import { logout } from "./actions";

export const metadata: Metadata = {
  title: "مدیریت سفارش‌ها",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 pt-8">
      <Suspense fallback={<div aria-hidden className="h-96 rounded-3xl bg-line/50" />}>
        <Orders />
      </Suspense>
    </div>
  );
}

async function Orders() {
  if (!(await isAdmin())) redirect("/admin/login");
  const orders = listOrders();
  const paid = orders.filter((order) => order.status === "paid");

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-board">سفارش‌ها</h1>
          <p className="mt-1 text-sm text-muted">
            {faNumber(paid.length)} سفارش پرداخت‌شده به ارزش {formatToman(paid.reduce((sum, o) => sum + o.total, 0))}
            {orders.length > paid.length && ` · ${faNumber(orders.length - paid.length)} سفارش پرداخت‌نشده`}
          </p>
        </div>
        <form action={logout}>
          <button type="submit" className="flex items-center gap-2 rounded-full px-4 py-2 text-sm ring-1 ring-line hover:ring-board/40">
            <LogOut aria-hidden className="size-4" />
            خروج
          </button>
        </form>
      </div>

      {orders.length === 0 ? (
        <p className="rounded-2xl bg-surface p-10 text-center text-muted ring-1 ring-line">هنوز سفارشی ثبت نشده است.</p>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <OrderRow order={order} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function OrderRow({ order }: { order: Order }) {
  return (
    <details className="group rounded-2xl bg-surface ring-1 ring-line open:ring-board/40">
      <summary className="grid cursor-pointer list-none grid-cols-2 items-center gap-x-4 gap-y-1 p-4 text-sm sm:grid-cols-[7rem_1fr_9rem_8rem_8rem]">
        <span dir="ltr" className="text-end font-mono font-medium sm:text-start">{order.code}</span>
        <span className="truncate">{order.customer.name}</span>
        <time dateTime={order.createdAt} className="text-xs text-muted">{formatDateTime(order.createdAt)}</time>
        <span className="tabular-nums">{formatToman(order.total)}</span>
        <span className="col-span-2 sm:col-span-1">
          <OrderStatusBadge status={order.status} />
        </span>
      </summary>
      <div className="grid gap-6 border-t border-line p-4 text-sm leading-7 sm:grid-cols-2">
        <div>
          <h3 className="font-semibold">گیرنده</h3>
          <p>
            {order.customer.name} · <a href={`tel:${order.customer.mobile}`} dir="ltr" className="font-mono hover:text-board">{order.customer.mobile}</a>
          </p>
          <p className="text-muted">
            {order.customer.province}، {order.customer.city}، {order.customer.address}
          </p>
          <p className="text-muted">
            کد پستی: <span dir="ltr" className="font-mono">{order.customer.postalCode}</span>
          </p>
          {order.customer.note && <p className="mt-2 rounded-xl bg-silk px-3 py-2">یادداشت: {order.customer.note}</p>}
          {order.refId && (
            <p className="mt-2 text-muted">
              کد پیگیری زرین‌پال: <span dir="ltr" className="font-mono text-ink">{order.refId}</span>
              {order.cardPan && (
                <>
                  {" "}· کارت <span dir="ltr" className="font-mono">{order.cardPan}</span>
                </>
              )}
            </p>
          )}
        </div>
        <div>
          <h3 className="font-semibold">اقلام</h3>
          <ul>
            {order.items.map((item) => (
              <li key={item.slug} className="flex justify-between gap-3">
                <span>
                  {item.name} <span className="text-muted">×{faNumber(item.qty)}</span>{" "}
                  <span dir="ltr" className="font-mono text-xs text-muted">{item.sku}</span>
                </span>
                <span className="shrink-0 tabular-nums">{faNumber(item.unitPrice * item.qty)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 border-t border-line pt-2 text-muted">
            ارسال: {order.shipping === 0 ? "رایگان" : formatToman(order.shipping)}
          </p>
        </div>
      </div>
    </details>
  );
}
