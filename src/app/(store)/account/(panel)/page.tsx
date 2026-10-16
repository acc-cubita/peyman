import { ArrowLeft, PackageOpen, Truck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { ProductName } from "@/components/product-name";
import { requireCustomer } from "@/lib/customer-auth";
import { faNumber, formatDateTime, formatToman } from "@/lib/format";
import { listOrdersForAccount, type Order } from "@/lib/orders";

export const metadata: Metadata = { title: "سفارش‌های من" };

export default function AccountOrdersPage() {
  return (
    <Suspense fallback={<div aria-hidden className="h-96 rounded-3xl bg-line/50" />}>
      <Orders />
    </Suspense>
  );
}

async function Orders() {
  const customer = await requireCustomer("/account");
  const orders = listOrdersForAccount(customer.mobile);
  const paid = orders.filter((order) => order.status === "paid");
  const inProgress = paid.filter((order) => order.fulfillment !== "delivered").length;

  return (
    <>
      <header className="mb-6">
        <h1 className="font-display text-4xl text-board">سلام{customer.name ? `، ${customer.name}` : ""}</h1>
        <p className="mt-1 text-sm text-muted">
          حساب <span dir="ltr" className="font-mono">{customer.mobile}</span>
        </p>
      </header>

      <dl className="mb-6 grid grid-cols-3 gap-3">
        <Stat label="همه سفارش‌ها" value={orders.length} />
        <Stat label="در جریان" value={inProgress} />
        <Stat label="تحویل‌شده" value={paid.length - inProgress} />
      </dl>

      {orders.length === 0 ? (
        <div className="rounded-3xl bg-surface px-6 py-14 text-center ring-1 ring-line">
          <PackageOpen aria-hidden className="mx-auto size-10 text-muted" strokeWidth={1.5} />
          <p className="mt-4 font-semibold">هنوز سفارشی با این شماره ثبت نشده است.</p>
          <Link href="/" className="mt-6 inline-block rounded-full bg-board px-6 py-3 font-medium text-silk hover:bg-board-deep">
            رفتن به فروشگاه
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order.id}>
              <OrderCard order={order} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-surface p-4 ring-1 ring-line">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 text-2xl font-bold tabular-nums">{faNumber(value)}</dd>
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const count = order.items.reduce((sum, item) => sum + item.qty, 0);
  const unpaid = order.status !== "paid";

  return (
    <article className="rounded-2xl bg-surface ring-1 ring-line">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <h2 dir="ltr" className="font-mono font-semibold">{order.code}</h2>
          <time dateTime={order.createdAt} className="text-xs text-muted">{formatDateTime(order.createdAt)}</time>
        </div>
        <OrderStatusBadge order={order} />
      </header>

      <div className="space-y-3 px-5 py-4">
        <ul className="space-y-1 text-sm">
          {order.items.slice(0, 3).map((item) => (
            <li key={item.slug} className="flex justify-between gap-3">
              <span className="line-clamp-1">
                <ProductName name={item.name} /> <span className="text-muted">×{faNumber(item.qty)}</span>
              </span>
            </li>
          ))}
          {order.items.length > 3 && <li className="text-xs text-muted">و {faNumber(order.items.length - 3)} کالای دیگر</li>}
        </ul>

        {order.trackingCode && order.fulfillment === "shipped" && (
          <p className="flex flex-wrap items-center gap-2 rounded-xl bg-board/5 px-3 py-2 text-sm">
            <Truck aria-hidden className="size-4 text-board" />
            کد رهگیری مرسوله:
            <span dir="ltr" className="font-mono font-medium">{order.trackingCode}</span>
          </p>
        )}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3 text-sm">
        <span className="text-muted">
          {faNumber(count)} کالا · <span className="font-semibold text-ink tabular-nums">{formatToman(order.total)}</span>
        </span>
        <Link
          href={`/order/${order.id}`}
          className={
            unpaid && order.failure !== "out_of_stock"
              ? "flex items-center gap-1.5 rounded-full bg-board px-4 py-2 font-medium text-silk hover:bg-board-deep"
              : "flex items-center gap-1.5 font-medium text-copper-deep hover:underline"
          }
        >
          {unpaid && order.failure !== "out_of_stock" ? "تکمیل پرداخت" : "جزئیات سفارش"}
          <ArrowLeft aria-hidden className="size-4" />
        </Link>
      </footer>
    </article>
  );
}
