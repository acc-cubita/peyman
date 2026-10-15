"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { CATALOG_TAG } from "@/lib/catalog";
import { toLatinDigits } from "@/lib/format";
import {
  createProduct,
  deleteProduct,
  DuplicateError,
  findProduct,
  updatePriceAndStock,
  updateProduct,
} from "@/lib/products";
import { parseProductForm, productFormValues, type ProductFormErrors, type ProductFormValues } from "./product-form-schema";

export type ProductFormState = {
  attempt: number;
  message?: string;
  errors?: ProductFormErrors;
  values?: ProductFormValues;
};

/** Creates a product, or updates one when `originalSlug` is set. */
export async function saveProduct(
  originalSlug: string | null,
  previous: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin();
  const attempt = previous.attempt + 1;
  const values = productFormValues(formData);
  const parsed = parseProductForm(values, { creating: originalSlug === null });
  if (!parsed.ok) {
    return { attempt, values, errors: parsed.errors, message: "لطفاً موارد مشخص‌شده را اصلاح کنید." };
  }

  try {
    if (originalSlug === null) {
      createProduct(parsed.input);
    } else {
      if (!findProduct(originalSlug)) return { attempt, values, message: "این محصول دیگر وجود ندارد." };
      updateProduct(originalSlug, parsed.input);
    }
  } catch (error) {
    if (error instanceof DuplicateError) {
      const errors: ProductFormErrors =
        error.field === "slug"
          ? { slug: "محصول دیگری با همین نشانی وجود دارد." }
          : { sku: "کد کالا تکراری است." };
      return { attempt, values, errors, message: "لطفاً موارد مشخص‌شده را اصلاح کنید." };
    }
    throw error;
  }

  updateTag(CATALOG_TAG);
  redirect(`/admin/products?saved=${encodeURIComponent(originalSlug ?? parsed.input.slug)}`);
}

export type QuickEditState = { ok?: boolean; error?: string };

/** Inline price/stock update from the product list. */
export async function quickUpdate(slug: string, _previous: QuickEditState, formData: FormData): Promise<QuickEditState> {
  await requireAdmin();
  const number = (name: string) => {
    const cleaned = toLatinDigits(String(formData.get(name) ?? "")).replace(/[\s,٬_]/g, "");
    return /^\d+$/.test(cleaned) ? Number(cleaned) : Number.NaN;
  };
  const price = number("price");
  const stock = number("stock");
  if (Number.isNaN(price) || price < 1_000) return { error: "قیمت نامعتبر است." };
  if (Number.isNaN(stock) || stock > 100_000) return { error: "موجودی نامعتبر است." };

  const product = findProduct(slug);
  if (!product) return { error: "محصول پیدا نشد." };
  if (product.compareAtPrice && product.compareAtPrice <= price) {
    return { error: "قیمت از «قیمت قبل از تخفیف» بیشتر شده؛ آن را در صفحه ویرایش اصلاح کنید." };
  }

  updatePriceAndStock(slug, price, stock);
  updateTag(CATALOG_TAG);
  return { ok: true };
}

export async function removeProduct(slug: string, formData: FormData) {
  await requireAdmin();
  if (formData.get("confirm") !== "yes") redirect(`/admin/products/${slug}`);
  deleteProduct(slug);
  updateTag(CATALOG_TAG);
  redirect("/admin/products?deleted=1");
}
