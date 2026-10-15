import type { Metadata } from "next";
import { CartView, type CartCatalogItem } from "@/components/cart-view";
import { categoryOf, getProducts } from "@/lib/catalog";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "سبد خرید",
  robots: { index: false, follow: false },
};

export default async function CartPage() {
  const products = await getProducts();
  // The cart lives in the browser, so the page ships the price list it needs.
  const catalog: Record<string, CartCatalogItem> = Object.fromEntries(
    products.map((p) => {
      const category = categoryOf(p);
      return [
        p.slug,
        {
          slug: p.slug,
          name: p.name,
          sku: p.sku,
          price: p.price,
          stock: p.stock,
          icon: category.icon,
          onBoard: category.group === "components",
        },
      ];
    }),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8">
      <h1 className="mb-6 font-display text-4xl text-board">سبد خرید</h1>
      <CartView catalog={catalog} freeShippingFrom={site.freeShippingFrom} shippingFee={site.shippingFee} />
    </div>
  );
}
