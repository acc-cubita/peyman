import { cx } from "@/lib/cx";
import { discountPercent, faNumber } from "@/lib/format";

export function PriceTag({
  price,
  compareAtPrice,
  size = "card",
}: {
  price: number;
  compareAtPrice?: number;
  size?: "card" | "large";
}) {
  const off = discountPercent(price, compareAtPrice);

  return (
    <div className="flex flex-col items-end gap-0.5">
      {off > 0 && (
        <div className="flex items-center gap-2 text-xs">
          <del className="text-muted">{faNumber(compareAtPrice!)}</del>
          <span className="rounded-full bg-signal px-2 py-0.5 font-semibold text-white">
            {faNumber(off)}٪
          </span>
        </div>
      )}
      <p className="flex items-baseline gap-1.5">
        <span
          className={cx(
            "font-semibold tabular-nums text-ink",
            size === "large" ? "text-2xl" : "text-base",
          )}
        >
          {faNumber(price)}
        </span>
        <span className={cx("text-muted", size === "large" ? "text-sm" : "text-xs")}>
          تومان
        </span>
      </p>
    </div>
  );
}
