import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { categories } from "@/data/categories";
import { requireAdmin } from "@/lib/admin-auth";
import { faNumber } from "@/lib/format";
import { findProduct, listProducts } from "@/lib/products";
import { QuickEdit } from "./quick-edit";

export const metadata: Metadata = {
  title: "مدیریت محصولات",
  robots: { index: false, follow: false },
};

export default function AdminProductsPage(props: PageProps<"/admin/products">) {
  return (
    <Suspense fallback={<div aria-hidden className="h-96 rounded-3xl bg-line/50" />}>
      <Products searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Products({ searchParams }: Pick<PageProps<"/admin/products">, "searchParams">) {
  await requireAdmin();
  const { saved, deleted } = await searchParams;
  const products = listProducts({ includeHidden: true });
  const savedProduct = typeof saved === "string" ? findProduct(saved) : null;
  const outOfStock = products.filter((p) => p.active && p.stock === 0).length;
  const hidden = products.filter((p) => !p.active).length;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-board">محصولات</h1>
          <p className="mt-1 text-sm text-muted">
            {faNumber(products.length)} محصول
            {outOfStock > 0 && ` · ${faNumber(outOfStock)} ناموجود`}
            {hidden > 0 && ` · ${faNumber(hidden)} مخفی`}
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 rounded-full bg-board px-5 py-2.5 text-sm font-medium text-silk hover:bg-board-deep"
        >
          <Plus aria-hidden className="size-4" />
          افزودن محصول
        </Link>
      </div>

      {savedProduct && (
        <p role="status" className="mb-6 rounded-xl bg-board/10 px-4 py-3 text-sm text-board">
          «{savedProduct.name}» ذخیره شد.{" "}
          <Link href={`/product/${savedProduct.slug}`} className="font-medium underline underline-offset-4">
            مشاهده در فروشگاه
          </Link>
        </p>
      )}
      {deleted && (
        <p role="status" className="mb-6 rounded-xl bg-board/10 px-4 py-3 text-sm text-board">
          محصول حذف شد.
        </p>
      )}

      <div className="space-y-8">
        {categories.map((category) => {
          const items = products.filter((p) => p.category === category.slug);
          if (items.length === 0) return null;
          return (
            <section key={category.slug} aria-labelledby={`cat-${category.slug}`}>
              <h2 id={`cat-${category.slug}`} className="mb-3 font-semibold">
                {category.name} <span className="text-sm font-normal text-muted">({faNumber(items.length)})</span>
              </h2>
              <ul className="divide-y divide-line rounded-2xl bg-surface ring-1 ring-line">
                {items.map((product) => (
                  <li key={product.slug} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 p-4">
                    <div className="min-w-0 flex-1 basis-64">
                      <Link
                        href={`/admin/products/${product.slug}`}
                        className="line-clamp-1 font-medium hover:text-board"
                      >
                        {product.name}
                      </Link>
                      <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted">
                        <span dir="ltr" className="font-mono">{product.sku}</span>
                        {!product.active && <span className="text-copper-deep">مخفی</span>}
                        {product.active && product.stock === 0 && <span className="text-signal">ناموجود</span>}
                        {product.featured && <span>پیشنهاد صفحه اصلی</span>}
                      </p>
                    </div>
                    <QuickEdit slug={product.slug} price={product.price} stock={product.stock} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}
