import { UserRound } from "lucide-react";
import Link from "next/link";
import { getCategories } from "@/lib/catalog";
import { faNumber } from "@/lib/format";
import { groups, site } from "@/lib/site";
import { CartLink } from "./cart-link";
import { CategoryMenu } from "./category-menu";
import { LogoMark } from "./logo-mark";
import { SearchBox } from "./search-box";

export async function SiteHeader() {
  const [manufactured, components] = await Promise.all([
    getCategories("manufactured"),
    getCategories("components"),
  ]);

  return (
    <header className="border-b border-line bg-silk">
      <div className="bg-board-deep text-xs text-board-ink">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2">
          <p>{faNumber(site.warrantyYears)} سال گارانتی برای همه محصولات تولیدی پیمان</p>
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
        <div className="ms-auto flex items-center gap-2 md:ms-0">
          {/* Static on purpose: /account sends visitors who are not signed in to the login page. */}
          <Link
            href="/account"
            className="flex h-11 shrink-0 items-center gap-2 rounded-full px-3 text-sm font-medium text-ink ring-1 ring-line transition-colors hover:bg-surface hover:ring-board/40"
          >
            <UserRound aria-hidden className="size-5" />
            <span className="hidden sm:inline">حساب کاربری</span>
            <span className="sr-only sm:hidden">حساب کاربری</span>
          </Link>
          <CartLink />
        </div>
      </div>

      <nav aria-label="دسته‌بندی محصولات" className="border-t border-line">
        {/* Desktop: every category on one line, no scrolling. */}
        <ul className="mx-auto hidden max-w-7xl items-center gap-0.5 px-4 py-1.5 text-[13px] whitespace-nowrap lg:flex xl:gap-1 xl:text-sm">
          {manufactured.map((category) => (
            <li key={category.slug}>
              <Link
                href={`/category/${category.slug}`}
                title={category.name}
                className="block rounded-full px-2.5 py-1.5 text-ink/85 hover:bg-surface hover:text-board xl:px-3"
              >
                {category.shortName}
              </Link>
            </li>
          ))}
          <li aria-hidden className="mx-1.5 h-4 w-px shrink-0 bg-line xl:mx-2" />
          {components.map((category) => (
            <li key={category.slug}>
              <Link
                href={`/category/${category.slug}`}
                title={category.name}
                className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-ink/85 hover:bg-surface hover:text-board xl:px-3"
              >
                <span aria-hidden className="size-1.5 rounded-full bg-copper" />
                {category.shortName}
              </Link>
            </li>
          ))}
        </ul>
        <CategoryMenu
          sections={[
            { title: groups.manufactured.name, items: manufactured.map(({ slug, shortName }) => ({ slug, shortName })) },
            { title: groups.components.name, items: components.map(({ slug, shortName }) => ({ slug, shortName })) },
          ]}
        />
      </nav>
    </header>
  );
}
