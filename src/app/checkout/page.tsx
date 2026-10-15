import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "تکمیل خرید",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 pt-12">
      <div className="rounded-3xl bg-surface p-8 text-center ring-1 ring-line sm:p-12">
        <h1 className="font-display text-4xl text-board">تکمیل خرید</h1>
        <p className="mt-4 leading-8 text-muted">
          پرداخت آنلاین به‌زودی فعال می‌شود. تا آن زمان برای ثبت سفارش با ما تماس بگیرید؛
          سبد خرید شما در همین مرورگر ذخیره می‌ماند.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href={`tel:${site.phone}`}
            className="flex items-center gap-2 rounded-full bg-board px-6 py-3 font-medium text-silk hover:bg-board-deep"
          >
            ثبت سفارش تلفنی
            <span dir="ltr" className="font-mono text-sm text-copper-bright">{site.phone}</span>
          </a>
          <Link href="/cart" className="rounded-full px-6 py-3 font-medium text-board ring-1 ring-line hover:ring-board/40">
            بازگشت به سبد خرید
          </Link>
        </div>
      </div>
    </div>
  );
}
