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
    "پیمان الکترونیک، تولیدکننده محافظ برق و تجهیزات اعلام حریق با پنج سال گارانتی؛ همراه با برد آردوینو، سنسور، قطعات و ابزار الکترونیک.",
  phone: "021-00000000",
  /** Warranty advertised for the store's own products. Each product's actual warranty is set in admin. */
  warrantyYears: 5,
  city: "تهران",
  /** Orders at or above this amount (Toman) ship free. */
  freeShippingFrom: 5_000_000,
  /** Flat shipping fee in Toman for smaller orders. */
  shippingFee: 120_000,
} as const;

export const groups: Record<CategoryGroup, { name: string; blurb: string }> = {
  manufactured: {
    name: "محصولات پیمان",
    blurb: "محافظ برق و اعلام حریق با ۵ سال گارانتی",
  },
  components: {
    name: "قطعات و ابزار",
    blurb: "برد توسعه، سنسور، قطعات پسیو و ابزار",
  },
};
