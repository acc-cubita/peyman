---
name: seo-metadata
description: SEO metadata rules for Next.js pages. Use when creating or modifying page metadata, title tags, meta descriptions, Open Graph tags, canonical URLs, or Twitter cards. Covers Next.js Metadata API (generateMetadata, metadata exports) and head elements.
paths: "**/page*.tsx, **/page*.ts, **/layout*.tsx, **/layout*.ts, **/metadata*.ts, **/head*.tsx"
---

# SEO Metadata Guidelines

Technical rules for implementing page metadata in a Next.js e-commerce site.

## Technical Requirements: Title Tags

- **Always use the Next.js Metadata API (`generateMetadata` or `metadata` export)** — never hardcode titles in JSX `<head>`
- **Format**: `{Page-Specific Content} | {BRAND_NAME}` — brand suffix comes from a shared config constant
  - Product pages: `{Product Name} {Model} | {BRAND_NAME}`
  - Category pages: `{Category Name} - Buy Online | {BRAND_NAME}`
  - Service pages: `{Service Name} | {BRAND_NAME}`
- **Keep titles concise** — Google truncates them to fit device width (typically ~50-60 visible characters on desktop). There is no official character limit, but shorter titles display fully in more contexts.
- **Must be unique** per page — duplicate titles across pages confuse search engines about which page to rank
- **Locale-aware** — title content must use translated strings from i18n; brand name stays untranslated
- **Include model/SKU identifiers** on product pages — B2B buyers often search by model number

## Technical Requirements: Meta Description

- **Must be present** on every indexable page — `generateMetadata` must return a `description` field
- **Keep concise** — Google may truncate long snippets. There is no official character limit, but focus on making descriptions unique and relevant.
- **Must be unique** per page — never reuse the same description across multiple pages
- **Locale-aware** — pull translated descriptions from CMS/i18n, never hardcode English

## Canonical URLs

- **Every page MUST have a canonical URL** — no exceptions
- **Must be absolute** — include the full URL with protocol and domain: `${SITE_URL}/${locale}/products/${id}/${slug}`
- **Must include locale prefix** — e.g. `/en-GB/`, never just `/products/123`
- **Self-referencing** — a page's canonical should point to itself (its own URL)
- **Pagination**: page 1 canonical must NOT include `?page=1`; subsequent pages should self-reference (the canonical for `?page=2` points to `?page=2`)
- **Never point a canonical across locales** — `/en-GB/product/123` must NOT have its canonical set to `/de-DE/product/123`
- **Filters and sorting**: category pages with filter/sort query params should have their canonical set to the base category URL (without filters)

**Why it matters**: Canonical URLs tell search engines which version of a page is the "master" copy. Without them, search engines may split ranking signals across duplicate URLs.

## Open Graph Tags

Required OG tags for every page — `generateMetadata` must return these in the `openGraph` field:

| Tag | Rule |
|-----|------|
| `og:title` | Same as title tag (or slightly adapted for social) |
| `og:description` | Same as meta description |
| `og:url` | Must match the canonical URL exactly |
| `og:type` | `product` for product pages, `website` for all others |
| `og:image` | Product image (min 1200x630px) or site default |
| `og:site_name` | Value from `BRAND_NAME` config |
| `og:locale` | BCP 47 format matching the page locale: `en_GB`, `de_DE`, etc. |
| `og:locale:alternate` | Array of all other available locales for this page |

## Twitter Card Tags

| Tag | Rule |
|-----|------|
| `twitter:card` | `summary_large_image` for product/category pages, `summary` for others |
| `twitter:title` | Same as og:title |
| `twitter:description` | Same as og:description |
| `twitter:image` | Same as og:image works fine; X/Twitter's optimal is 1200x675 (2:1 ratio) vs OG's 1200x630 (1.91:1), but both are accepted |

## Next.js Implementation

Code examples use App Router conventions. For Pages Router, use `<Head>` from `next/head` with `getStaticProps`/`getServerSideProps`.

### Using Metadata API

Use `generateMetadata` for dynamic pages:

```typescript
// app/[locale]/products/[id]/[slug]/page.tsx
// Example imports — use your project's actual config
import { SITE_URL, BRAND_NAME } from '@/config/site';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct(params.id);
  const locale = params.locale; // e.g. "en-GB"

  return {
    title: `${product.name} ${product.model} | ${BRAND_NAME}`,
    description: product.metaDescription,
    alternates: {
      canonical: `${SITE_URL}/${locale}/products/${product.id}/${product.slug}`,
      languages: buildHreflangMap(product.id, product.slug), // all locale variants
    },
    openGraph: {
      title: `${product.name} ${product.model} | ${BRAND_NAME}`,
      description: product.metaDescription,
      url: `${SITE_URL}/${locale}/products/${product.id}/${product.slug}`,
      type: 'product' as any, // Next.js doesn't type 'product' but it's valid OG
      images: [{ url: product.imageUrl, width: 1200, height: 630, alt: `${product.name} ${product.model}` }],
      siteName: BRAND_NAME,
      locale: locale.replace('-', '_'), // en-GB -> en_GB
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} ${product.model} | ${BRAND_NAME}`,
      description: product.metaDescription,
      images: [product.imageUrl],
    },
  };
}
```

Use static `metadata` export for static pages:

```typescript
// app/[locale]/contact-us/page.tsx
import { BRAND_NAME } from '@/config/site';

export const metadata: Metadata = {
  title: `Contact Us | ${BRAND_NAME}`,
  description: 'Get in touch for product information, service, and support.',
};
```

### Rules

- **Never hardcode metadata in JSX** — always use `generateMetadata` or `metadata` export
- **Prefer the Next.js Metadata API over manual `<head>`** — it handles deduplication and ordering (App Router). In Pages Router, use `next/head` consistently.
- **Layout metadata cascades** — define base metadata (site_name, default OG image) in root layout, override specific fields in nested layouts and pages
- **Dynamic pages must use `generateMetadata`** — static `metadata` export cannot access route params
- **Use config constants** — site URL and brand name should come from a shared config (however your project manages configuration), never hardcoded inline

## Common Technical Anti-Patterns

1. **Hardcoded metadata in JSX `<head>`** — always use the Metadata API; Next.js handles deduplication and ordering
2. **Missing `generateMetadata` on dynamic routes** — static `metadata` export cannot access `params`
3. **Relative canonical URLs** — canonical must be absolute with protocol and domain
4. **Canonical pointing to wrong locale** — use the `locale` param, never hardcode a locale string
5. **Missing OG image** — `openGraph.images` must always be populated (use a site default fallback)
6. **Same title on all locale variants** — titles must use translated strings, not repeat the English version
7. **Hardcoded `SITE_URL` strings** — use the config constant so the value is consistent and changeable
