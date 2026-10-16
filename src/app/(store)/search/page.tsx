import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductGrid } from "@/components/product-card";
import { SearchBox } from "@/components/search-box";
import { searchProducts } from "@/lib/catalog";
import { faNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "جستجو",
  robots: { index: false, follow: true },
};

export default function SearchPage(props: PageProps<"/search">) {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-8">
      <Suspense fallback={<SearchBox id="page-search" className="max-w-xl" />}>
        <SearchResults searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function SearchResults({ searchParams }: Pick<PageProps<"/search">, "searchParams">) {
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q)?.trim() ?? "";
  const results = query ? await searchProducts(query) : [];

  return (
    <>
      <SearchBox key={query} id="page-search" defaultValue={query} className="max-w-xl" />
      <h1 className="mt-8 mb-6 text-xl font-semibold">
        {query ? (
          <>
            نتایج جستجو برای «{query}»
            <span className="ms-2 text-sm font-normal text-muted">{faNumber(results.length)} کالا</span>
          </>
        ) : (
          "چه چیزی دنبالش هستید؟"
        )}
      </h1>
      {query && results.length === 0 ? (
        <p className="rounded-2xl bg-surface p-8 leading-8 text-muted ring-1 ring-line">
          کالایی با این عبارت پیدا نشد. نام برند، مدل یا کد قطعه را امتحان کنید؛ مثلاً
          <span dir="ltr" className="mx-1 font-mono text-ink">ESP32</span>یا
          <span className="mx-1 text-ink">محافظ یخچال</span>.
        </p>
      ) : (
        <ProductGrid products={results} />
      )}
    </>
  );
}
