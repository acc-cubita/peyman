import { Plus, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProductArt } from "@/components/product-art";
import { categories } from "@/data/categories";
import { requireAdmin } from "@/lib/admin-auth";
import { cx } from "@/lib/cx";
import { faNumber, normalizeText } from "@/lib/format";
import { findProduct, listProducts } from "@/lib/products";
import type { Product } from "@/lib/types";
import { EmptyState, inputClass, PageHeader, primaryButton } from "../ui";
import { QuickEdit } from "./quick-edit";

export const metadata: Metadata = { title: "محصولات" };

const LOW_STOCK = 5;

const stockFilters = {
  all: { label: "همه", test: () => true },
  low: { label: "رو به اتمام", test: (p: Product) => p.active && p.stock > 0 && p.stock <= LOW_STOCK },
  out: { label: "ناموجود", test: (p: Product) => p.active && p.stock === 0 },
  hidden: { label: "مخفی", test: (p: Product) => !p.active },
} as const;

type StockFilter = keyof typeof stockFilters;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default function AdminProductsPage(props: PageProps<"/admin/products">) {
  return (
    <Suspense fallback={<div aria-hidden className="h-96 rounded-3xl bg-line/50" />}>
      <Products searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Products({ searchParams }: Pick<PageProps<"/admin/products">, "searchParams">) {
  await requireAdmin();
  const params = await searchParams;
  const { saved, deleted } = params;
  const all = listProducts({ includeHidden: true });
  const savedProduct = typeof saved === "string" ? findProduct(saved) : null;
  const requested = first(params.stock);
  const stock: StockFilter = requested && Object.hasOwn(stockFilters, requested) ? (requested as StockFilter) : "all";
  const query = (first(params.q) ?? "").trim().slice(0, 60);
  const terms = normalizeText(query).split(" ").filter(Boolean);
  const products = all.filter(
    (p) =>
      stockFilters[stock].test(p) &&
      terms.every((term) => normalizeText(`${p.name} ${p.nameEn} ${p.sku} ${p.brand}`).includes(term)),
  );
  const filterHref = (key: StockFilter) => {
    const qs = new URLSearchParams({ ...(key !== "all" && { stock: key }), ...(query && { q: query }) }).toString();
    return qs ? `/admin/products?${qs}` : "/admin/products";
  };

  return (
    <>
      <PageHeader
        title="محصولات"
        description={`${faNumber(all.length)} محصول · ${faNumber(all.filter(stockFilters.out.test).length)} ناموجود · ${faNumber(all.filter(stockFilters.hidden.test).length)} مخفی`}
      >
        <Link href="/admin/products/new" className={primaryButton}>
          <Plus aria-hidden className="size-4" />
          افزودن محصول
        </Link>
      </PageHeader>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="فیلتر موجودی" className="flex gap-1 overflow-x-auto">
          {(Object.keys(stockFilters) as StockFilter[]).map((key) => (
            <Link
              key={key}
              href={filterHref(key)}
              aria-current={stock === key ? "page" : undefined}
              className={cx(
                "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm ring-1 transition-colors",
                stock === key ? "bg-board text-silk ring-board" : "bg-surface ring-line hover:ring-board/40",
              )}
            >
              {stockFilters[key].label}
              <span className={cx("text-xs tabular-nums", stock === key ? "text-silk/75" : "text-muted")}>
                {faNumber(all.filter(stockFilters[key].test).length)}
              </span>
            </Link>
          ))}
        </nav>
        <form action="/admin/products" className="flex w-full gap-2 sm:w-80">
          {stock !== "all" && <input type="hidden" name="stock" value={stock} />}
          <label htmlFor="product-search" className="sr-only">
            جستجوی محصول
          </label>
          <input id="product-search" name="q" defaultValue={query} placeholder="نام، مدل یا کد کالا" className={inputClass} />
          <button type="submit" className="grid size-10 shrink-0 place-items-center rounded-full bg-board text-silk hover:bg-board-deep">
            <Search aria-hidden className="size-4" />
            <span className="sr-only">جستجو</span>
          </button>
        </form>
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

      {products.length === 0 && <EmptyState>محصولی با این فیلتر پیدا نشد.</EmptyState>}

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
                    <ProductArt product={product} size="thumb" className="size-12 shrink-0" />
                    <div className="min-w-0 flex-1 basis-56">
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
                        {product.active && product.stock > 0 && product.stock <= LOW_STOCK && (
                          <span className="text-copper-deep">رو به اتمام</span>
                        )}
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
