"use client";

import { Check } from "lucide-react";
import { useActionState } from "react";
import { saveProfile, type ProfileState } from "../../actions";

const inputClass =
  "h-11 w-full rounded-xl bg-silk px-3.5 text-sm text-ink ring-1 ring-line focus:bg-surface focus:ring-2 focus:ring-board focus:outline-none";

export function ProfileForm({ name, mobile }: { name: string; mobile: string }) {
  const [state, formAction, pending] = useActionState(saveProfile, {} satisfies ProfileState);

  return (
    // Remount when the saved name comes back, so the field shows it.
    <form key={name} action={formAction} className="max-w-md space-y-5">
      <label className="block space-y-1.5 text-sm">
        <span className="font-medium">نام و نام خانوادگی</span>
        <input name="name" defaultValue={name} autoComplete="name" maxLength={60} className={inputClass} />
      </label>
      <div className="space-y-1.5 text-sm">
        <p className="flex items-baseline justify-between gap-2 font-medium">
          شماره موبایل
          <span className="text-xs font-normal text-muted">شناسه حساب شماست و تغییر نمی‌کند</span>
        </p>
        <p dir="ltr" className="flex h-11 items-center justify-end rounded-xl bg-line/40 px-3.5 font-mono text-muted">
          {mobile}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="h-11 rounded-full bg-board px-7 font-medium text-silk hover:bg-board-deep disabled:opacity-70"
        >
          {pending ? "در حال ذخیره…" : "ذخیره"}
        </button>
        <span aria-live="polite" className="text-sm">
          {state.ok && !pending && (
            <span className="flex items-center gap-1.5 text-board">
              <Check aria-hidden className="size-4" />
              ذخیره شد
            </span>
          )}
          {state.error && <span className="text-signal">{state.error}</span>}
        </span>
      </div>
    </form>
  );
}
