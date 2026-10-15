import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { CartSkeleton, CartView } from "@/components/cart-view";
import { toCartCatalog } from "@/lib/catalog";
import { listProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "سبد خرید",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-8">
      <h1 className="mb-6 font-display text-4xl text-board">سبد خرید</h1>
      <Suspense fallback={<CartSkeleton />}>
        <FreshCart />
      </Suspense>
    </div>
  );
}

/** The cart lives in the browser; prices and stock come fresh from the database on every visit. */
async function FreshCart() {
  await connection();
  return <CartView catalog={toCartCatalog(listProducts())} />;
}
