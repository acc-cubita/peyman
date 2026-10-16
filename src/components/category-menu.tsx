"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

type Section = { title: string; items: Array<{ slug: string; shortName: string }> };

/** Category list for phones and tablets, where one row of links would not fit. */
export function CategoryMenu({ sections }: { sections: Section[] }) {
  const details = useRef<HTMLDetailsElement>(null);
  // The header survives client navigation, so close the menu once a category is picked.
  const close = () => {
    if (details.current) details.current.open = false;
  };

  return (
    <details ref={details} className="group lg:hidden">
      <summary className="mx-auto flex max-w-7xl cursor-pointer list-none items-center justify-between px-4 py-2.5 text-sm font-medium [&::-webkit-details-marker]:hidden">
        دسته‌بندی محصولات
        <ChevronDown aria-hidden className="size-4 text-muted transition-transform group-open:rotate-180" />
      </summary>
      <div className="mx-auto grid max-w-7xl gap-x-6 gap-y-4 px-4 pb-4 sm:grid-cols-2">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="mb-1.5 text-xs text-muted">{section.title}</p>
            <ul className="grid grid-cols-2 gap-1 text-sm">
              {section.items.map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/category/${category.slug}`}
                    onClick={close}
                    className="block rounded-lg bg-surface px-3 py-2 ring-1 ring-line hover:text-board hover:ring-board/40"
                  >
                    {category.shortName}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </details>
  );
}
