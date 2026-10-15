import { ArrowLeft, Headset, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import { CategoryTile } from "@/components/category-tile";
import { HeroBoard } from "@/components/hero-board";
import { JsonLd } from "@/components/json-ld";
import { ProductGrid } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import { getCategories, getCategoryCounts, getFeaturedProducts } from "@/lib/catalog";
import { faNumber } from "@/lib/format";
import { groups, site } from "@/lib/site";

const assurances = [
  { icon: ShieldCheck, title: "ضمانت اصالت کالا", text: "همه کالاها اصل و با فاکتور رسمی" },
  { icon: Truck, title: "ارسال به سراسر ایران", text: `رایگان برای سفارش‌های بالای ${faNumber(site.freeShippingFrom / 1_000_000)} میلیون تومان` },
  { icon: PackageCheck, title: "هفت روز مهلت بازگشت", text: "برای کالای سالم در بسته‌بندی اصلی" },
  { icon: Headset, title: "مشاوره فنی پیش از خرید", text: "برای انتخاب برد، سنسور یا قطعه مناسب" },
];

export default async function HomePage() {
  const [digital, components, counts, featuredDigital, featuredComponents] = await Promise.all([
    getCategories("digital"),
    getCategories("components"),
    getCategoryCounts(),
    getFeaturedProducts("digital"),
    getFeaturedProducts("components"),
  ]);

  return (
    <>
      <JsonLd
        graph={[
          { "@type": "Organization", name: site.name, url: site.url, logo: `${site.url}/icon.svg` },
          {
            "@type": "WebSite",
            name: site.name,
            url: site.url,
            inLanguage: "fa-IR",
            potentialAction: {
              "@type": "SearchAction",
              target: { "@type": "EntryPoint", urlTemplate: `${site.url}/search?q={search_term_string}` },
              "query-input": "required name=search_term_string",
            },
          },
        ]}
      />

      <section className="mx-auto max-w-7xl px-4 pt-6">
        <div className="perfboard relative grid overflow-hidden rounded-3xl bg-board-deep lg:grid-cols-[1.05fr_1fr]">
          <div className="relative z-10 flex flex-col gap-6 p-7 sm:p-10 lg:py-14">
            <p className="text-sm text-copper-bright">فروشگاه کالای دیجیتال و قطعات الکترونیک</p>
            <h1 className="font-display text-[2.6rem] leading-[1.3] text-silk sm:text-6xl sm:leading-[1.25]">
              از گوشی تا مقاومت،
              <br />
              <span className="text-copper-bright">هرچه برق می‌خورد.</span>
            </h1>
            <p className="max-w-xl leading-8 text-board-ink">
              {site.name} دو راسته دارد: کالای دیجیتال برای همه، و قطعات و ابزار برای کسی که
              خودش می‌سازد و تعمیر می‌کند. هر کالا با مشخصات فنی کامل و قیمت روشن عرضه می‌شود.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {(["digital", "components"] as const).map((group) => (
                <a
                  key={group}
                  href={`#${group}`}
                  className="group flex items-center justify-between gap-3 rounded-2xl border border-copper/60 bg-board/60 px-5 py-4 transition-colors hover:border-copper-bright hover:bg-board"
                >
                  <span>
                    <span className="block font-semibold text-silk">{groups[group].name}</span>
                    <span className="block text-xs leading-6 text-board-ink/80">{groups[group].blurb}</span>
                  </span>
                  <ArrowLeft aria-hidden className="size-5 shrink-0 text-copper-bright transition-transform group-hover:-translate-x-1" />
                </a>
              ))}
            </div>
          </div>
          <HeroBoard className="-mt-4 w-full self-center px-4 pb-6 lg:mt-0 lg:px-0 lg:pb-0" />
        </div>

        <ul className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {assurances.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex items-start gap-3 rounded-2xl bg-surface p-4 ring-1 ring-line">
              <Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-board" strokeWidth={1.75} />
              <span>
                <span className="block text-sm font-semibold">{title}</span>
                <span className="block text-xs leading-6 text-muted">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="digital" className="mx-auto mt-16 max-w-7xl scroll-mt-6 px-4">
        <SectionHeading id="digital" title={groups.digital.name} description="گوشی، لپ‌تاپ، صوتی، پوشیدنی و لوازم جانبی با گارانتی معتبر" />
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {digital.map((category) => (
            <li key={category.slug}>
              <CategoryTile category={category} count={counts[category.slug] ?? 0} />
            </li>
          ))}
        </ul>
        <h3 className="mt-10 mb-4 text-lg font-semibold">پیشنهادهای کالای دیجیتال</h3>
        <ProductGrid products={featuredDigital} />
      </section>

      <section aria-labelledby="components" className="mx-auto mt-20 max-w-7xl scroll-mt-6 px-4">
        <SectionHeading id="components" title={groups.components.name} description="برای سازنده‌ها، دانشجوها و تعمیرکارها؛ با پایه‌بندی و ولتاژ کاری هر قطعه" />
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {components.map((category) => (
            <li key={category.slug}>
              <CategoryTile category={category} count={counts[category.slug] ?? 0} />
            </li>
          ))}
        </ul>
        <h3 className="mt-10 mb-4 text-lg font-semibold">پرفروش‌های کارگاه</h3>
        <ProductGrid products={featuredComponents} />
      </section>

      <section className="mx-auto mt-20 max-w-7xl px-4">
        <div className="flex flex-col items-start gap-5 rounded-3xl border-2 border-dashed border-copper/70 bg-surface p-7 sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div className="max-w-2xl">
            <p dir="ltr" className="text-end font-mono text-xs tracking-[0.3em] text-copper-deep">BOM</p>
            <h2 className="mt-1 font-display text-3xl text-board">لیست قطعات پروژه‌ات را بفرست</h2>
            <p className="mt-2 leading-8 text-muted">
              فهرست قطعات (BOM) پروژه را برای ما بفرستید تا موجودی و قیمت همه را یک‌جا بررسی کنیم و
              پیش‌فاکتور بدهیم. برای سفارش‌های دانشگاهی و تعداد بالا هم همین مسیر را بروید.
            </p>
          </div>
          <a
            href={`tel:${site.phone}`}
            className="flex shrink-0 items-center gap-2 rounded-full bg-board px-6 py-3 font-medium text-silk transition-colors hover:bg-board-deep"
          >
            تماس برای پیش‌فاکتور
            <span dir="ltr" className="font-mono text-sm text-copper-bright">{site.phone}</span>
          </a>
        </div>
      </section>
    </>
  );
}
