import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { CartSkeleton } from "@/components/cart-view";
import { provinces } from "@/data/provinces";
import { toCartCatalog } from "@/lib/catalog";
import { listProducts } from "@/lib/products";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = {
  title: "تکمیل خرید",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-8">
      <h1 className="mb-6 font-display text-4xl text-board">تکمیل خرید</h1>
      <Suspense fallback={<CartSkeleton />}>
        <FreshCheckout />
      </Suspense>
    </div>
  );
}

/** Prices shown here must match what the order is charged, so read them per request. */
async function FreshCheckout() {
  await connection();
  return <CheckoutForm catalog={toCartCatalog(listProducts())} provinces={provinces} />;
}
