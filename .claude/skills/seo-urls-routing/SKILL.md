---
name: seo-urls-routing
description: URL structure and Next.js routing rules for SEO. Use when creating new routes, pages, modifying URL patterns, adding dynamic segments, or working with pagination and query parameters.
paths: "**/page*.tsx, **/page*.ts, **/route*.ts, **/middleware.ts, **/next.config.*"
---

# URL Structure & Routing SEO Guidelines

Technical rules for URL patterns and routing in a Next.js e-commerce site.

## URL Pattern

A common e-commerce URL pattern is `/{lang}-{COUNTRY}/{section}/{id}/{slug}`. Adapt to your project's actual structure:

Example (adapt paths to your project):
- Homepage: `/en-US/`
- Category: `/en-US/categories/electronics`
- Subcategory: `/en-US/categories/electronics/wireless-headphones`
- Product: `/en-US/products/123/blue-widget-pro-3000`
- Static pages: `/en-US/contact-us`

## Locale Prefix Rules

- **Every page MUST have a locale prefix** — never serve content at `/products/123` without a locale
- **Redirect root `/`** to the detected or default locale (see seo-hreflang skill for middleware pattern)
- **Locale format**: lowercase language, uppercase country — `en-GB`, `de-DE`, `fr-CH`
- **Never hardcode a locale** — always derive from route params or config

```typescript
// GOOD — locale from route params
// [locale]/products/[id]/[slug]/page.tsx
export default function ProductPage({ params }: { params: { locale: string; id: string; slug: string } }) {
  // locale is dynamic
}

// BAD — hardcoded locale
const url = '/en-US/products/' + id; // Breaks for other locales
```

## Slug Rules

- **Lowercase only** — `blue-widget-pro-3000`, never `Blue-Widget-Pro-3000`
- **Hyphen-separated** — `wireless-headphones`, not `wireless_headphones` or `wirelessheadphones`
- **No special characters** — no encoded characters, accents, or symbols in slugs
- **Derived from product name/model** — slugs should be human-readable and include the product identifier
- **Stable** — once a slug is published and indexed, do not change it without a 301 redirect from the old URL

## Category URLs

Prefer path-based segments for subcategories:

```
// PREFERRED — path-based
/en-US/categories/electronics/wireless-headphones

// ACCEPTABLE — query-based (common in existing codebases)
/en-US/categories/electronics?type=wireless-headphones
```

Path-based URLs are better for SEO because:
- Search engines weight URL path words more than query params
- Easier to set up breadcrumbs and URL hierarchy
- Cleaner for users to read and share

## Pagination

- Use `?page=N` query parameter for paginated pages
- **Page 1 canonical must NOT include `?page=1`** — the canonical should be the base URL without the page param
- Subsequent pages should have a self-referencing canonical (`?page=2` points to `?page=2`)
- `rel="next"` and `rel="prev"` are **not used by Google** (dropped in 2019). Bing and some other engines still support them. Including them is low-effort and harmless, but don't rely on them for Google — proper canonical URLs and sitemap inclusion are more important for paginated content.

```typescript
import { SITE_URL } from '@/config/site';

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const page = Number(searchParams.page) || 1;
  const basePath = `${SITE_URL}/${params.locale}/categories/${params.slug}`;

  return {
    alternates: {
      canonical: page === 1 ? basePath : `${basePath}?page=${page}`,
    },
    other: {
      ...(page > 1 && { 'prev': page === 2 ? basePath : `${basePath}?page=${page - 1}` }),
      ...(hasNextPage && { 'next': `${basePath}?page=${page + 1}` }),
    },
  };
}
```

## Search URLs

- **Search pages are blocked by robots.txt**: `Disallow: /*/search/`
- Also add `noindex` to search result pages as a fallback — if robots.txt is ever changed or removed, the `noindex` tag ensures these pages stay out of the index. Note: while robots.txt is active, Google cannot see the `noindex` tag (it blocks crawling entirely), so both protections do not work simultaneously.

```typescript
// Search page (any router)
export const metadata: Metadata = {
  robots: { index: false, follow: true }, // noindex, follow
};
```

**Why**: Search results pages create near-infinite URL combinations, which wastes crawl budget and creates thin content.

## Trailing Slashes

- **Be consistent** — pick one convention and enforce it site-wide
- Configure in next.config.js to enforce consistency:

```javascript
// next.config.js
module.exports = {
  trailingSlash: false, // or true — pick one and stick with it
};
```

- If you change the trailing slash setting, set up redirects from old URLs to new ones

## Dynamic Routes & Static Generation

- Use `[id]` and `[slug]` segments for dynamic content
- Use `generateStaticParams` to pre-render known pages at build time:

```typescript
export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map(product => ({
    locale: product.locale,
    id: product.id,
    slug: product.slug,
  }));
}
```

- Use ISR (`revalidate`) for pages that update frequently (prices, stock):

```typescript
export const revalidate = 300; // Regenerate every 5 minutes
```

## Query Parameters & Filters

- **Granular filter combinations should not be indexed** — pages like `?color=red&size=large&weight=5kg` should:
  - Have their canonical set to the base category URL (without filter params), AND/OR
  - Use `noindex, follow` to prevent indexing while allowing link discovery
- **Useful single-filter pages can remain indexable** — if the filter represents a real search intent (e.g. `?type=wireless`), keep it indexed
- **Sort parameters** (`?sort=price-asc`) — the canonical should always point to the base URL
- **UTM parameters** — should be ignored by canonical (canonical never includes UTM params)

## Common Technical Anti-Patterns

1. **Missing locale prefix** — every URL must start with `/{lang}-{COUNTRY}/`
2. **Hardcoded locale strings** — use route params, never hardcode `en-US`
3. **Page 1 with `?page=1`** — the canonical for page 1 is the clean URL without pagination
4. **Changing slugs without redirects** — if a product slug changes, 301 redirect the old URL
5. **Uppercase in slugs** — always lowercase
6. **Indexable search pages** — search results must be noindex
7. **UTM params in canonicals** — canonical URLs must never include tracking parameters
