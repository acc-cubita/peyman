import "server-only";
import { findCategory } from "@/lib/categories";
import { toLatinDigits } from "@/lib/format";
import type { ProductInput } from "@/lib/products";
import type { Product, Spec } from "@/lib/types";

/** Raw form values, echoed back so a failed save keeps what the admin typed. */
export type ProductFormValues = Record<ProductFormField, string> & { featured: boolean; active: boolean };

export type ProductFormField =
  | "name"
  | "nameEn"
  | "brand"
  | "category"
  | "sku"
  | "slug"
  | "price"
  | "compareAtPrice"
  | "stock"
  | "warrantyMonths"
  | "summary"
  | "description"
  | "highlights"
  | "specs";

export type ProductFormErrors = Partial<Record<ProductFormField, string>>;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SKU = /^[A-Z0-9][A-Z0-9-]{1,23}$/;

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "");
}

/** Parses "12,500,000" or «۱۲٬۵۰۰٬۰۰۰» into 12500000; empty → null, junk → NaN. */
function parseAmount(raw: string) {
  const cleaned = toLatinDigits(raw).replace(/[\s,٬_]/g, "");
  if (cleaned === "") return null;
  return /^\d+$/.test(cleaned) ? Number(cleaned) : Number.NaN;
}

const lines = (raw: string) =>
  raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

export function valuesFromProduct(product: Product): ProductFormValues {
  return {
    name: product.name,
    nameEn: product.nameEn,
    brand: product.brand,
    category: product.category,
    sku: product.sku,
    slug: product.slug,
    price: String(product.price),
    compareAtPrice: product.compareAtPrice ? String(product.compareAtPrice) : "",
    stock: String(product.stock),
    warrantyMonths: String(product.warrantyMonths),
    summary: product.summary,
    description: product.description,
    highlights: product.highlights.join("\n"),
    specs: product.specs.map(([label, value]) => `${label} | ${value}`).join("\n"),
    featured: Boolean(product.featured),
    active: product.active,
  };
}

export function productFormValues(formData: FormData): ProductFormValues {
  const text = (name: ProductFormField) => String(formData.get(name) ?? "").trim();
  return {
    name: text("name"),
    nameEn: text("nameEn"),
    brand: text("brand"),
    category: text("category"),
    sku: text("sku").toUpperCase(),
    slug: text("slug").toLowerCase(),
    price: text("price"),
    compareAtPrice: text("compareAtPrice"),
    stock: text("stock"),
    warrantyMonths: text("warrantyMonths"),
    summary: text("summary"),
    description: text("description"),
    highlights: text("highlights"),
    specs: text("specs"),
    featured: formData.get("featured") === "on",
    active: formData.get("active") === "on",
  };
}

export function parseProductForm(values: ProductFormValues, { creating }: { creating: boolean }) {
  const errors: ProductFormErrors = {};
  const between = (value: string, min: number, max: number) => value.length >= min && value.length <= max;

  if (!between(values.name, 3, 120)) errors.name = "نام محصول باید بین ۳ تا ۱۲۰ نویسه باشد.";
  if (!between(values.nameEn, 2, 120)) errors.nameEn = "نام لاتین (مدل) را وارد کنید.";
  if (!between(values.brand, 1, 40)) errors.brand = "برند را وارد کنید.";
  if (!findCategory(values.category)) errors.category = "دسته‌بندی را انتخاب کنید.";
  if (!SKU.test(values.sku)) errors.sku = "کد کالا فقط حروف لاتین بزرگ، عدد و خط تیره؛ مثلاً PE-2105.";

  const slug = values.slug || slugify(values.nameEn);
  if (creating && (!SLUG.test(slug) || slug.length > 80)) {
    errors.slug = "نشانی فقط حروف کوچک لاتین، عدد و خط تیره؛ مثلاً esp32-devkit-v1.";
  }

  const price = parseAmount(values.price);
  const compareAtPrice = parseAmount(values.compareAtPrice);
  const stock = parseAmount(values.stock);
  if (price === null || Number.isNaN(price) || price < 1_000) errors.price = "قیمت را به تومان و حداقل ۱٬۰۰۰ وارد کنید.";
  if (compareAtPrice !== null && (Number.isNaN(compareAtPrice) || (price !== null && compareAtPrice <= price))) {
    errors.compareAtPrice = "قیمت قبل از تخفیف باید از قیمت فعلی بیشتر باشد؛ اگر تخفیف ندارد خالی بگذارید.";
  }
  if (stock === null || Number.isNaN(stock) || stock > 100_000) errors.stock = "موجودی را به عدد وارد کنید (صفر یعنی ناموجود).";
  const warrantyMonths = parseAmount(values.warrantyMonths);
  if (warrantyMonths === null || Number.isNaN(warrantyMonths) || warrantyMonths > 240) {
    errors.warrantyMonths = "مدت گارانتی را به ماه وارد کنید؛ مثلاً ۶۰ برای پنج سال، یا صفر اگر گارانتی ندارد.";
  }

  if (!between(values.summary, 10, 200)) errors.summary = "خلاصه باید بین ۱۰ تا ۲۰۰ نویسه باشد.";
  if (!between(values.description, 20, 3000)) errors.description = "معرفی باید بین ۲۰ تا ۳۰۰۰ نویسه باشد.";

  const highlights = lines(values.highlights);
  if (highlights.length > 8 || highlights.some((line) => line.length > 100)) {
    errors.highlights = "حداکثر ۸ ویژگی، هر کدام در یک خط و حداکثر ۱۰۰ نویسه.";
  }

  const specs: Spec[] = [];
  for (const line of lines(values.specs)) {
    const [label, ...rest] = line.split("|");
    const value = rest.join("|").trim();
    if (!label.trim() || !value) {
      errors.specs = `این خط قالب درستی ندارد: «${line}». هر خط به شکل «عنوان | مقدار» باشد.`;
      break;
    }
    specs.push([label.trim(), value]);
  }
  if (specs.length > 30) errors.specs = "حداکثر ۳۰ ردیف مشخصات.";

  if (Object.keys(errors).length > 0) return { ok: false as const, errors };

  const input: ProductInput = {
    slug,
    sku: values.sku,
    name: values.name,
    nameEn: values.nameEn,
    brand: values.brand,
    category: values.category,
    price: price!,
    compareAtPrice: compareAtPrice ?? undefined,
    stock: stock!,
    warrantyMonths: warrantyMonths!,
    summary: values.summary,
    description: values.description,
    highlights,
    specs,
    featured: values.featured,
    active: values.active,
  };
  return { ok: true as const, input };
}
