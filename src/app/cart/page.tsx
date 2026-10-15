import type { Metadata } from "next";
import { CartView } from "@/components/cart-view";
import { getCartCatalog } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "سبد خرید",
  robots: { index: false, follow: false },
};

export default async function CartPage() {
  // The cart lives in the browser, so the page ships the price list it needs.
  const catalog = await getCartCatalog();

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8">
      <h1 className="mb-6 font-display text-4xl text-board">سبد خرید</h1>
      <CartView catalog={catalog} />
    </div>
  );
}
