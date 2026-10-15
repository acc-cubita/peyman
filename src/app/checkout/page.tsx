import type { Metadata } from "next";
import { provinces } from "@/data/provinces";
import { getCartCatalog } from "@/lib/catalog";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = {
  title: "تکمیل خرید",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const catalog = await getCartCatalog();

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8">
      <h1 className="mb-6 font-display text-4xl text-board">تکمیل خرید</h1>
      <CheckoutForm catalog={catalog} provinces={provinces} />
    </div>
  );
}
