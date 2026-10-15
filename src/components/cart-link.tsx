"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useCartCount } from "@/lib/cart-store";
import { faNumber } from "@/lib/format";

export function CartLink() {
  const count = useCartCount();

  return (
    <Link
      href="/cart"
      aria-label={count > 0 ? `سبد خرید، ${faNumber(count)} کالا` : "سبد خرید"}
      className="relative flex h-11 shrink-0 items-center gap-2 rounded-full px-3 text-sm font-medium text-ink ring-1 ring-line transition-colors hover:bg-surface hover:ring-board/40"
    >
      <ShoppingBag aria-hidden className="size-5" />
      <span className="hidden sm:inline">سبد خرید</span>
      {count > 0 && (
        <span className="absolute -top-1.5 -left-1.5 grid min-w-5 place-items-center rounded-full bg-copper px-1 text-[11px] leading-5 font-semibold text-white">
          {faNumber(count)}
        </span>
      )}
    </Link>
  );
}
