const integer = new Intl.NumberFormat("fa-IR");
const decimal = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 1 });

export const faNumber = (value: number) => integer.format(value);

export const faDecimal = (value: number) => decimal.format(value);

export const formatToman = (value: number) => `${integer.format(value)} تومان`;

/** 60 → «۵ سال گارانتی», 18 → «۱۸ ماه گارانتی». */
export function warrantyLabel(months: number) {
  return months % 12 === 0 ? `${integer.format(months / 12)} سال گارانتی` : `${integer.format(months)} ماه گارانتی`;
}

export function discountPercent(price: number, compareAtPrice?: number) {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

const persianDigits = /[۰-۹]/g;
const arabicDigits = /[٠-٩]/g;

/** Converts Persian and Arabic-Indic digits to ASCII, e.g. for phone numbers. */
export function toLatinDigits(value: string) {
  return value
    .replace(persianDigits, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(arabicDigits, (d) => String(d.charCodeAt(0) - 0x0660));
}

const dateTime = new Intl.DateTimeFormat("fa-IR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Tehran",
});

/** Solar Hijri date and Tehran time, e.g. «۲۳ مهر ۱۴۰۵، ۱۴:۰۵». */
export const formatDateTime = (iso: string) => dateTime.format(new Date(iso));

const time = new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tehran" });
const dayMonth = new Intl.DateTimeFormat("fa-IR", { day: "numeric", month: "long", timeZone: "Asia/Tehran" });
const dayKey = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Tehran" });

/** Tehran clock time, e.g. «۱۴:۰۵». */
export const formatTime = (iso: string) => time.format(new Date(iso));

/** Solar Hijri day and month, e.g. «۲۴ مهر». */
export const formatDayMonth = (date: string | Date) => dayMonth.format(new Date(date));

/** The Tehran calendar day of a moment, as "2026-10-15", for grouping by day. */
export const tehranDay = (date: string | Date) => dayKey.format(new Date(date));

/** Time for today's messages, day and month for older ones. */
export const formatWhen = (iso: string, now = new Date()) =>
  tehranDay(iso) === tehranDay(now) ? formatTime(iso) : formatDayMonth(iso);

/** Folds Arabic letter variants and Eastern digits so searches match. */
export function normalizeText(value: string) {
  return toLatinDigits(value)
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/‌/g, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
