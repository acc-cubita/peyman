"use client";

import { LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { CartSkeleton } from "@/components/cart-view";
import { useCartLines, useHydrated } from "@/lib/cart-store";
import { cx } from "@/lib/cx";
import { faNumber, formatToman } from "@/lib/format";
import { orderTotals } from "@/lib/pricing";
import type { CartCatalog } from "@/lib/types";
import { placeOrder, type CheckoutState } from "./actions";

const initialState: CheckoutState = {};

export function CheckoutForm({ catalog, provinces }: { catalog: CartCatalog; provinces: readonly string[] }) {
  const lines = useCartLines(catalog);
  const hydrated = useHydrated();
  const [state, formAction, pending] = useActionState(placeOrder, initialState);
  const router = useRouter();

  // The server refused because prices moved: reload the price list so the
  // summary shows the amount the next submit will charge.
  useEffect(() => {
    if (state.pricesChanged) router.refresh();
  }, [state, router]);

  if (!hydrated) return <CartSkeleton />;

  if (lines.length === 0) {
    return (
      <div className="rounded-3xl bg-surface px-6 py-14 text-center ring-1 ring-line">
        <p className="text-lg font-semibold">سبد خرید شما خالی است.</p>
        <Link href="/" className="mt-6 inline-block rounded-full bg-board px-6 py-3 font-medium text-silk hover:bg-board-deep">
          رفتن به فروشگاه
        </Link>
      </div>
    );
  }

  const { count, subtotal, shipping, total } = orderTotals(lines);
  const values = state.values;
  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <input type="hidden" name="cart" value={JSON.stringify(lines.map(({ slug, qty }) => ({ slug, qty })))} />
      <input type="hidden" name="expectedTotal" value={total} />

      <fieldset disabled={pending} className="min-w-0 space-y-6 rounded-2xl bg-surface p-5 ring-1 ring-line sm:p-7">
        <legend className="sr-only">مشخصات گیرنده</legend>
        <h2 className="text-lg font-semibold">مشخصات گیرنده</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field name="name" label="نام و نام خانوادگی" error={errors.name}>
            <input id="name" name="name" autoComplete="name" required defaultValue={values?.name} {...invalid("name", errors.name)} className={inputClass} />
          </Field>
          <Field name="mobile" label="شماره موبایل" hint="مثال: ۰۹۱۲۱۲۳۴۵۶۷" error={errors.mobile}>
            <input id="mobile" name="mobile" type="tel" inputMode="numeric" autoComplete="tel" dir="ltr" required defaultValue={values?.mobile} {...invalid("mobile", errors.mobile)} className={cx(inputClass, "text-start font-mono")} />
          </Field>
          <Field name="province" label="استان" error={errors.province}>
            {/* Remount on each result: React's post-action form reset otherwise drops a select's default. */}
            <select key={values?.province} id="province" name="province" autoComplete="address-level1" required defaultValue={values?.province ?? ""} {...invalid("province", errors.province)} className={inputClass}>
              <option value="" disabled>
                انتخاب کنید
              </option>
              {provinces.map((province) => (
                <option key={province}>{province}</option>
              ))}
            </select>
          </Field>
          <Field name="city" label="شهر" error={errors.city}>
            <input id="city" name="city" autoComplete="address-level2" required defaultValue={values?.city} {...invalid("city", errors.city)} className={inputClass} />
          </Field>
          <Field name="address" label="نشانی کامل" error={errors.address} wide>
            <textarea id="address" name="address" rows={3} autoComplete="street-address" required defaultValue={values?.address} {...invalid("address", errors.address)} className={cx(inputClass, "h-auto py-3 leading-7")} />
          </Field>
          <Field name="postalCode" label="کد پستی" hint="۱۰ رقم، بدون خط تیره" error={errors.postalCode}>
            <input id="postalCode" name="postalCode" inputMode="numeric" autoComplete="postal-code" dir="ltr" required defaultValue={values?.postalCode} {...invalid("postalCode", errors.postalCode)} className={cx(inputClass, "text-start font-mono")} />
          </Field>
          <Field name="note" label="توضیحات سفارش (اختیاری)" error={errors.note}>
            <input id="note" name="note" defaultValue={values?.note} {...invalid("note", errors.note)} className={inputClass} />
          </Field>
        </div>
      </fieldset>

      <aside aria-label="خلاصه سفارش" className="h-fit space-y-4 rounded-2xl bg-surface p-5 ring-1 ring-line lg:sticky lg:top-6">
        <h2 className="font-semibold">سفارش شما</h2>
        <ul className="space-y-2 border-b border-line pb-4 text-sm">
          {lines.map((line) => (
            <li key={line.slug} className="flex justify-between gap-3">
              <span className="line-clamp-1 text-muted">
                {line.name} <span className="text-ink">×{faNumber(line.qty)}</span>
              </span>
              <span className="shrink-0 tabular-nums">{faNumber(line.price * line.qty)}</span>
            </li>
          ))}
        </ul>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">قیمت کالاها ({faNumber(count)})</dt>
            <dd className="tabular-nums">{formatToman(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">هزینه ارسال</dt>
            <dd className="tabular-nums">{shipping === 0 ? "رایگان" : formatToman(shipping)}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-3 text-base font-semibold">
            <dt>مبلغ قابل پرداخت</dt>
            <dd className="tabular-nums">{formatToman(total)}</dd>
          </div>
        </dl>

        {state.message && (
          <p role="alert" className="rounded-xl bg-signal/10 px-3 py-2 text-sm leading-7 text-signal">
            {state.message}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-board font-medium text-silk transition-colors hover:bg-board-deep disabled:cursor-wait disabled:opacity-70"
        >
          <LockKeyhole aria-hidden className="size-4" />
          {pending ? "در حال انتقال به درگاه…" : "پرداخت و ثبت سفارش"}
        </button>
        <p className="text-center text-xs leading-6 text-muted">پرداخت امن با همه کارت‌های بانکی عضو شتاب، از طریق زرین‌پال</p>
        <Link href="/cart" className="block text-center text-sm text-copper-deep underline-offset-4 hover:underline">
          ویرایش سبد خرید
        </Link>
      </aside>
    </form>
  );
}

const inputClass =
  "h-11 w-full rounded-xl bg-silk px-3.5 text-sm text-ink ring-1 ring-line focus:bg-surface focus:ring-2 focus:ring-board focus:outline-none aria-invalid:ring-2 aria-invalid:ring-signal";

function invalid(name: string, error?: string) {
  return error ? { "aria-invalid": true, "aria-describedby": `${name}-error` } : {};
}

function Field({
  name,
  label,
  hint,
  error,
  wide,
  children,
}: {
  name: string;
  label: string;
  hint?: string;
  error?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cx("space-y-1.5", wide && "sm:col-span-2")}>
      <label htmlFor={name} className="flex items-baseline justify-between gap-2 text-sm font-medium">
        {label}
        {hint && <span className="text-xs font-normal text-muted">{hint}</span>}
      </label>
      {children}
      {error && (
        <p id={`${name}-error`} className="text-xs text-signal">
          {error}
        </p>
      )}
    </div>
  );
}
