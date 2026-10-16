/** Products the store makes itself, and third-party parts and tools it resells. */
export type CategoryGroup = "manufactured" | "components";

export type IconKey =
  | "fridge"
  | "strip"
  | "house"
  | "panel"
  | "smoke"
  | "board"
  | "sensor"
  | "component"
  | "tool";

export type Category = {
  slug: string;
  name: string;
  /** Label for the header menu, short enough for every category to fit on one line. */
  shortName: string;
  group: CategoryGroup;
  icon: IconKey;
  /** One line shown on category tiles. */
  tagline: string;
  /** Intro paragraph shown above the product grid. */
  intro: string;
  /** Categories whose products are suggested next, before the rest of the group. */
  related?: readonly string[];
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
  /** Warranty length in months; 0 when none is offered. */
  warrantyMonths: number;
  summary: string;
  description: string;
  highlights: readonly string[];
  specs: readonly Spec[];
  featured?: boolean;
  /** Hidden products stay in the database but not in the store. */
  active: boolean;
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

/** One row of the live search dropdown. */
export type SearchSuggestion = {
  slug: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  icon: IconKey;
  onBoard: boolean;
};
