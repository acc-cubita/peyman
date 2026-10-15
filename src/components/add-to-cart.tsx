"use client";

import { Check, Minus, Plus, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { addToCart, useCart } from "@/lib/cart-store";
import { faNumber } from "@/lib/format";

export function AddToCart({ slug, stock }: { slug: string; stock: number }) {
  const inCart = useCart().find((line) => line.slug === slug)?.qty ?? 0;
  const available = Math.max(stock - inCart, 0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (stock === 0) {
    return (
      <button type="button" disabled className="h-12 w-full cursor-not-allowed rounded-full bg-line font-medium text-muted">
        ناموجود
      </button>
    );
  }

  const quantity = Math.min(qty, Math.max(available, 1));

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="flex h-12 items-center rounded-full ring-1 ring-line" role="group" aria-label="تعداد">
          <button
            type="button"
            onClick={() => setQty(Math.min(quantity + 1, available))}
            disabled={quantity >= available}
            aria-label="افزایش تعداد"
            className="grid size-12 place-items-center text-board disabled:text-line"
          >
            <Plus aria-hidden className="size-4" />
          </button>
          <output aria-live="polite" className="w-8 text-center font-semibold tabular-nums">
            {faNumber(quantity)}
          </output>
          <button
            type="button"
            onClick={() => setQty(Math.max(quantity - 1, 1))}
            disabled={quantity <= 1}
            aria-label="کاهش تعداد"
            className="grid size-12 place-items-center text-board disabled:text-line"
          >
            <Minus aria-hidden className="size-4" />
          </button>
        </div>
        <button
          type="button"
          disabled={available === 0}
          onClick={() => {
            addToCart(slug, quantity, stock);
            setQty(1);
            setAdded(true);
          }}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-board font-medium text-silk transition-colors hover:bg-board-deep disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
        >
          <ShoppingBag aria-hidden className="size-5" />
          {available === 0 ? "کل موجودی در سبد شماست" : "افزودن به سبد خرید"}
        </button>
      </div>
      <p aria-live="polite" className="min-h-6 text-sm">
        {added && inCart > 0 && (
          <span className="flex items-center gap-1.5 text-board">
            <Check aria-hidden className="size-4" />
            {faNumber(inCart)} عدد در سبد شماست.
            <Link href="/cart" className="font-medium text-copper-deep underline-offset-4 hover:underline">
              مشاهده سبد خرید
            </Link>
          </span>
        )}
      </p>
    </div>
  );
}
