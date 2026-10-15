const integer = new Intl.NumberFormat("fa-IR");
const decimal = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 1 });

export const faNumber = (value: number) => integer.format(value);

export const faDecimal = (value: number) => decimal.format(value);

export const formatToman = (value: number) => `${integer.format(value)} تومان`;

export function discountPercent(price: number, compareAtPrice?: number) {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

const persianDigits = /[۰-۹]/g;
const arabicDigits = /[٠-٩]/g;

/** Folds Arabic letter variants and Eastern digits so searches match. */
export function normalizeText(value: string) {
  return value
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(persianDigits, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(arabicDigits, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/‌/g, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
