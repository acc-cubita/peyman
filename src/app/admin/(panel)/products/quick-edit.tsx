"use client";

import { Check } from "lucide-react";
import { useActionState } from "react";
import { faNumber } from "@/lib/format";
import { quickUpdate, type QuickEditState } from "./actions";

const inputClass =
  "h-9 rounded-lg bg-silk px-2.5 font-mono text-sm ring-1 ring-line focus:bg-surface focus:ring-2 focus:ring-board focus:outline-none";

export function QuickEdit({ slug, price, stock }: { slug: string; price: number; stock: number }) {
  const [state, formAction, pending] = useActionState(quickUpdate.bind(null, slug), {} satisfies QuickEditState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <label className="flex flex-col gap-1 text-xs text-muted">
        <span>
          قیمت (تومان) <span className="text-ink/70">{faNumber(price)}</span>
        </span>
        <input name="price" defaultValue={price} dir="ltr" inputMode="numeric" className={`${inputClass} w-36`} />
      </label>
      <label className="flex flex-col gap-1 text-xs text-muted">
        موجودی
        <input name="stock" defaultValue={stock} dir="ltr" inputMode="numeric" className={`${inputClass} w-20`} />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="h-9 rounded-lg px-3 text-sm text-board ring-1 ring-line hover:bg-silk disabled:opacity-60"
      >
        ذخیره
      </button>
      <span aria-live="polite" className="flex h-9 items-center text-xs">
        {state.ok && !pending && <Check aria-label="ذخیره شد" className="size-4 text-board" />}
        {state.error && <span className="text-signal">{state.error}</span>}
      </span>
    </form>
  );
}
