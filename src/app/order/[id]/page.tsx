import { CircleAlert, CircleCheck, Clock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { ProductName } from "@/components/product-name";
import { faNumber, formatDateTime, formatToman } from "@/lib/format";
import { getOrder, type Order } from "@/lib/orders";
import { site } from "@/lib/site";
import { retryPayment } from "../actions";
import { ClearCart } from "./clear-cart";

export const metadata: Metadata = {
  title: "وضعیت سفارش",
  robots: { index: false, follow: false },
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function OrderPage(props: PageProps<"/order/[id]">) {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-10">
      <Suspense fallback={<div aria-hidden className="h-96 rounded-3xl bg-line/50" />}>
        <OrderDetail params={props.params} />
      </Suspense>
    </div>
  );
}

const failureText = {
  cancelled: "پرداخت در درگاه لغو شد.",
  verify_failed:
    "پرداخت تأیید نشد. اگر مبلغی از حساب شما کسر شده باشد، طبق قوانین شاپرک حداکثر تا ۷۲ ساعت به حسابتان برمی‌گردد.",
  gateway_error: "اتصال به درگاه پرداخت برقرار نشد. چند لحظه بعد دوباره تلاش کنید.",
  out_of_stock:
    "موجودی یکی از کالاها هنگام پرداخت تمام شد، برای همین پرداخت تأیید نشد. اگر مبلغی از حساب شما کسر شده باشد، حداکثر تا ۷۲ ساعت به حسابتان برمی‌گردد.",
} as const;

async function OrderDetail({ params }: Pick<PageProps<"/order/[id]">, "params">) {
  const { id } = await params;
  // Orders come from a synchronous SQLite read; render them per request.
  await connection();
  const order = UUID.test(id) ? getOrder(id) : null;
  if (!order) notFound();

  return (
    <article className="space-y-6">
      <StatusHeader order={order} />
      <OrderSummary order={order} />
      <p className="text-center text-sm text-muted">
        سؤالی دارید؟ با کد سفارش با ما تماس بگیرید:{" "}
        <a href={`tel:${site.phone}`} dir="ltr" className="font-mono text-ink hover:text-board">
          {site.phone}
        </a>
      </p>
    </article>
  );
}

function StatusHeader({ order }: { order: Order }) {
  if (order.status === "paid") {
    return (
      <header className="perfboard rounded-3xl bg-board-deep p-8 text-center text-silk">
        <ClearCart orderId={order.id} />
        <CircleCheck aria-hidden className="mx-auto size-12 text-copper-bright" strokeWidth={1.5} />
        <h1 className="mt-4 font-display text-4xl">سفارش شما ثبت شد</h1>
        <p className="mt-3 leading-8 text-board-ink">
          پرداخت با موفقیت انجام شد و سفارش برای آماده‌سازی و ارسال در صف قرار گرفت.
        </p>
        <dl className="mx-auto mt-6 grid max-w-md grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-board/70 p-3">
            <dt className="text-board-ink/80">کد سفارش</dt>
            <dd dir="ltr" className="mt-1 font-mono text-lg text-copper-bright">{order.code}</dd>
          </div>
          <div className="rounded-2xl bg-board/70 p-3">
            <dt className="text-board-ink/80">کد پیگیری پرداخت</dt>
            <dd dir="ltr" className="mt-1 font-mono text-lg text-copper-bright">{order.refId}</dd>
          </div>
        </dl>
      </header>
    );
  }

  const failed = order.status === "failed";
  // Paying again cannot succeed while an item is sold out; send them back to the cart.
  const canRetry = order.failure !== "out_of_stock";
  return (
    <header className="rounded-3xl bg-surface p-8 text-center ring-1 ring-line">
      {failed ? (
        <CircleAlert aria-hidden className="mx-auto size-12 text-signal" strokeWidth={1.5} />
      ) : (
        <Clock aria-hidden className="mx-auto size-12 text-copper-deep" strokeWidth={1.5} />
      )}
      <h1 className="mt-4 font-display text-4xl text-board">{failed ? "پرداخت انجام نشد" : "در انتظار پرداخت"}</h1>
      <p className="mt-3 leading-8 text-muted">
        {failed && order.failure ? failureText[order.failure] : "هنوز پرداختی برای این سفارش ثبت نشده است."}
        {canRetry && (
          <>
            {" "}
            سفارش شما با کد <span dir="ltr" className="font-mono text-ink">{order.code}</span> نگه داشته شده و
            می‌توانید دوباره پرداخت کنید.
          </>
        )}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {canRetry && (
          <form action={retryPayment.bind(null, order.id)}>
            <button
              type="submit"
              className="rounded-full bg-board px-6 py-3 font-medium text-silk transition-colors hover:bg-board-deep"
            >
              پرداخت {formatToman(order.total)}
            </button>
          </form>
        )}
        <Link href="/cart" className="rounded-full px-6 py-3 font-medium text-board ring-1 ring-line hover:ring-board/40">
          بازگشت به سبد خرید
        </Link>
      </div>
    </header>
  );
}

function OrderSummary({ order }: { order: Order }) {
  return (
    <section aria-label="جزئیات سفارش" className="rounded-3xl bg-surface p-6 ring-1 ring-line sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4">
        <h2 className="font-semibold">
          سفارش <span dir="ltr" className="font-mono">{order.code}</span>
        </h2>
        <div className="flex items-center gap-3 text-xs text-muted">
          <time dateTime={order.createdAt}>{formatDateTime(order.createdAt)}</time>
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      <ul className="divide-y divide-line">
        {order.items.map((item) => (
          <li key={item.slug} className="flex justify-between gap-4 py-3 text-sm">
            <Link href={`/product/${item.slug}`} className="hover:text-board">
              <ProductName name={item.name} /> <span className="text-muted">×{faNumber(item.qty)}</span>
            </Link>
            <span className="shrink-0 tabular-nums">{formatToman(item.unitPrice * item.qty)}</span>
          </li>
        ))}
      </ul>

      <dl className="space-y-2 border-t border-line pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">هزینه ارسال</dt>
          <dd>{order.shipping === 0 ? "رایگان" : formatToman(order.shipping)}</dd>
        </div>
        <div className="flex justify-between text-base font-semibold">
          <dt>{order.status === "paid" ? "مبلغ پرداخت‌شده" : "مبلغ قابل پرداخت"}</dt>
          <dd className="tabular-nums">{formatToman(order.total)}</dd>
        </div>
      </dl>

      <div className="mt-6 rounded-2xl bg-silk p-4 text-sm leading-7">
        <h3 className="mb-1 font-semibold">ارسال به</h3>
        <p>
          {order.customer.name} ·{" "}
          <span dir="ltr" className="font-mono">{order.customer.mobile}</span>
        </p>
        <p className="text-muted">
          {order.customer.province}، {order.customer.city}، {order.customer.address} · کد پستی{" "}
          <span dir="ltr" className="font-mono">{order.customer.postalCode}</span>
        </p>
      </div>
    </section>
  );
}
