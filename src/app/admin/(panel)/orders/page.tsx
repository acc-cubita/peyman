import { Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { requireAdmin } from "@/lib/admin-auth";
import { cx } from "@/lib/cx";
import { faNumber, formatDateTime, formatToman } from "@/lib/format";
import { countOrders, isOrderFilter, searchOrders, type OrderFilter } from "@/lib/orders";
import { EmptyState, inputClass, PageHeader, secondaryButton } from "../ui";

export const metadata: Metadata = { title: "سفارش‌ها" };

const tabs: Array<{ key: OrderFilter; label: string }> = [
  { key: "all", label: "همه" },
  { key: "processing", label: "در انتظار ارسال" },
  { key: "shipped", label: "ارسال‌شده" },
  { key: "delivered", label: "تحویل‌شده" },
  { key: "awaiting_payment", label: "در انتظار پرداخت" },
  { key: "failed", label: "ناموفق" },
];

type Props = PageProps<"/admin/orders">;

export default function AdminOrdersPage(props: Props) {
  return (
    <Suspense fallback={<div aria-hidden className="h-96 rounded-3xl bg-line/50" />}>
      <Orders searchParams={props.searchParams} />
    </Suspense>
  );
}

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

function href(filter: OrderFilter, query: string, page = 1) {
  const params = new URLSearchParams();
  if (filter !== "all") params.set("f", filter);
  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/admin/orders?${qs}` : "/admin/orders";
}

async function Orders({ searchParams }: Pick<Props, "searchParams">) {
  await requireAdmin();
  const params = await searchParams;
  const requested = first(params.f);
  const filter: OrderFilter = isOrderFilter(requested) ? requested : "all";
  const query = (first(params.q) ?? "").trim().slice(0, 60);
  const page = Math.max(1, Number(first(params.page)) || 1);
  const counts = countOrders();
  const { orders, total, pages } = searchOrders({ filter, query, page });

  return (
    <>
      <PageHeader
        title="سفارش‌ها"
        description={`${faNumber(counts.all)} سفارش · ${faNumber(counts.processing)} در انتظار ارسال`}
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="وضعیت سفارش" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={href(tab.key, query)}
              aria-current={filter === tab.key ? "page" : undefined}
              className={cx(
                "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm ring-1 transition-colors",
                filter === tab.key ? "bg-board text-silk ring-board" : "bg-surface ring-line hover:ring-board/40",
              )}
            >
              {tab.label}
              <span className={cx("text-xs tabular-nums", filter === tab.key ? "text-silk/75" : "text-muted")}>
                {faNumber(counts[tab.key])}
              </span>
            </Link>
          ))}
        </nav>
        <form action="/admin/orders" className="flex w-full gap-2 sm:w-80">
          {filter !== "all" && <input type="hidden" name="f" value={filter} />}
          <label htmlFor="order-search" className="sr-only">
            جستجوی سفارش
          </label>
          <input
            id="order-search"
            name="q"
            defaultValue={query}
            placeholder="کد سفارش، نام یا موبایل"
            className={inputClass}
          />
          <button type="submit" className="grid size-10 shrink-0 place-items-center rounded-full bg-board text-silk hover:bg-board-deep">
            <Search aria-hidden className="size-4" />
            <span className="sr-only">جستجو</span>
          </button>
        </form>
      </div>

      {orders.length === 0 ? (
        <EmptyState>{query ? `سفارشی با «${query}» پیدا نشد.` : "سفارشی در این وضعیت نیست."}</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-surface ring-1 ring-line">
          <table className="w-full text-sm">
            <thead className="bg-silk text-xs text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 text-start font-medium">سفارش</th>
                <th scope="col" className="hidden px-4 py-3 text-start font-medium md:table-cell">تاریخ</th>
                <th scope="col" className="px-4 py-3 text-start font-medium">مشتری</th>
                <th scope="col" className="hidden px-4 py-3 text-start font-medium sm:table-cell">مبلغ</th>
                <th scope="col" className="px-4 py-3 text-start font-medium">وضعیت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orders.map((order) => (
                <tr key={order.id} className="relative hover:bg-silk/60">
                  <td className="px-4 py-3">
                    {/* The link's overlay makes the whole row clickable. */}
                    <Link
                      href={`/admin/orders/${order.id}`}
                      dir="ltr"
                      className="font-mono font-medium after:absolute after:inset-0 hover:text-board"
                    >
                      {order.code}
                    </Link>
                    <span className="block text-xs text-muted">{faNumber(order.items.reduce((n, i) => n + i.qty, 0))} قلم</span>
                  </td>
                  <td className="hidden px-4 py-3 text-xs text-muted md:table-cell">{formatDateTime(order.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className="block max-w-[12rem] truncate">{order.customer.name}</span>
                    <span dir="ltr" className="block text-end font-mono text-xs text-muted">{order.customer.mobile}</span>
                  </td>
                  <td className="hidden px-4 py-3 tabular-nums sm:table-cell">{formatToman(order.total)}</td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge order={order} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <nav aria-label="صفحه‌ها" className="mt-5 flex items-center justify-between gap-3 text-sm">
          <span className="text-muted">
            صفحه {faNumber(page)} از {faNumber(pages)} · {faNumber(total)} سفارش
          </span>
          <span className="flex gap-2">
            {page > 1 && (
              <Link href={href(filter, query, page - 1)} className={secondaryButton}>
                قبلی
              </Link>
            )}
            {page < pages && (
              <Link href={href(filter, query, page + 1)} className={secondaryButton}>
                بعدی
              </Link>
            )}
          </span>
        </nav>
      )}
    </>
  );
}
