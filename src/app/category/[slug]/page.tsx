import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { breadcrumbSchema, Breadcrumbs, type Crumb } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { ProductGrid } from "@/components/product-card";
import { applyListing, getCategories, getCategory, getProductsByCategory } from "@/lib/catalog";
import { cx } from "@/lib/cx";
import { faNumber } from "@/lib/format";
import { groups, site } from "@/lib/site";
import type { SortKey } from "@/lib/types";

type Props = PageProps<"/category/[slug]">;

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return {};
  const title = `خرید ${category.name}`;
  return {
    title,
    description: category.intro,
    // Filtered and sorted views all point back at the plain category URL.
    alternates: { canonical: `/category/${slug}` },
    openGraph: { title, description: category.intro, url: `/category/${slug}` },
  };
}

export default function CategoryPage(props: Props) {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-6">
      <Suspense fallback={<HeaderSkeleton />}>
        <CategoryHeader params={props.params} />
      </Suspense>
      <Suspense fallback={<ListingSkeleton />}>
        <CategoryListing params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function CategoryHeader({ params }: Pick<Props, "params">) {
  const { slug } = await params;
  const [category, products] = await Promise.all([getCategory(slug), getProductsByCategory(slug)]);
  if (!category) notFound();

  const crumbs: Crumb[] = [
    { name: "خانه", href: "/" },
    { name: groups[category.group].name, href: `/#${category.group}` },
    { name: category.name },
  ];

  return (
    <header className="mb-8 border-b border-line pb-8">
      <JsonLd
        graph={[
          {
            "@type": "CollectionPage",
            name: category.name,
            description: category.intro,
            url: `${site.url}/category/${slug}`,
            mainEntity: {
              "@type": "ItemList",
              itemListElement: products.map((product, index) => ({
                "@type": "ListItem",
                position: index + 1,
                url: `${site.url}/product/${product.slug}`,
                name: product.name,
              })),
            },
          },
          breadcrumbSchema(crumbs),
        ]}
      />
      <Breadcrumbs items={crumbs} />
      <h1 className="mt-4 font-display text-4xl text-board sm:text-5xl">{category.name}</h1>
      <p className="mt-3 max-w-3xl leading-8 text-muted">{category.intro}</p>
    </header>
  );
}

const sortOptions: Array<{ key: SortKey; label: string }> = [
  { key: "featured", label: "پیشنهادی" },
  { key: "price-asc", label: "ارزان‌ترین" },
  { key: "price-desc", label: "گران‌ترین" },
  { key: "rating", label: "بیشترین امتیاز" },
];

type Listing = { brand?: string; inStock: boolean; sort: SortKey };

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

function listingHref(slug: string, listing: Listing) {
  const query = new URLSearchParams();
  if (listing.brand) query.set("brand", listing.brand);
  if (listing.inStock) query.set("stock", "1");
  if (listing.sort !== "featured") query.set("sort", listing.sort);
  const qs = query.toString();
  return qs ? `/category/${slug}?${qs}` : `/category/${slug}`;
}

async function CategoryListing({ params, searchParams }: Pick<Props, "params" | "searchParams">) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const all = await getProductsByCategory(slug);
  if (all.length === 0) return null;

  const brands = [...new Set(all.map((p) => p.brand))].sort();
  const requestedBrand = first(query.brand);
  const requestedSort = first(query.sort);
  const listing: Listing = {
    brand: requestedBrand && brands.includes(requestedBrand) ? requestedBrand : undefined,
    inStock: first(query.stock) === "1",
    sort: sortOptions.some((o) => o.key === requestedSort) ? (requestedSort as SortKey) : "featured",
  };
  const products = applyListing(all, listing);
  const filtered = Boolean(listing.brand || listing.inStock);

  return (
    <div className="grid gap-8 lg:grid-cols-[15rem_1fr]">
      <aside aria-label="فیلتر محصولات" className="space-y-6 text-sm lg:sticky lg:top-6 lg:self-start">
        <FilterGroup title="برند">
          <FilterLink href={listingHref(slug, { ...listing, brand: undefined })} active={!listing.brand}>
            همه برندها
          </FilterLink>
          {brands.map((brand) => (
            <FilterLink key={brand} href={listingHref(slug, { ...listing, brand })} active={listing.brand === brand}>
              <span dir="ltr">{brand}</span>
              <span className="text-xs text-muted">{faNumber(all.filter((p) => p.brand === brand).length)}</span>
            </FilterLink>
          ))}
        </FilterGroup>
        <FilterGroup title="وضعیت موجودی">
          <FilterLink href={listingHref(slug, { ...listing, inStock: !listing.inStock })} active={listing.inStock}>
            فقط کالاهای موجود
          </FilterLink>
        </FilterGroup>
        {filtered && (
          <Link href={listingHref(slug, { sort: listing.sort, inStock: false })} scroll={false} className="inline-block text-copper-deep underline-offset-4 hover:underline">
            حذف فیلترها
          </Link>
        )}
      </aside>

      <section aria-label="فهرست محصولات">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">{faNumber(products.length)} کالا</p>
          <nav aria-label="مرتب‌سازی" className="flex flex-wrap gap-1.5 text-sm">
            {sortOptions.map((option) => (
              <Link
                key={option.key}
                href={listingHref(slug, { ...listing, sort: option.key })}
                scroll={false}
                aria-current={listing.sort === option.key ? "true" : undefined}
                className={cx(
                  "rounded-full px-3 py-1.5 ring-1 transition-colors",
                  listing.sort === option.key
                    ? "bg-board text-silk ring-board"
                    : "bg-surface text-ink ring-line hover:ring-board/40",
                )}
              >
                {option.label}
              </Link>
            ))}
          </nav>
        </div>
        {products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <div className="rounded-2xl bg-surface p-10 text-center ring-1 ring-line">
            <p className="font-semibold">کالایی با این فیلترها پیدا نشد.</p>
            <Link href={`/category/${slug}`} className="mt-3 inline-block text-copper-deep underline-offset-4 hover:underline">
              نمایش همه کالاهای این دسته
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-2 font-semibold">{title}</h2>
      <ul className="flex flex-wrap gap-1.5 lg:flex-col lg:gap-0.5">{children}</ul>
    </div>
  );
}

function FilterLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        scroll={false}
        aria-current={active ? "true" : undefined}
        className={cx(
          "flex items-center justify-between gap-3 rounded-lg px-3 py-1.5 ring-1 transition-colors lg:ring-0",
          active ? "bg-board text-silk ring-board" : "bg-surface ring-line hover:bg-silk lg:bg-transparent",
        )}
      >
        {children}
      </Link>
    </li>
  );
}

function HeaderSkeleton() {
  return (
    <div className="mb-8 border-b border-line pb-8" aria-hidden>
      <div className="h-3 w-40 rounded bg-line" />
      <div className="mt-5 h-10 w-64 rounded-lg bg-line" />
      <div className="mt-4 h-4 w-full max-w-3xl rounded bg-line/70" />
      <div className="mt-2 h-4 w-2/3 max-w-2xl rounded bg-line/70" />
    </div>
  );
}

function ListingSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[15rem_1fr]" aria-hidden>
      <div className="hidden h-60 rounded-2xl bg-line/50 lg:block" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="aspect-[3/4] rounded-2xl bg-line/50" />
        ))}
      </div>
    </div>
  );
}
