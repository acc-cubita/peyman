import { Check, ShieldCheck, Truck } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AddToCart } from "@/components/add-to-cart";
import { breadcrumbSchema, Breadcrumbs, type Crumb } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { PriceTag } from "@/components/price-tag";
import { ProductArt } from "@/components/product-art";
import { ProductGrid } from "@/components/product-card";
import { ProductName } from "@/components/product-name";
import { Rating } from "@/components/rating";
import { SectionHeading } from "@/components/section-heading";
import { categoryOf, getProduct, getProducts, getRelatedProducts } from "@/lib/catalog";
import { faNumber, warrantyLabel } from "@/lib/format";
import { groups, site } from "@/lib/site";
import type { Product } from "@/lib/types";

type Props = PageProps<"/product/[slug]">;

export async function generateStaticParams() {
  const products = await getProducts();
  // Cache Components needs at least one param; an empty store prerenders a 404.
  return products.length > 0 ? products.map((product) => ({ slug: product.slug })) : [{ slug: "none" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};
  const description = `${product.summary} مشخصات فنی، قیمت و موجودی ${product.nameEn} در ${site.name}.`;
  return {
    title: product.name,
    description,
    alternates: { canonical: `/product/${slug}` },
    openGraph: { title: product.name, description, url: `/product/${slug}` },
  };
}

export default function ProductPage(props: Props) {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-6">
      <Suspense fallback={<ProductSkeleton />}>
        <ProductDetail params={props.params} />
      </Suspense>
    </div>
  );
}

function productSchema(product: Product) {
  const url = `${site.url}/product/${product.slug}`;
  return {
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.sku,
    brand: { "@type": "Brand", name: product.brand },
    ...(product.brand === site.nameEn && { manufacturer: { "@type": "Organization", name: site.name, url: site.url } }),
    url,
    additionalProperty: product.specs.map(([name, value]) => ({ "@type": "PropertyValue", name, value })),
    ...(product.reviewCount > 0 && {
      aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviewCount },
    }),
    offers: {
      "@type": "Offer",
      url,
      // Toman has no ISO 4217 code; schema.org prices are given in Rial.
      price: product.price * 10,
      priceCurrency: "IRR",
      itemCondition: "https://schema.org/NewCondition",
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: site.name },
      ...(product.warrantyMonths > 0 && {
        warranty: {
          "@type": "WarrantyPromise",
          durationOfWarranty: { "@type": "QuantitativeValue", value: product.warrantyMonths, unitCode: "MON" },
        },
      }),
    },
  };
}

function stockLabel(stock: number) {
  if (stock === 0) return { text: "ناموجود", tone: "text-signal" };
  if (stock <= 5) return { text: `تنها ${faNumber(stock)} عدد در انبار باقی مانده`, tone: "text-copper-deep" };
  return { text: "موجود در انبار", tone: "text-board" };
}

async function ProductDetail({ params }: Pick<Props, "params">) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const category = categoryOf(product);
  const related = await getRelatedProducts(slug);
  const stock = stockLabel(product.stock);
  const crumbs: Crumb[] = [
    { name: "خانه", href: "/" },
    { name: groups[category.group].name, href: `/#${category.group}` },
    { name: category.name, href: `/category/${category.slug}` },
    { name: product.name },
  ];

  return (
    <>
      <JsonLd graph={[productSchema(product), breadcrumbSchema(crumbs)]} />
      <Breadcrumbs items={crumbs} />

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-12">
        <div className="lg:sticky lg:top-6 lg:self-start">
          <ProductArt product={product} size="large" className="ring-1 ring-line" />
        </div>

        <div>
          <p className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <span dir="ltr" className="font-mono uppercase tracking-wider">{product.brand}</span>
            <span aria-hidden>·</span>
            <span>
              کد کالا: <span dir="ltr" className="font-mono tracking-wider text-ink">{product.sku}</span>
            </span>
          </p>
          <h1 className="mt-2 text-2xl leading-[1.6] font-bold text-ink sm:text-3xl sm:leading-[1.6]">
            <ProductName name={product.name} />
          </h1>
          <p dir="ltr" className="mt-1 text-end font-mono text-sm text-muted">{product.nameEn}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {product.warrantyMonths > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-board/10 px-3 py-1 text-xs font-medium text-board">
                <ShieldCheck aria-hidden className="size-4" />
                {warrantyLabel(product.warrantyMonths)}
              </span>
            )}
            <Rating value={product.rating} count={product.reviewCount} />
          </div>

          <p className="mt-5 leading-8">{product.summary}</p>
          <ul className="mt-4 space-y-2">
            {product.highlights.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm">
                <Check aria-hidden className="mt-1 size-4 shrink-0 text-board" />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-7 rounded-2xl bg-surface p-5 ring-1 ring-line">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <p className={`text-sm font-medium ${stock.tone}`}>{stock.text}</p>
              {product.stock > 0 && (
                <PriceTag price={product.price} compareAtPrice={product.compareAtPrice} size="large" />
              )}
            </div>
            <div className="mt-5">
              <AddToCart slug={product.slug} stock={product.stock} />
            </div>
            <ul className="mt-2 space-y-2 border-t border-line pt-4 text-xs text-muted">
              <li className="flex items-center gap-2">
                <ShieldCheck aria-hidden className="size-4 text-board" />
                {product.warrantyMonths > 0
                  ? `${warrantyLabel(product.warrantyMonths)} ${site.name}`
                  : "ضمانت اصالت کالا و فاکتور رسمی"}
              </li>
              <li className="flex items-center gap-2">
                <Truck aria-hidden className="size-4 text-board" />
                ارسال رایگان برای سفارش‌های بالای {faNumber(site.freeShippingFrom / 1_000_000)} میلیون تومان
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-14 grid gap-10 lg:grid-cols-2">
        <section aria-labelledby="specs">
          <h2 id="specs" className="mb-4 font-display text-3xl text-board">مشخصات فنی</h2>
          <div className="overflow-hidden rounded-2xl ring-1 ring-line">
            <p dir="ltr" className="perfboard flex justify-between bg-board px-5 py-2.5 font-mono text-xs tracking-widest text-board-ink">
              <span>DATASHEET</span>
              <span className="text-copper-bright">{product.sku}</span>
            </p>
            <table className="w-full bg-surface text-sm">
              <tbody>
                {product.specs.map(([label, value]) => (
                  <tr key={label} className="border-t border-line first:border-t-0">
                    <th scope="row" className="w-2/5 px-5 py-3 text-start font-normal text-muted">{label}</th>
                    <td className="px-5 py-3 font-medium">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section aria-labelledby="about">
          <h2 id="about" className="mb-4 font-display text-3xl text-board">معرفی</h2>
          <p className="leading-9 text-ink/90">{product.description}</p>
        </section>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <SectionHeading
            title="کالاهای مرتبط"
            link={{ href: `/category/${category.slug}`, label: `همه ${category.name}` }}
          />
          <ProductGrid products={related} />
        </section>
      )}
    </>
  );
}

function ProductSkeleton() {
  return (
    <div aria-hidden>
      <div className="h-3 w-56 rounded bg-line" />
      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-12">
        <div className="aspect-square rounded-xl bg-line/50" />
        <div className="space-y-4">
          <div className="h-3 w-32 rounded bg-line" />
          <div className="h-8 w-4/5 rounded-lg bg-line" />
          <div className="h-4 w-1/2 rounded bg-line/70" />
          <div className="mt-8 h-48 rounded-2xl bg-line/50" />
        </div>
      </div>
    </div>
  );
}
