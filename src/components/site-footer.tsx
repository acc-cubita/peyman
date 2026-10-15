import Link from "next/link";
import { getCategories } from "@/lib/catalog";
import { groups, site } from "@/lib/site";
import { LogoMark } from "./logo-mark";

export async function SiteFooter() {
  const [digital, components] = await Promise.all([
    getCategories("digital"),
    getCategories("components"),
  ]);

  const columns = [
    { title: groups.digital.name, items: digital },
    { title: groups.components.name, items: components },
  ];

  return (
    <footer className="perfboard mt-20 bg-board-deep text-sm text-board-ink">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark className="size-9" />
            <span className="font-display text-2xl text-silk">{site.name}</span>
          </Link>
          <p className="leading-7 text-board-ink/80">{site.description}</p>
        </div>

        {columns.map((column) => (
          <div key={column.title}>
            <h2 className="mb-4 font-semibold text-silk">{column.title}</h2>
            <ul className="space-y-2.5">
              {column.items.map((category) => (
                <li key={category.slug}>
                  <Link href={`/category/${category.slug}`} className="hover:text-copper-bright">
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h2 className="mb-4 font-semibold text-silk">تماس با ما</h2>
          <ul className="space-y-2.5">
            <li>
              تلفن:{" "}
              <a href={`tel:${site.phone}`} dir="ltr" className="font-mono hover:text-copper-bright">
                {site.phone}
              </a>
            </li>
            <li>{site.city}</li>
            <li>
              <Link href="/cart" className="hover:text-copper-bright">
                سبد خرید
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-4 py-5 text-xs text-board-ink/70">
          همه قیمت‌ها به تومان است. تمامی حقوق برای {site.name} محفوظ است.
        </p>
      </div>
    </footer>
  );
}
