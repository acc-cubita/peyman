import { Star } from "lucide-react";
import { faDecimal, faNumber } from "@/lib/format";

export function Rating({ value, count }: { value: number; count: number }) {
  return (
    <p className="flex items-center gap-1 text-xs text-muted">
      <Star aria-hidden className="size-3.5 fill-copper text-copper" />
      <span className="font-medium text-ink">{faDecimal(value)}</span>
      <span>({faNumber(count)} نظر)</span>
    </p>
  );
}
