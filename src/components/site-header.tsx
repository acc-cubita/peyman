import Link from "next/link";
import { getCategories } from "@/lib/catalog";
import { faNumber } from "@/lib/format";
import { site } from "@/lib/site";
import { CartLink } from "./cart-link";
import { LogoMark } from "./logo-mark";
import { SearchBox } from "./search-box";

export async function SiteHeader() {
  const [digital, components] = await Promise.all([
    getCategories("digital"),
    getCategories("components"),
  ]);

  return (
    <header className="border-b border-line bg-silk">
      <div className="bg-board-deep text-xs text-board-ink">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2">
          <p>ارسال رایگان برای سفارش‌های بالای {faNumber(site.freeShippingFrom / 1_000_000)} میلیون تومان</p>
          <p className="hidden sm:block">
            مشاوره فنی پیش از خرید:{" "}
            <a href={`tel:${site.phone}`} dir="ltr" className="font-mono text-silk hover:text-copper-bright">
              {site.phone}
            </a>
          </p>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark className="size-9" />
          <span className="flex flex-col leading-none">
            <span className="font-display text-2xl text-board">{site.name}</span>
            <span dir="ltr" className="mt-1 text-end font-mono text-[10px] tracking-[0.3em] text-muted uppercase">
              {site.nameEn}
            </span>
          </span>
        </Link>
        <SearchBox id="header-search" className="order-last w-full md:order-none md:mx-auto md:max-w-xl md:flex-1" />
        <div className="ms-auto md:ms-0">
          <CartLink />
        </div>
      </div>

      <nav aria-label="دسته‌بندی محصولات" className="border-t border-line">
        <ul className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-1.5 text-sm whitespace-nowrap">
          {digital.map((category) => (
            <li key={category.slug}>
              <Link
                href={`/category/${category.slug}`}
                className="block rounded-full px-3 py-1.5 text-ink/85 hover:bg-surface hover:text-board"
              >
                {category.name}
              </Link>
            </li>
          ))}
          <li aria-hidden className="mx-2 h-4 w-px shrink-0 bg-line" />
          {components.map((category) => (
            <li key={category.slug}>
              <Link
                href={`/category/${category.slug}`}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-ink/85 hover:bg-surface hover:text-board"
              >
                <span aria-hidden className="size-1.5 rounded-full bg-copper" />
                {category.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
