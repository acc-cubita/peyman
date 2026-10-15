---
name: seo-ecommerce
description: E-commerce specific SEO rules for product pages, category pages, pricing, availability, faceted navigation, and B2B considerations. Use when building or modifying product listings, category pages, shopping cart, or checkout.
paths: "**/product*, **/category*, **/cart*, **/checkout*, **/catalog*"
---

# E-Commerce SEO Guidelines

Follow these rules when working on product pages, category pages, and shopping features.

For detailed e-commerce SEO patterns, see [reference.md](reference.md).

## Product Pages

Every product page should have:

### 1. Unique, Descriptive Title
```
{Model} {Product Name} | {Brand}
```
Include model number — B2B buyers search by model.

### 2. Complete Product Schema (JSON-LD)
A common gap in e-commerce sites is missing `price` and `availability` in Product schema, which prevents rich results (price, stock status, ratings) from appearing in Google.

Required for rich results (per Google): `name`, `image[]`, `offers.price`, `offers.priceCurrency`, `offers.availability`. Strongly recommended: `sku`, `brand`, `description`. Provide `gtin` if available; if not, provide `brand` + `mpn` for product identification. Also consider `shippingDetails` and `hasMerchantReturnPolicy` for merchant listing eligibility. See the seo-structured-data skill for full details.

### 3. Technical Specifications
Display specs prominently and include them in structured data via `additionalProperty`. Example spec fields:
- Power / wattage
- Capacity / volume
- Dimensions
- Weight
- Key performance metrics relevant to the product category

### 4. Breadcrumb Navigation
Visible breadcrumb trail reflecting the site hierarchy (e.g. Home > Category > Subcategory > Product Name) with matching BreadcrumbList schema (see seo-structured-data skill).

### 5. Unique Description
- **Never duplicate descriptions** across products — even similar models need unique text
- Min 150 words for product descriptions
- Include model number, product category, and brand name naturally

## Category Pages

### Category Page SEO Checklist

- **Unique title** per category: `{Category Name} - Buy Online | {Brand}`
- **Unique description** — don't use the same description for all categories
- **H1 heading** matching the category name
- **CollectionPage or ItemList schema** — list the products on the page

```typescript
const categorySchema = {
  "@type": "CollectionPage",
  name: category.name,
  description: category.description,
  url: `${siteConfig.url}/${locale}/categories/${category.slug}`, // adapt path to your project
  mainEntity: {
    "@type": "ItemList",
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${siteConfig.url}/${locale}/products/${product.id}/${product.slug}`,
      name: product.name,
    })),
  },
};
```

### Category Page Content
- **Introductory text** above the product grid — 100-300 words explaining the category
- **Don't rely on product cards alone** — pages with only product cards and no unique text are "thin content"
- **Internal links** to related categories and subcategories

## Faceted Navigation (Filters)

Faceted navigation (filters by price, specs, features) can create duplicate or thin content if not handled correctly. Google's guidance is **selective, not blanket** — useful filter combinations that match real search intent should remain indexable.

### Rules

1. **Keep useful filter pages indexable** — if a filter combination represents a genuine product category that users search for (e.g. `/categories/headphones?type=wireless`), let it be indexed. These pages have unique value.

2. **Noindex granular multi-filter combinations** — `?power=500w&color=red&weight=5kg` creates thousands of thin pages with little search value. Use `noindex, follow` so crawlers can still discover products through these pages.

3. **Set the canonical to the base category for granular filters** — all low-value filter combinations should have their canonical pointing to the base:
   ```
   /en-GB/categories/widgets?power=500w&color=red&weight=5kg
   → canonical: /en-GB/categories/widgets
   ```

4. **Use `noindex, follow`** (not `noindex, nofollow`) on filtered pages — allows crawlers to discover products through filtered pages without indexing the filter combination itself

```typescript
// App Router example — in Pages Router, set robots via next/head
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  // Determine if this is a useful, searchable filter (e.g. single broad category)
  // vs a granular multi-filter combo with little search value
  const filterKeys = Object.keys(searchParams).filter(k => k !== 'sort');
  const isGranularFilter = filterKeys.length > 1;

  return {
    robots: isGranularFilter
      ? { index: false, follow: true }  // noindex granular filter combos
      : { index: true, follow: true },  // index useful single-filter views
  };
}
```

## B2B Pricing Considerations

For B2B e-commerce sites, pricing requires special handling:

1. **If prices are visible**: Always include `offers.price` and `offers.priceCurrency` in Product schema
2. **If prices require login**: Omit `price` entirely from schema rather than showing 0 or a placeholder. Still include `availability`.
3. **If showing "Request a Quote"**: Use `offers.priceSpecification` with no price, or omit offers block
4. **Business customer type**: Consider adding `offers.eligibleCustomerType: "https://schema.org/Business"`

```typescript
const offers = product.priceVisible
  ? {
      "@type": "Offer",
      price: product.price,
      priceCurrency: getCurrencyForLocale(locale),
      availability: `https://schema.org/${product.inStock ? 'InStock' : 'OutOfStock'}`,
      seller: { "@type": "Organization", name: siteConfig.brandName },
    }
  : {
      "@type": "Offer",
      availability: `https://schema.org/${product.inStock ? 'InStock' : 'OutOfStock'}`,
      seller: { "@type": "Organization", name: siteConfig.brandName },
      eligibleCustomerType: "https://schema.org/Business",
    };
```

## Product Variants

For products with variants (same product line in different sizes, power ratings, colors):

- Each variant should have its **own URL and page** if it has a unique SKU
- Use `isVariantOf` to link variants to a parent product group
- Use `isSimilarTo` for related products in the same category

```typescript
const variantSchema = {
  "@type": "Product",
  name: "Widget Pro 500W",
  isVariantOf: {
    "@type": "ProductGroup",
    name: "Widget Pro Series",
    url: `${siteConfig.url}/${locale}/categories/widgets`,
  },
};
```

## Product Bundles

If the site offers product bundles, these need special SEO treatment:

- **Own product page** with unique title and description
- **Product schema with all included items** listed
- **Highlight savings** in meta description
- **Cross-link** between individual products and the bundle page

## Common Mistakes to Avoid

1. **Missing price in Product schema** — the #1 gap preventing rich results
2. **Same description across similar products** — every product needs unique text
3. **No introductory content on category pages** — thin content signal
4. **Indexable filter combinations** — creates thousands of duplicate pages
5. **Price as 0 when login-required** — omit price rather than fake it
6. **Missing breadcrumbs on product pages** — hurts both UX and SEO
7. **Product images without descriptive alt text** — see seo-images skill
