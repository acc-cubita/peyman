import Link from "next/link";
import { cx } from "@/lib/cx";
import { faNumber } from "@/lib/format";
import type { Category } from "@/lib/types";
import { CategoryIcon } from "./category-icon";

export function CategoryTile({ category, count }: { category: Category; count: number }) {
  const onBoard = category.group === "components";

  return (
    <Link
      href={`/category/${category.slug}`}
      className={cx(
        "group flex h-full flex-col gap-4 rounded-2xl p-4 ring-1 transition-colors",
        onBoard
          ? "perfboard bg-board text-silk ring-board hover:bg-board-deep"
          : "bg-surface text-ink ring-line hover:ring-board/40",
      )}
    >
      <span
        className={cx(
          "grid size-11 place-items-center rounded-xl",
          onBoard ? "bg-board-deep text-copper-bright" : "bg-silk text-board",
        )}
      >
        <CategoryIcon icon={category.icon} className="size-6" strokeWidth={1.5} />
      </span>
      <span className="flex flex-1 flex-col gap-1">
        <span className="font-semibold">{category.name}</span>
        <span className={cx("text-xs leading-6", onBoard ? "text-board-ink/80" : "text-muted")}>
          {category.tagline}
        </span>
      </span>
      <span className={cx("text-xs", onBoard ? "text-copper-bright" : "text-copper-deep")}>
        {faNumber(count)} کالا
      </span>
    </Link>
  );
}
