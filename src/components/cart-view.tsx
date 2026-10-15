"use client";

import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Link from "next/link";
import { removeFromCart, setQuantity, useCart } from "@/lib/cart-store";
import { cx } from "@/lib/cx";
import { faNumber, formatToman } from "@/lib/format";
import type { IconKey } from "@/lib/types";
import { CategoryIcon } from "./category-icon";

export type CartCatalogItem = {
  slug: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  icon: IconKey;
  onBoard: boolean;
};

export function CartView({
  catalog,
  freeShippingFrom,
  shippingFee,
}: {
  catalog: Record<string, CartCatalogItem>;
  freeShippingFrom: number;
  shippingFee: number;
}) {
  const lines = useCart().flatMap((line) => {
    const item = catalog[line.slug];
    return item ? [{ ...item, qty: Math.min(line.qty, item.stock) }] : [];
  });

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-3xl bg-surface px-6 py-16 text-center ring-1 ring-line">
        <ShoppingBag aria-hidden className="size-10 text-board" strokeWidth={1.25} />
        <p className="mt-4 text-lg font-semibold">سبد خرید شما خالی است.</p>
        <p className="mt-1 text-sm text-muted">از دسته‌بندی‌ها یا جستجو کالای مورد نیازتان را پیدا کنید.</p>
        <Link href="/" className="mt-6 rounded-full bg-board px-6 py-3 font-medium text-silk hover:bg-board-deep">
          رفتن به فروشگاه
        </Link>
      </div>
    );
  }

  const subtotal = lines.reduce((sum, line) => sum + line.price * line.qty, 0);
  const shipping = subtotal >= freeShippingFrom ? 0 : shippingFee;
  const count = lines.reduce((sum, line) => sum + line.qty, 0);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <ul className="divide-y divide-line rounded-2xl bg-surface ring-1 ring-line">
        {lines.map((line) => (
          <li key={line.slug} className="flex gap-4 p-4">
            <Link
              href={`/product/${line.slug}`}
              aria-hidden
              tabIndex={-1}
              className={cx(
                "grid size-20 shrink-0 place-items-center rounded-xl",
                line.onBoard ? "perfboard bg-board text-copper-bright" : "gridpaper bg-silk text-board",
              )}
            >
              <CategoryIcon icon={line.icon} className="size-9" strokeWidth={1.4} />
            </Link>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Link href={`/product/${line.slug}`} className="line-clamp-2 text-sm leading-7 font-medium hover:text-board">
                {line.name}
              </Link>
              <p dir="ltr" className="text-end font-mono text-[11px] tracking-wider text-muted">{line.sku}</p>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
                <div className="flex h-10 items-center rounded-full ring-1 ring-line" role="group" aria-label={`تعداد ${line.name}`}>
                  <button
                    type="button"
                    onClick={() => setQuantity(line.slug, line.qty + 1)}
                    disabled={line.qty >= line.stock}
                    aria-label="افزایش تعداد"
                    className="grid size-10 place-items-center text-board disabled:text-line"
                  >
                    <Plus aria-hidden className="size-4" />
                  </button>
                  <output className="w-7 text-center text-sm font-semibold tabular-nums">{faNumber(line.qty)}</output>
                  {line.qty > 1 ? (
                    <button
                      type="button"
                      onClick={() => setQuantity(line.slug, line.qty - 1)}
                      aria-label="کاهش تعداد"
                      className="grid size-10 place-items-center text-board"
                    >
                      <Minus aria-hidden className="size-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => removeFromCart(line.slug)}
                      aria-label={`حذف ${line.name} از سبد`}
                      className="grid size-10 place-items-center text-signal"
                    >
                      <Trash2 aria-hidden className="size-4" />
                    </button>
                  )}
                </div>
                <p className="text-sm font-semibold tabular-nums">{formatToman(line.price * line.qty)}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside aria-label="خلاصه سفارش" className="h-fit space-y-4 rounded-2xl bg-surface p-5 ring-1 ring-line lg:sticky lg:top-6">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">قیمت کالاها ({faNumber(count)})</dt>
            <dd className="tabular-nums">{formatToman(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">هزینه ارسال</dt>
            <dd className="tabular-nums">{shipping === 0 ? "رایگان" : formatToman(shipping)}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-3 text-base font-semibold">
            <dt>مبلغ قابل پرداخت</dt>
            <dd className="tabular-nums">{formatToman(subtotal + shipping)}</dd>
          </div>
        </dl>
        {shipping > 0 && (
          <p className="rounded-xl bg-silk px-3 py-2 text-xs leading-6 text-muted">
            با {formatToman(freeShippingFrom - subtotal)} خرید بیشتر، ارسال رایگان می‌شود.
          </p>
        )}
        <Link
          href="/checkout"
          className="flex h-12 items-center justify-center rounded-full bg-board font-medium text-silk transition-colors hover:bg-board-deep"
        >
          ادامه فرایند خرید
        </Link>
      </aside>
    </div>
  );
}
