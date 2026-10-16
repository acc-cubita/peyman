import { categoryOf } from "@/lib/categories";
import { cx } from "@/lib/cx";
import type { Product } from "@/lib/types";
import { CategoryIcon } from "./category-icon";

/**
 * Stand-in product visual until real photos exist: the store's own products
 * sit on graph paper, components on perfboard, each tagged with its SKU like a
 * silkscreen label.
 */
export function ProductArt({
  product,
  size = "card",
  className,
}: {
  product: Pick<Product, "category" | "sku">;
  size?: "card" | "large" | "thumb";
  className?: string;
}) {
  const category = categoryOf(product);
  const onBoard = category.group === "components";

  return (
    <div
      aria-hidden
      className={cx(
        "relative grid aspect-square place-items-center overflow-hidden",
        size === "thumb" ? "rounded-lg" : "rounded-xl",
        onBoard ? "bg-board perfboard text-copper-bright" : "gridpaper bg-surface text-board",
        className,
      )}
    >
      <CategoryIcon
        icon={category.icon}
        strokeWidth={size === "thumb" ? 1.5 : 1.1}
        className={size === "large" ? "size-2/5" : "size-1/2"}
      />
      {size !== "thumb" && (
        <>
          <span
            dir="ltr"
            className={cx(
              "absolute bottom-3 left-3 font-mono text-[11px] tracking-widest",
              onBoard ? "text-board-ink/70" : "text-muted",
            )}
          >
            {product.sku}
          </span>
          <span
            className={cx(
              "absolute top-3 left-3 size-1.5 rounded-full",
              onBoard ? "bg-board-ink/60" : "bg-copper",
            )}
          />
        </>
      )}
    </div>
  );
}
