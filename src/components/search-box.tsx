import { Search } from "lucide-react";
import Form from "next/form";
import { cx } from "@/lib/cx";

export function SearchBox({
  id,
  defaultValue,
  className,
}: {
  id: string;
  defaultValue?: string;
  className?: string;
}) {
  return (
    <Form action="/search" role="search" className={cx("relative", className)}>
      <label htmlFor={id} className="sr-only">
        جستجو در محصولات
      </label>
      <input
        id={id}
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder="نام کالا، برند یا کد قطعه…"
        autoComplete="off"
        enterKeyHint="search"
        className="h-11 w-full rounded-full bg-surface ps-4 pe-12 text-sm text-ink ring-1 ring-line placeholder:text-muted/80 focus:ring-2 focus:ring-board focus:outline-none"
      />
      <button
        type="submit"
        aria-label="جستجو"
        className="absolute inset-y-1 end-1 grid w-10 place-items-center rounded-full bg-board text-silk transition-colors hover:bg-board-deep"
      >
        <Search aria-hidden className="size-4" />
      </button>
    </Form>
  );
}
