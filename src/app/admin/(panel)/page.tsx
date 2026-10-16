import { AlertTriangle, MessagesSquare } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { requireAdmin } from "@/lib/admin-auth";
import { faNumber, formatToman, formatWhen } from "@/lib/format";
import { countOrders, listOrders } from "@/lib/orders";
import { listProducts } from "@/lib/products";
import { salesReport } from "@/lib/reports";
import { adminUnreadTotal, countConversations } from "@/lib/support";
import { RevenueChart } from "./revenue-chart";
import { PageHeader, Panel, StatTile } from "./ui";

export const metadata: Metadata = { title: "داشبورد" };

const LOW_STOCK = 5;

export default function DashboardPage() {
  return (
    <Suspense fallback={<div aria-hidden className="h-[40rem] rounded-3xl bg-line/50" />}>
      <Dashboard />
    </Suspense>
  );
}

async function Dashboard() {
  await requireAdmin();
  const report = salesReport(30);
  const counts = countOrders();
  const recent = listOrders(6);
  const lowStock = listProducts()
    .filter((p) => p.stock <= LOW_STOCK)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 6);
  const conversations = countConversations();
  const unread = adminUnreadTotal();

  return (
    <>
      <PageHeader title="داشبورد" description="خلاصه فروش، سفارش‌ها و پشتیبانی" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="فروش امروز" value={formatToman(report.today.revenue)} detail={`${faNumber(report.today.orders)} سفارش`} />
        <StatTile label="فروش ۳۰ روز اخیر" value={formatToman(report.revenue)} detail={`${faNumber(report.orders)} سفارش پرداخت‌شده`} />
        <StatTile label="میانگین هر سفارش" value={formatToman(report.averageOrder)} detail="در ۳۰ روز اخیر" />
        <StatTile
          label="در انتظار ارسال"
          value={`${faNumber(counts.processing)} سفارش`}
          detail={counts.processing > 0 ? "برای ارسال آماده کنید" : "سفارشی معطل نیست"}
          href="/admin/orders?f=processing"
          tone={counts.processing > 0 ? "attention" : "plain"}
        />
      </div>

      <Panel title="فروش روزانه، ۳۰ روز اخیر" className="mt-6">
        <RevenueChart series={report.series} />
      </Panel>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Panel title="آخرین سفارش‌ها" link={{ href: "/admin/orders", label: "همه سفارش‌ها" }}>
          {recent.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">هنوز سفارشی ثبت نشده است.</p>
          ) : (
            <ul className="-mx-2 divide-y divide-line">
              {recent.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 rounded-xl px-2 py-3 text-sm hover:bg-silk sm:grid-cols-[6.5rem_minmax(0,1fr)_8rem_auto]"
                  >
                    <span dir="ltr" className="text-end font-mono text-xs text-muted sm:text-start">{order.code}</span>
                    <span className="truncate">{order.customer.name}</span>
                    <span className="tabular-nums">{formatToman(order.total)}</span>
                    <span className="flex items-center justify-end gap-2">
                      <span className="hidden text-xs text-muted sm:inline">{formatWhen(order.createdAt)}</span>
                      <OrderStatusBadge order={order} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel title="پشتیبانی آنلاین" link={{ href: "/admin/support", label: "صندوق پیام‌ها" }}>
            <p className="flex items-center gap-3 text-sm">
              <MessagesSquare aria-hidden className="size-5 text-board" />
              <span>
                {faNumber(conversations.open)} گفتگوی باز
                {unread > 0 && <span className="text-signal"> · {faNumber(unread)} پیام خوانده‌نشده</span>}
              </span>
            </p>
          </Panel>

          <Panel title="موجودی رو به اتمام" link={{ href: "/admin/products?stock=low", label: "همه" }}>
            {lowStock.length === 0 ? (
              <p className="text-sm text-muted">موجودی همه محصولات بیش از {faNumber(LOW_STOCK)} عدد است.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {lowStock.map((product) => (
                  <li key={product.slug} className="flex items-center justify-between gap-3">
                    <Link href={`/admin/products/${product.slug}`} className="line-clamp-1 hover:text-board">
                      {product.name}
                    </Link>
                    <span
                      className={
                        product.stock === 0
                          ? "flex shrink-0 items-center gap-1 text-xs font-medium text-signal"
                          : "shrink-0 text-xs text-copper-deep tabular-nums"
                      }
                    >
                      {product.stock === 0 && <AlertTriangle aria-hidden className="size-3.5" />}
                      {product.stock === 0 ? "ناموجود" : `${faNumber(product.stock)} عدد`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="پرفروش‌ترین‌ها، ۳۰ روز">
            {report.bestSellers.length === 0 ? (
              <p className="text-sm text-muted">هنوز فروشی ثبت نشده است.</p>
            ) : (
              <ol className="space-y-2 text-sm">
                {report.bestSellers.map((item, index) => (
                  <li key={item.slug} className="flex items-center gap-3">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-silk text-xs text-muted">
                      {faNumber(index + 1)}
                    </span>
                    <span className="line-clamp-1 flex-1">{item.name}</span>
                    <span className="shrink-0 text-xs text-muted tabular-nums">{faNumber(item.qty)} عدد</span>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
