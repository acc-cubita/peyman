import Link from "next/link";
import { SearchBox } from "@/components/search-box";
import { getCategories } from "@/lib/catalog";

export default async function NotFound() {
  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-3xl px-4 pt-16 text-center">
      <p dir="ltr" className="font-mono text-sm tracking-[0.3em] text-copper-deep">ERROR 404 · OPEN CIRCUIT</p>
      <h1 className="mt-3 font-display text-5xl text-board">این صفحه پیدا نشد</h1>
      <p className="mt-4 leading-8 text-muted">
        نشانی ممکن است اشتباه باشد یا کالا از فروشگاه حذف شده باشد. از جستجو یا دسته‌بندی‌ها کمک بگیرید.
      </p>
      <SearchBox id="not-found-search" className="mx-auto mt-8 max-w-md" />
      <ul className="mt-8 flex flex-wrap justify-center gap-2 text-sm">
        {categories.map((category) => (
          <li key={category.slug}>
            <Link
              href={`/category/${category.slug}`}
              className="block rounded-full bg-surface px-4 py-2 ring-1 ring-line hover:ring-board/40"
            >
              {category.name}
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/" className="mt-10 inline-block font-medium text-board underline-offset-4 hover:underline">
        بازگشت به صفحه اصلی
      </Link>
    </div>
  );
}
