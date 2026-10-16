"use client";

import { ArrowLeft, LoaderCircle, Search } from "lucide-react";
import Form from "next/form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { cx } from "@/lib/cx";
import { faNumber, formatToman, normalizeText, toLatinDigits } from "@/lib/format";
import type { SearchSuggestion } from "@/lib/types";
import { CategoryIcon } from "./category-icon";

/*
 * Search field with live suggestions: from two letters on, a dropdown lists
 * the best-matching products. Enter without a highlighted row (or the
 * button) still opens the full results page.
 */

const MIN_LETTERS = 2;
const DEBOUNCE_MS = 180;

type Suggestions = { query: string; items: SearchSuggestion[]; total: number };

export function SearchBox({
  id,
  defaultValue,
  className,
}: {
  id: string;
  defaultValue?: string;
  className?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue ?? "");
  const [result, setResult] = useState<Suggestions | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const input = useRef<HTMLInputElement>(null);
  const cache = useRef(new Map<string, Suggestions>());
  const listId = useId();

  const term = query.trim();
  const ready = normalizeText(term).length >= MIN_LETTERS;

  useEffect(() => {
    if (!ready) return;
    const controller = new AbortController();
    const known = cache.current.get(term);
    const timer = setTimeout(
      async () => {
        if (known) return setResult(known);
        try {
          const response = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: controller.signal });
          if (!response.ok) return;
          const data: Suggestions = { query: term, ...((await response.json()) as Omit<Suggestions, "query">) };
          cache.current.set(term, data);
          setResult(data);
        } catch {
          // Aborted by the next keystroke, or offline: the full search still works.
        }
      },
      known ? 0 : DEBOUNCE_MS,
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term, ready]);

  // While the next answer loads, keep showing the previous one so the box does not flicker.
  const shown = ready ? result : null;
  const loading = ready && result?.query !== term;
  const items = shown?.items ?? [];
  const expanded = open && ready && shown !== null;
  const resultsHref = `/search?q=${encodeURIComponent(term)}`;

  function close() {
    setOpen(false);
    setActive(-1);
  }

  function choose(index: number) {
    const item = items[index];
    if (!item) return;
    close();
    input.current?.blur();
    router.push(`/product/${item.slug}`);
  }

  return (
    <Form action="/search" role="search" onSubmit={close} className={cx("relative", className)}>
      <label htmlFor={id} className="sr-only">
        جستجو در محصولات
      </label>
      <input
        ref={input}
        id={id}
        name="q"
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={close}
        onKeyDown={(event) => {
          if (event.key === "Escape" && expanded) {
            // First Escape closes the box; the browser's own clear-on-Escape waits for the second.
            event.preventDefault();
            close();
          } else if (event.key === "ArrowDown" && items.length > 0) {
            event.preventDefault();
            setOpen(true);
            setActive((index) => (index + 1) % items.length);
          } else if (event.key === "ArrowUp" && items.length > 0) {
            event.preventDefault();
            setActive((index) => (index <= 0 ? items.length - 1 : index - 1));
          } else if (event.key === "Enter" && expanded && active >= 0) {
            event.preventDefault();
            choose(active);
          }
        }}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-activedescendant={expanded && active >= 0 ? `${listId}-${active}` : undefined}
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
        {loading && open ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : <Search aria-hidden className="size-4" />}
      </button>

      {expanded && (
        // Mouse down here must not blur the input before the click lands.
        <div
          onMouseDown={(event) => event.preventDefault()}
          className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl bg-surface text-sm shadow-[0_18px_50px_-18px_rgb(10_51_40/0.45)] ring-1 ring-line"
        >
          {items.length === 0 ? (
            <p className="px-4 py-5 text-center text-muted">
              کالایی با «{shown.query}» پیدا نشد. نام دیگر یا کد قطعه را امتحان کنید.
            </p>
          ) : (
            <ul id={listId} role="listbox" aria-label="پیشنهادهای جستجو" className="max-h-[min(26rem,60vh)] overflow-y-auto py-1.5">
              {items.map((item, index) => (
                <li key={item.slug} role="none">
                  <Link
                    id={`${listId}-${index}`}
                    role="option"
                    aria-selected={index === active}
                    href={`/product/${item.slug}`}
                    onClick={() => {
                      close();
                      input.current?.blur();
                    }}
                    onMouseEnter={() => setActive(index)}
                    className={cx("flex items-center gap-3 px-3 py-2", index === active && "bg-silk")}
                  >
                    <span
                      aria-hidden
                      className={cx(
                        "grid size-11 shrink-0 place-items-center rounded-lg",
                        item.onBoard ? "perfboard bg-board text-copper-bright" : "gridpaper bg-silk text-board ring-1 ring-line",
                      )}
                    >
                      <CategoryIcon icon={item.icon} className="size-6" strokeWidth={1.5} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-1 font-medium text-ink">
                        <Highlight text={item.name} query={shown.query} />
                      </span>
                      <span className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                        <span className="truncate">{item.category}</span>
                        <span dir="ltr" className="shrink-0 font-mono">{item.sku}</span>
                      </span>
                    </span>
                    <span className="shrink-0 text-xs tabular-nums">
                      {item.stock > 0 ? formatToman(item.price) : <span className="text-muted">ناموجود</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {shown.total > 0 && (
            <Link
              href={resultsHref}
              onClick={() => {
                close();
                input.current?.blur();
              }}
              className="flex items-center justify-between gap-3 border-t border-line bg-silk/60 px-4 py-2.5 text-xs font-medium text-copper-deep hover:bg-silk"
            >
              {shown.total > items.length
                ? `نمایش همه ${faNumber(shown.total)} نتیجه برای «${shown.query}»`
                : `صفحه نتایج «${shown.query}»`}
              <ArrowLeft aria-hidden className="size-4" />
            </Link>
          )}
        </div>
      )}
    </Form>
  );
}

/** Folds letter variants and digits one-for-one, so indexes match the original text. */
const fold = (value: string) =>
  toLatinDigits(value).replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/‌/g, " ").toLowerCase();

/** Marks where each typed word appears in the product name. */
function Highlight({ text, query }: { text: string; query: string }) {
  const folded = fold(text);
  const ranges: Array<[number, number]> = [];
  for (const word of normalizeText(query).split(" ").filter(Boolean)) {
    const start = folded.indexOf(word);
    if (start >= 0) ranges.push([start, start + word.length]);
  }
  if (ranges.length === 0) return text;

  ranges.sort((a, b) => a[0] - b[0]);
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  for (const [start, end] of ranges) {
    if (start < cursor) continue;
    parts.push(text.slice(cursor, start));
    parts.push(
      <mark key={start} className="rounded-sm bg-copper/20 text-inherit">
        {text.slice(start, end)}
      </mark>,
    );
    cursor = end;
  }
  parts.push(text.slice(cursor));
  return parts;
}
