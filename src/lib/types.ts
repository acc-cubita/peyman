export type CategoryGroup = "digital" | "components";

export type IconKey =
  | "smartphone"
  | "laptop"
  | "headphones"
  | "watch"
  | "battery"
  | "board"
  | "sensor"
  | "component"
  | "tool";

export type Category = {
  slug: string;
  name: string;
  group: CategoryGroup;
  icon: IconKey;
  /** One line shown on category tiles. */
  tagline: string;
  /** Intro paragraph shown above the product grid. */
  intro: string;
};

export type Spec = readonly [label: string, value: string];

export type Product = {
  slug: string;
  name: string;
  /** Latin model name, rendered left-to-right. */
  nameEn: string;
  brand: string;
  category: string;
  /** Internal stock-keeping code, e.g. PE-2104. */
  sku: string;
  /** Price in Toman. */
  price: number;
  /** Previous price in Toman, when discounted. */
  compareAtPrice?: number;
  stock: number;
  rating: number;
  reviewCount: number;
  summary: string;
  description: string;
  highlights: readonly string[];
  specs: readonly Spec[];
  featured?: boolean;
  updatedAt: string;
};

export type SortKey = "featured" | "price-asc" | "price-desc" | "rating";

/** The slice of a product the browser-side cart and checkout need. */
export type CartCatalogItem = {
  slug: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  icon: IconKey;
  onBoard: boolean;
};

export type CartCatalog = Record<string, CartCatalogItem>;
