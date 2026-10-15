import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { categories } from "@/data/categories";
import { requireAdmin } from "@/lib/admin-auth";
import { findProduct } from "@/lib/products";
import { removeProduct } from "../actions";
import { ProductForm } from "../product-form";
import { valuesFromProduct } from "../product-form-schema";

export const metadata: Metadata = {
  title: "ویرایش محصول",
  robots: { index: false, follow: false },
};

export default function EditProductPage(props: PageProps<"/admin/products/[slug]">) {
  return (
    <Suspense fallback={<div aria-hidden className="h-96 rounded-3xl bg-line/50" />}>
      <EditProduct params={props.params} />
    </Suspense>
  );
}

async function EditProduct({ params }: Pick<PageProps<"/admin/products/[slug]">, "params">) {
  await requireAdmin();
  const { slug } = await params;
  const product = findProduct(slug);
  if (!product) notFound();

  return (
    <>
      <Link href="/admin/products" className="text-sm text-muted hover:text-board">
        ← محصولات
      </Link>
      <div className="mt-2 mb-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-4xl text-board">ویرایش محصول</h1>
        {product.active && (
          <Link href={`/product/${product.slug}`} className="text-sm text-copper-deep underline-offset-4 hover:underline">
            مشاهده در فروشگاه
          </Link>
        )}
      </div>

      <ProductForm categories={categories} product={{ slug: product.slug, values: valuesFromProduct(product) }} />

      <details className="mt-10 rounded-2xl ring-1 ring-signal/30">
        <summary className="cursor-pointer px-5 py-4 text-sm font-medium text-signal">حذف محصول</summary>
        <form action={removeProduct.bind(null, product.slug)} className="space-y-4 border-t border-signal/20 px-5 py-4 text-sm leading-7">
          <p className="text-muted">
            محصول از فروشگاه و پایگاه داده حذف می‌شود و نشانی آن دیگر کار نمی‌کند. سفارش‌های قبلی آسیبی نمی‌بینند.
            اگر فقط می‌خواهید فعلاً فروخته نشود، به‌جای حذف، تیک «در فروشگاه نمایش داده شود» را بردارید.
          </p>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="confirm" value="yes" required className="size-4 accent-signal" />
            مطمئنم، این محصول حذف شود.
          </label>
          <button type="submit" className="rounded-full bg-signal px-5 py-2 font-medium text-white hover:opacity-90">
            حذف محصول
          </button>
        </form>
      </details>
    </>
  );
}
