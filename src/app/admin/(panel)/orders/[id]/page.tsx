import { ArrowRight, MessagesSquare, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { ProductName } from "@/components/product-name";
import { requireAdmin } from "@/lib/admin-auth";
import { faNumber, formatDateTime, formatToman } from "@/lib/format";
import { countOrdersByMobile, getOrder, type FailureReason } from "@/lib/orders";
import { conversationsByMobile } from "@/lib/support";
import { PageHeader, Panel } from "../../ui";
import { FulfillmentForm } from "./fulfillment-form";
import { PrintButton } from "./print-button";

export const metadata: Metadata = { title: "جزئیات سفارش" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const failureText: Record<FailureReason, string> = {
  cancelled: "مشتری پرداخت را در درگاه لغو کرد.",
  verify_failed: "تأیید پرداخت از زرین‌پال ناموفق بود.",
  gateway_error: "اتصال به درگاه برقرار نشد.",
  out_of_stock: "موجودی هنگام پرداخت تمام شد؛ پرداخت تأیید نشد و مبلغ به مشتری برمی‌گردد.",
};

export default function AdminOrderPage(props: PageProps<"/admin/orders/[id]">) {
  return (
    <Suspense fallback={<div aria-hidden className="h-[36rem] rounded-3xl bg-line/50" />}>
      <OrderDetail params={props.params} />
    </Suspense>
  );
}

async function OrderDetail({ params }: Pick<PageProps<"/admin/orders/[id]">, "params">) {
  await requireAdmin();
  const { id } = await params;
  const order = UUID.test(id) ? getOrder(id) : null;
  if (!order) notFound();

  const otherOrders = countOrdersByMobile(order.customer.mobile) - 1;
  const chats = conversationsByMobile(order.customer.mobile);
  const { customer } = order;

  return (
    <>
      <Link href="/admin/orders" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink print:hidden">
        <ArrowRight aria-hidden className="size-4" />
        سفارش‌ها
      </Link>
      <PageHeader
        title={`سفارش ${order.code}`}
        description={
          <span className="flex flex-wrap items-center gap-2">
            ثبت‌شده در {formatDateTime(order.createdAt)}
            <OrderStatusBadge order={order} />
          </span>
        }
      >
        <PrintButton />
      </PageHeader>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          {order.status === "paid" && (
            <Panel title="ارسال" className="print:hidden">
              <FulfillmentForm
                orderId={order.id}
                fulfillment={order.fulfillment ?? "processing"}
                trackingCode={order.trackingCode ?? ""}
                adminNote={order.adminNote ?? ""}
              />
              {(order.shippedAt || order.deliveredAt) && (
                <p className="mt-4 border-t border-line pt-3 text-xs text-muted">
                  {order.shippedAt && `ارسال: ${formatDateTime(order.shippedAt)}`}
                  {order.shippedAt && order.deliveredAt && " · "}
                  {order.deliveredAt && `تحویل: ${formatDateTime(order.deliveredAt)}`}
                </p>
              )}
            </Panel>
          )}

          <Panel title="اقلام سفارش">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted">
                <tr>
                  <th scope="col" className="pb-2 text-start font-medium">کالا</th>
                  <th scope="col" className="pb-2 text-start font-medium">تعداد</th>
                  <th scope="col" className="hidden pb-2 text-start font-medium sm:table-cell">قیمت واحد</th>
                  <th scope="col" className="pb-2 text-end font-medium">جمع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {order.items.map((item) => (
                  <tr key={item.slug}>
                    <td className="py-3 pe-3">
                      <ProductName name={item.name} />
                      <span dir="ltr" className="block text-end font-mono text-xs text-muted">{item.sku}</span>
                    </td>
                    <td className="py-3 tabular-nums">{faNumber(item.qty)}</td>
                    <td className="hidden py-3 tabular-nums sm:table-cell">{faNumber(item.unitPrice)}</td>
                    <td className="py-3 text-end tabular-nums">{faNumber(item.unitPrice * item.qty)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">جمع کالاها</dt>
                <dd className="tabular-nums">{formatToman(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">هزینه ارسال</dt>
                <dd className="tabular-nums">{order.shipping === 0 ? "رایگان" : formatToman(order.shipping)}</dd>
              </div>
              <div className="flex justify-between font-semibold">
                <dt>مبلغ کل</dt>
                <dd className="tabular-nums">{formatToman(order.total)}</dd>
              </div>
            </dl>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="گیرنده">
            <div className="space-y-2 text-sm leading-7">
              <p className="font-medium">{customer.name}</p>
              <a href={`tel:${customer.mobile}`} dir="ltr" className="flex items-center justify-end gap-2 font-mono hover:text-board">
                {customer.mobile}
                <Phone aria-hidden className="size-4 text-muted" />
              </a>
              <p className="text-muted">
                {customer.province}، {customer.city}، {customer.address}
              </p>
              <p className="text-muted">
                کد پستی: <span dir="ltr" className="font-mono text-ink">{customer.postalCode}</span>
              </p>
              {customer.note && <p className="rounded-xl bg-silk px-3 py-2">یادداشت مشتری: {customer.note}</p>}
            </div>
            {(otherOrders > 0 || chats.length > 0) && (
              <div className="mt-4 space-y-1.5 border-t border-line pt-3 text-xs print:hidden">
                {otherOrders > 0 && (
                  <Link href={`/admin/orders?q=${customer.mobile}`} className="block text-copper-deep hover:underline">
                    {faNumber(otherOrders)} سفارش دیگر از این شماره
                  </Link>
                )}
                {chats.map((chat) => (
                  <Link key={chat.id} href={`/admin/support/${chat.id}`} className="flex items-center gap-1.5 text-copper-deep hover:underline">
                    <MessagesSquare aria-hidden className="size-3.5" />
                    گفتگوی پشتیبانی {formatDateTime(chat.lastMessageAt)}
                  </Link>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="پرداخت">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">وضعیت</dt>
                <dd>{order.status === "paid" ? "پرداخت‌شده" : order.status === "failed" ? "ناموفق" : "در انتظار پرداخت"}</dd>
              </div>
              {order.paidAt && (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">زمان پرداخت</dt>
                  <dd>{formatDateTime(order.paidAt)}</dd>
                </div>
              )}
              {order.refId && (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">کد پیگیری زرین‌پال</dt>
                  <dd dir="ltr" className="font-mono">{order.refId}</dd>
                </div>
              )}
              {order.cardPan && (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">کارت</dt>
                  <dd dir="ltr" className="font-mono">{order.cardPan}</dd>
                </div>
              )}
              {order.failure && <p className="rounded-xl bg-signal/10 px-3 py-2 text-xs leading-6 text-signal">{failureText[order.failure]}</p>}
            </dl>
          </Panel>
        </div>
      </div>
    </>
  );
}
