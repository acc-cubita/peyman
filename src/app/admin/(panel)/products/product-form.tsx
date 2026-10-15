"use client";

import Link from "next/link";
import { useActionState } from "react";
import { cx } from "@/lib/cx";
import type { Category } from "@/lib/types";
import { saveProduct, type ProductFormState } from "./actions";
import type { ProductFormField, ProductFormValues } from "./product-form-schema";

const emptyValues: ProductFormValues = {
  name: "",
  nameEn: "",
  brand: "",
  category: "",
  sku: "",
  slug: "",
  price: "",
  compareAtPrice: "",
  stock: "0",
  summary: "",
  description: "",
  highlights: "",
  specs: "",
  featured: false,
  active: true,
};

export function ProductForm({
  categories,
  product,
}: {
  categories: readonly Pick<Category, "slug" | "name" | "group">[];
  /** Present when editing; the slug cannot change after creation. */
  product?: { slug: string; values: ProductFormValues };
}) {
  const [state, formAction, pending] = useActionState(saveProduct.bind(null, product?.slug ?? null), {
    attempt: 0,
  } satisfies ProductFormState);
  const values = state.values ?? product?.values ?? emptyValues;
  const errors = state.errors ?? {};

  const field = (name: ProductFormField) => ({
    id: name,
    name,
    defaultValue: values[name],
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });

  return (
    // Remounting after each save attempt restores the echoed values, including selects.
    <form key={state.attempt} action={formAction} className="space-y-6">
      {state.message && (
        <p role="alert" className="rounded-xl bg-signal/10 px-4 py-3 text-sm text-signal">
          {state.message}
        </p>
      )}

      <Section title="اطلاعات اصلی">
        <Field label="نام محصول" name="name" error={errors.name} wide>
          <input {...field("name")} required className={inputClass} placeholder="برد توسعه ESP32 DevKit V1" />
        </Field>
        <Field label="نام لاتین / مدل" name="nameEn" error={errors.nameEn}>
          <input {...field("nameEn")} dir="ltr" required className={cx(inputClass, "text-start")} placeholder="ESP32 DevKit V1" />
        </Field>
        <Field label="برند" name="brand" error={errors.brand}>
          <input {...field("brand")} dir="ltr" required className={cx(inputClass, "text-start")} placeholder="Espressif" />
        </Field>
        <Field label="دسته‌بندی" name="category" error={errors.category}>
          <select {...field("category")} required className={inputClass}>
            <option value="" disabled>
              انتخاب کنید
            </option>
            {(["digital", "components"] as const).map((group) => (
              <optgroup key={group} label={group === "digital" ? "کالای دیجیتال" : "قطعات و ابزار"}>
                {categories
                  .filter((c) => c.group === group)
                  .map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </Field>
        <Field label="کد کالا (SKU)" name="sku" error={errors.sku}>
          <input {...field("sku")} dir="ltr" required className={cx(inputClass, "text-start font-mono uppercase")} placeholder="PE-2105" />
        </Field>
        {product ? (
          <Field label="نشانی صفحه" name="slug" hint="بعد از ساخت تغییر نمی‌کند" wide>
            <p dir="ltr" className="flex h-11 items-center rounded-xl bg-line/40 px-3.5 font-mono text-sm text-muted">
              /product/{product.slug}
            </p>
          </Field>
        ) : (
          <Field label="نشانی صفحه (اختیاری)" name="slug" hint="خالی بماند، از نام لاتین ساخته می‌شود" error={errors.slug} wide>
            <input {...field("slug")} dir="ltr" className={cx(inputClass, "text-start font-mono")} placeholder="esp32-devkit-v1" />
          </Field>
        )}
      </Section>

      <Section title="قیمت و موجودی">
        <Field label="قیمت (تومان)" name="price" error={errors.price}>
          <input {...field("price")} dir="ltr" inputMode="numeric" required className={cx(inputClass, "text-start font-mono")} placeholder="520000" />
        </Field>
        <Field label="قیمت قبل از تخفیف (اختیاری)" name="compareAtPrice" error={errors.compareAtPrice}>
          <input {...field("compareAtPrice")} dir="ltr" inputMode="numeric" className={cx(inputClass, "text-start font-mono")} />
        </Field>
        <Field label="موجودی انبار" name="stock" hint="صفر یعنی ناموجود" error={errors.stock}>
          <input {...field("stock")} dir="ltr" inputMode="numeric" required className={cx(inputClass, "text-start font-mono")} />
        </Field>
      </Section>

      <Section title="محتوای صفحه محصول">
        <Field label="خلاصه (یک جمله)" name="summary" error={errors.summary} wide>
          <input {...field("summary")} required className={inputClass} />
        </Field>
        <Field label="معرفی" name="description" error={errors.description} wide>
          <textarea {...field("description")} rows={5} required className={cx(inputClass, "h-auto py-3 leading-7")} />
        </Field>
        <Field label="ویژگی‌های برجسته" name="highlights" hint="هر ویژگی در یک خط، حداکثر ۸" error={errors.highlights} wide>
          <textarea {...field("highlights")} rows={4} className={cx(inputClass, "h-auto py-3 leading-7")} placeholder={"Wi-Fi و Bluetooth داخلی\nسازگار با Arduino IDE"} />
        </Field>
        <Field label="مشخصات فنی" name="specs" hint="هر ردیف در یک خط: عنوان | مقدار" error={errors.specs} wide>
          <textarea {...field("specs")} rows={7} className={cx(inputClass, "h-auto py-3 leading-7")} placeholder={"ولتاژ کاری | ۳٫۳ ولت\nحافظه فلش | ۴ مگابایت"} />
        </Field>
      </Section>

      <Section title="نمایش">
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" name="active" defaultChecked={values.active} className="size-4 accent-board" />
          در فروشگاه نمایش داده شود
        </label>
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" name="featured" defaultChecked={values.featured} className="size-4 accent-board" />
          در صفحه اصلی پیشنهاد شود
        </label>
      </Section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="h-11 rounded-full bg-board px-8 font-medium text-silk hover:bg-board-deep disabled:opacity-70"
        >
          {pending ? "در حال ذخیره…" : "ذخیره محصول"}
        </button>
        <Link href="/admin/products" className="rounded-full px-5 py-2.5 text-sm text-muted ring-1 ring-line hover:text-ink">
          انصراف
        </Link>
      </div>
    </form>
  );
}

const inputClass =
  "h-11 w-full rounded-xl bg-silk px-3.5 text-sm text-ink ring-1 ring-line focus:bg-surface focus:ring-2 focus:ring-board focus:outline-none aria-invalid:ring-2 aria-invalid:ring-signal";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="grid gap-5 rounded-2xl bg-surface p-5 ring-1 ring-line sm:grid-cols-2 sm:p-7">
      <legend className="sr-only">{title}</legend>
      <h2 aria-hidden className="font-semibold sm:col-span-2">
        {title}
      </h2>
      {children}
    </fieldset>
  );
}

function Field({
  label,
  name,
  hint,
  error,
  wide,
  children,
}: {
  label: string;
  name: string;
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
        <p id={`${name}-error`} className="text-xs leading-6 text-signal">
          {error}
        </p>
      )}
    </div>
  );
}
