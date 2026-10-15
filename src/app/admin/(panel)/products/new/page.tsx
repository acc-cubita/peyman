import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { categories } from "@/data/categories";
import { requireAdmin } from "@/lib/admin-auth";
import { ProductForm } from "../product-form";

export const metadata: Metadata = {
  title: "افزودن محصول",
  robots: { index: false, follow: false },
};

export default function NewProductPage() {
  return (
    <Suspense fallback={<div aria-hidden className="h-96 rounded-3xl bg-line/50" />}>
      <NewProduct />
    </Suspense>
  );
}

async function NewProduct() {
  await requireAdmin();
  return (
    <>
      <Link href="/admin/products" className="text-sm text-muted hover:text-board">
        ← محصولات
      </Link>
      <h1 className="mt-2 mb-6 font-display text-4xl text-board">افزودن محصول</h1>
      <ProductForm categories={categories} />
    </>
  );
}
