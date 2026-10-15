import type { CategoryGroup } from "./types";

/**
 * Store-wide settings. Contact details and shipping rules below are
 * placeholders — replace them with the store's real values before launch.
 */
export const site = {
  name: "پیمان الکترونیک",
  nameEn: "Peyman Elec",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://peyman-elec.ir",
  description:
    "فروشگاه آنلاین پیمان الکترونیک؛ گوشی، لپ‌تاپ و لوازم جانبی در کنار برد آردوینو، سنسور، قطعات و ابزار الکترونیک با ضمانت اصالت کالا.",
  phone: "021-00000000",
  city: "تهران",
  /** Orders at or above this amount (Toman) ship free. */
  freeShippingFrom: 5_000_000,
  /** Flat shipping fee in Toman for smaller orders. */
  shippingFee: 120_000,
} as const;

export const groups: Record<CategoryGroup, { name: string; blurb: string }> = {
  digital: {
    name: "کالای دیجیتال",
    blurb: "موبایل، لپ‌تاپ، صوتی و پوشیدنی",
  },
  components: {
    name: "قطعات و ابزار",
    blurb: "برد توسعه، سنسور، قطعات پسیو و ابزار",
  },
};
