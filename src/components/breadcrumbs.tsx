import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { site } from "@/lib/site";

export type Crumb = { name: string; href?: string };

export function Breadcrumbs({ items }: { items: readonly Crumb[] }) {
  return (
    <nav aria-label="مسیر صفحه" className="text-xs text-muted">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => (
          <li key={item.name} className="flex items-center gap-1">
            {index > 0 && <ChevronLeft aria-hidden className="size-3.5 text-line" />}
            {item.href ? (
              <Link href={item.href} className="hover:text-board">
                {item.name}
              </Link>
            ) : (
              <span aria-current="page" className="text-ink">
                {item.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** BreadcrumbList schema matching the visible trail; the last item has no URL. */
export function breadcrumbSchema(items: readonly Crumb[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.href ? { item: new URL(item.href, site.url).toString() } : {}),
    })),
  };
}
