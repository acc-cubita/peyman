---
name: seo-structured-data
description: Schema.org structured data rules for JSON-LD markup. Use when adding or modifying structured data, product schemas, breadcrumbs, organization info, or FAQ markup on an e-commerce site.
paths: "**/schema*.ts, **/structured*.ts, **/jsonld*.tsx, **/page*.tsx, **/layout*.tsx"
---

# Structured Data (JSON-LD) Guidelines

Technical rules for implementing schema.org structured data in a Next.js e-commerce site.

## General Rules

- **Always use JSON-LD** format — never use Microdata or RDFa (JSON-LD is Google's preferred format)
- **Render server-side** — place JSON-LD in Server Components so crawlers see it immediately
- **Validate** — test with Google Rich Results Test before deploying
- **Prefer one `<script>` tag per page** — use `@graph` array to combine multiple schemas. Multiple tags are valid but harder to maintain.
- **Keep data accurate** — structured data must match visible page content (Google penalizes mismatches)

## Implementation Pattern

```typescript
// Example JSON-LD component — name and location may vary in your project
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// Usage in a page:
<JsonLd data={{
  "@context": "https://schema.org",
  "@graph": [productSchema, breadcrumbSchema]
}} />
```

## Schema Types

### Product Schema (product pages)

**Required on every product page.** Without `offers.price` and `offers.availability`, Google cannot generate rich results (price badges, stock status in search). These fields are technically required for rich result eligibility.

For complete template, see [schemas/product.json](schemas/product.json).

Required fields (for rich result eligibility per Google):

| Field | Rule |
|-------|------|
| `@type` | `Product` |
| `name` | Full product name — e.g. "Blue Widget Pro 3000" |
| `image` | **Array** of image URLs (not just one) — include multiple angles. Minimum 50K pixels total (e.g. 250x200) |
| `offers.@type` | `Offer` |
| `offers.price` | Numeric value — no currency symbols, no commas (both `39.99` and `"39.99"` are valid). Must be greater than 0 for merchant listing eligibility |
| `offers.priceCurrency` | ISO 4217 — locale-dependent: `GBP`, `EUR`, `USD`, `SEK`, `CZK`, `TRY`, `PLN`, `CHF` |
| `offers.availability` | schema.org enum: `https://schema.org/InStock`, `https://schema.org/OutOfStock`, `https://schema.org/PreOrder` |

Recommended fields (strongly encouraged):

| Field | Rule |
|-------|------|
| `description` | Product description (match visible content) |
| `sku` | Internal SKU |
| `mpn` | Manufacturer part number — recommended when `gtin` is unavailable |
| `brand.name` | Value from `BRAND_NAME` config — strongly recommended for product identification |
| `gtin` / `gtin13` / `gtin14` | Global Trade Item Number (barcode). Strongly recommended for product identification. Provide `gtin` if available; if not, provide `brand` + `mpn` |
| `url` | Canonical URL of the product page |
| `offers.seller.name` | Value from `BRAND_NAME` config |
| `offers.url` | Same as product `url` |
| `aggregateRating` | If reviews exist — `ratingValue`, `reviewCount` |
| `review` | Individual review objects with `author`, `reviewRating`, `reviewBody` |
| `additionalProperty` | Technical specs as `PropertyValue` objects |
| `isVariantOf` | Link to parent product group (for product variants) |
| `weight` | Product weight with `unitCode` |
| `shippingDetails` | `OfferShippingDetails` object. Recommended for merchant listing eligibility |
| `hasMerchantReturnPolicy` | `MerchantReturnPolicy` object. Recommended for merchant listing eligibility |
| `itemCondition` | `NewCondition`, `UsedCondition`, `RefurbishedCondition` |

```typescript
// Example imports — use your project's actual config
import { SITE_URL, BRAND_NAME } from '@/config/site';

const productSchema = {
  "@type": "Product",
  name: product.name,
  description: product.description,
  sku: product.sku,
  mpn: product.mpn,
  brand: { "@type": "Brand", name: BRAND_NAME },
  image: product.images.map(img => img.url),
  url: `${SITE_URL}/${locale}/products/${product.id}/${product.slug}`,
  offers: {
    "@type": "Offer",
    price: product.price,
    priceCurrency: getCurrencyForLocale(locale), // GBP for en-GB, EUR for de-DE, etc.
    availability: product.inStock
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock",
    seller: { "@type": "Organization", name: BRAND_NAME },
    url: `${SITE_URL}/${locale}/products/${product.id}/${product.slug}`,
  },
};
```

**Note**: Use `Offer` type (not `AggregateOffer`) — `AggregateOffer` is only eligible for product snippets, not merchant listings.

**B2B pricing note**: If prices are hidden behind login, omit the `price` field entirely rather than showing 0. You can still include `availability`. Consider adding `eligibleCustomerType: "Business"`.

### BreadcrumbList Schema

**Recommended on every page except the homepage.** Note: as of January 2025, Google no longer displays breadcrumbs in mobile search results (they still appear on desktop). BreadcrumbList schema remains useful for desktop SERP display and for helping Google understand site hierarchy.

Must mirror visible breadcrumb navigation exactly. For template, see [schemas/breadcrumb.json](schemas/breadcrumb.json).

```typescript
const breadcrumbSchema = {
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/${locale}/` },
    { "@type": "ListItem", position: 2, name: category.name, item: `${SITE_URL}/${locale}/categories/${category.slug}` },
    { "@type": "ListItem", position: 3, name: subcategory.name, item: `${SITE_URL}/${locale}/categories/${category.slug}/${subcategory.slug}` },
    { "@type": "ListItem", position: 4, name: product.name }, // Last item: no 'item' URL
  ],
};
```

Rules:
- Every `ListItem` except the last must have an `item` (URL)
- The last item represents the current page — only `name`, no `item`
- `position` starts at 1, increments by 1
- URLs must be absolute and include locale prefix
- Must match visible breadcrumbs exactly
- Minimum 2 `ListItem` entries required — Google ignores single-item breadcrumbs
- Breadcrumbs should represent a typical user navigation path to the page, not necessarily mirror the URL structure
- Including 'Home' as the first item is common but not required by Google

### Organization Schema

**On the homepage or about/contact page only — not on every page.**

For template, see [schemas/organization.json](schemas/organization.json).

```typescript
// Example imports — use your project's actual config
import { SITE_URL, BRAND_NAME } from '@/config/site';

const organizationSchema = {
  "@type": "Organization",
  name: BRAND_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/assets/logo.svg`,
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    availableLanguage: availableLanguages, // from locale config
  },
};
```

### WebSite Schema (with SearchAction)

**On the homepage layout only.**

```typescript
const websiteSchema = {
  "@type": "WebSite",
  name: BRAND_NAME,
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/${locale}/search?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};
```

### FAQ Schema

**Note**: Since August 2023, Google has progressively restricted FAQ rich results to a small number of well-known, authoritative government and health websites. For e-commerce sites, FAQ schema provides essentially **zero value from Google** — no rich results will appear regardless of implementation quality. Other search engines (Bing) may still use it, but the ROI is minimal. **Skip FAQ schema on e-commerce sites** unless you have a specific non-Google reason.

If you still choose to implement it: only on pages with visible FAQ content. Do not add FAQ schema to pages without visible Q&A.

For template, see [schemas/faq.json](schemas/faq.json).

```typescript
const faqSchema = {
  "@type": "FAQPage",
  mainEntity: faqs.map(faq => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};
```

Rules:
- Minimum 2 questions
- Question text must match visible question exactly
- Answer text must match visible answer (can be slightly shortened)

## Combining Multiple Schemas

When a page has multiple schema types (e.g. Product + BreadcrumbList), use `@graph`:

```typescript
<JsonLd data={{
  "@context": "https://schema.org",
  "@graph": [productSchema, breadcrumbSchema]
}} />
```

**Prefer** a single `<script>` tag with `@graph` to combine schemas — this keeps structured data organized and easier to maintain. Multiple separate `<script>` tags are also valid and will be processed by Google, but can become harder to manage at scale.

## Common Technical Anti-Patterns

1. **Missing price/availability on Product schema** — without these fields, Google cannot generate rich results
2. **Wrong currency for locale** — en-GB must use GBP, de-DE must use EUR; use a locale-to-currency mapping function
3. **Breadcrumbs don't match visible navigation** — schema and UI must be identical
4. **FAQ schema on pages without visible FAQ** — Google considers this spam
5. **Hardcoded URLs without locale prefix** — all URLs in structured data must include `/{lang}-{COUNTRY}/`
6. **Price with currency symbol** — `offers.price` must be a plain numeric value (e.g. `39.99` or `"39.99"`), never `"$299.00"` or `"1,299.00"`
7. **Client-side rendering of JSON-LD** — always render in Server Components so crawlers see it on first load
