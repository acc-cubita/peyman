"use client";

import { Check } from "lucide-react";
import { useActionState } from "react";
import type { Fulfillment } from "@/lib/orders";
import { saveFulfillment, type FulfillmentState } from "../actions";
import { inputClass, primaryButton } from "../../ui";

const options: Array<{ value: Fulfillment; label: string; hint: string }> = [
  { value: "processing", label: "در حال آماده‌سازی", hint: "پرداخت شده و هنوز ارسال نشده" },
  { value: "shipped", label: "ارسال‌شده", hint: "تحویل پست یا پیک شد" },
  { value: "delivered", label: "تحویل‌شده", hint: "به دست مشتری رسید" },
];

export function FulfillmentForm({
  orderId,
  fulfillment,
  trackingCode,
  adminNote,
}: {
  orderId: string;
  fulfillment: Fulfillment;
  trackingCode: string;
  adminNote: string;
}) {
  const [state, formAction, pending] = useActionState(saveFulfillment.bind(null, orderId), {} satisfies FulfillmentState);

  return (
    // Remount after each save so the fields show what was stored.
    <form key={`${fulfillment}|${trackingCode}|${adminNote}`} action={formAction} className="space-y-5">
      <fieldset>
        <legend className="mb-2 text-sm font-medium">وضعیت ارسال</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {options.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer flex-col gap-0.5 rounded-xl p-3 text-sm ring-1 ring-line has-checked:bg-board/5 has-checked:ring-2 has-checked:ring-board"
            >
              <span className="flex items-center gap-2 font-medium">
                <input
                  type="radio"
                  name="fulfillment"
                  value={option.value}
                  defaultChecked={option.value === fulfillment}
                  className="size-4 accent-board"
                />
                {option.label}
              </span>
              <span className="ps-6 text-xs text-muted">{option.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm">
          <span className="flex items-baseline justify-between gap-2 font-medium">
            کد رهگیری مرسوله
            <span className="text-xs font-normal text-muted">به مشتری نمایش داده می‌شود</span>
          </span>
          <input name="trackingCode" defaultValue={trackingCode} dir="ltr" maxLength={60} className={`${inputClass} text-start font-mono`} />
        </label>
        <label className="space-y-1.5 text-sm sm:row-span-2">
          <span className="flex items-baseline justify-between gap-2 font-medium">
            یادداشت داخلی
            <span className="text-xs font-normal text-muted">فقط مدیر می‌بیند</span>
          </span>
          <textarea name="adminNote" defaultValue={adminNote} rows={4} maxLength={1000} className={`${inputClass} h-auto py-2.5 leading-7`} />
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "در حال ذخیره…" : "ذخیره وضعیت"}
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
