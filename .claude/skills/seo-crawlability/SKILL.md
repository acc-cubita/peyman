---
name: seo-crawlability
description: Crawlability, indexing, robots directives, and sitemap rules. Use when working with robots.txt, XML sitemaps, noindex/nofollow directives, pagination crawling, or server-side rendering for SEO.
paths: "**/robots.ts, **/robots.txt, **/sitemap*.ts, **/sitemap*.xml, **/middleware*, **/page*.tsx"
---

# Crawlability & Indexing SEO Guidelines

Follow these rules to ensure search engines can discover, crawl, and index all important pages on the site.

For current robots.txt and sitemap structure details, see [reference.md](reference.md).

## robots.txt

Example e-commerce robots.txt (adapt paths to your project):
```
User-agent: *
Disallow: /*/search/
Disallow: /*/search

Sitemap: ${SITE_URL}/sitemap.xml
```

### robots.txt vs noindex

- **robots.txt blocks crawling**, not indexing — Google may still index a blocked URL (with no snippet) if external sites link to it
- **Use robots.txt only for pages that generate massive URL combinations** — search results are the primary example, as they create near-infinite crawlable URLs that waste crawl budget
- **Use `noindex` for finite pages that shouldn't be indexed** — cart, checkout, account, wishlist, login, register. These have minimal crawl budget impact, and `noindex` properly prevents indexing

### Rules for Modifying robots.txt

- **Always reference the sitemap** — `Sitemap:` directive pointing to your sitemap URL
- **Keep robots.txt minimal** — only block pages that genuinely waste crawl budget (e.g. search results with infinite URL combinations)
- **Prefer `noindex` over robots.txt** for pages you want to prevent from appearing in search results — `noindex` is the correct tool for preventing indexing
- **Never block CSS/JS files** — search engines need these to render pages
- **Never block product or category pages** — these are the pages you want ranked
- **Test changes** — use Google Search Console's robots.txt tester before deploying

In Next.js, you can generate robots.txt dynamically (App Router example; for Pages Router, use `public/robots.txt` or an API route):

```typescript
// robots.ts (App Router) — for Pages Router, use public/robots.txt or an API route
import { MetadataRoute } from 'next';
// Example import — use your project's actual config
import { siteConfig } from '@/config/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      disallow: ['/*/search/', '/*/search'],
    },
    sitemap: `${siteConfig.url}/sitemap_index.xml`,
  };
}
```

## Noindex Directives

Use `noindex` on pages that should be crawlable but NOT appear in search results:

| Page Type | Directive | Reason |
|-----------|-----------|--------|
| Search results | `noindex, follow` | Infinite URL combinations, thin content |
| Granular filter combinations | `noindex, follow` | Thin/duplicate content — but keep useful single-filter pages (e.g. `?type=wireless`) indexable if they match real search intent |
| User account pages | `noindex, nofollow` | Private, no SEO value |
| Cart / Checkout | `noindex, nofollow` | Private, no SEO value |
| Thank you / confirmation | `noindex, nofollow` | No SEO value |
| Internal error pages | `noindex, nofollow` | No SEO value |
| Login / Register | `noindex, follow` | No SEO value, but follow links |
| Print views | `noindex, nofollow` | Duplicate of main page |

Implementation:

```typescript
// In page metadata
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true, // or false depending on page type
  },
};

// In generateMetadata for dynamic pages
export async function generateMetadata(): Promise<Metadata> {
  return {
    robots: { index: false, follow: true },
  };
}
```

**Important**: Use `noindex` in the metadata, not in robots.txt. robots.txt blocks crawling entirely (search engines can't even see the noindex tag), while `noindex` allows crawling but prevents indexing.

## XML Sitemaps

### Sitemap Rules

- **Only include canonical, indexable URLs** — no noindex pages, no non-canonical URLs, no paginated URLs (except if self-canonical)
- **Include all locale variants** — every page in every locale it's available in
- **Use `lastmod`** — accurate last modified date helps search engines prioritize crawling
- **Include hreflang in sitemaps** — use `<xhtml:link rel="alternate">` (see seo-hreflang skill)
- **Max 50,000 URLs per sitemap** — split into sub-sitemaps if needed
- **Max 50MB per sitemap file** — monitor file sizes
- **Keep sitemaps fresh** — regenerate on content changes, not just at build time

Next.js sitemap generation (App Router example; for Pages Router, use an API route or build-time generation):

```typescript
// sitemap.ts (App Router) — for Pages Router, generate via API route or at build time
import { MetadataRoute } from 'next';
// Example imports — use your project's actual config
import { siteConfig, ALL_LOCALES } from '@/config/site';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getAllProducts();

  return products.flatMap(product =>
    ALL_LOCALES.map(locale => ({
      url: `${siteConfig.url}/${locale}/products/${product.id}/${product.slug}`,
      lastModified: product.updatedAt,
      alternates: {
        languages: Object.fromEntries(
          ALL_LOCALES.map(loc => [loc, `${siteConfig.url}/${loc}/products/${product.id}/${product.slug}`])
        ),
      },
    }))
  );
}
```

**Note**: Google ignores `changeFrequency` and `priority` fields in sitemaps — omit them. The `lastmod` field is the only optional field Google uses, and only when it's consistently accurate and reflects significant content changes.

## Server-Side Rendering for SEO

- **Critical content must be server-rendered** — product names, descriptions, prices, specs
- Google can render JavaScript, but it introduces a delay (typically hours to days for initial indexing)
- Server-rendered content (Server Components in App Router, or `getServerSideProps`/`getStaticProps` in Pages Router) appears in the initial HTML — use this to your advantage
- **Never hide critical content behind client-side fetch** — if a product name only appears after a `useEffect` fetch, it may not be indexed promptly

```typescript
// GOOD — content is in the initial HTML
export default async function ProductPage({ params }: Props) {
  const product = await getProduct(params.id); // Server-side
  return <h1>{product.name}</h1>; // In initial HTML
}

// BAD — content requires client-side JS to appear
"use client";
export default function ProductPage({ params }: Props) {
  const [product, setProduct] = useState(null);
  useEffect(() => { fetchProduct(params.id).then(setProduct); }, []);
  return <h1>{product?.name}</h1>; // Not in initial HTML!
}
```

## Orphan Pages

Every indexable page must be:
1. **Reachable from internal links** — at least one link from another page on the site
2. **In the sitemap** — listed in one of the XML sitemaps
3. **Not blocked by robots.txt** — must be crawlable

If you create a new page, verify it has at least one internal link pointing to it (from navigation, category listing, related products, or footer).

## Crawl Budget

For a large multi-locale site (many locales x many products), crawl budget matters:

- **Don't waste it on non-valuable pages** — noindex search, granular filter combos, account pages
- **Use hreflang correctly** — helps Google crawl locale variants efficiently
- **Fresh sitemaps** — helps Google prioritize changed pages
- **Fast server response** — slow responses waste crawl budget (aim for <500ms TTFB)

## Common Mistakes to Avoid

1. **Using robots.txt to "hide" pages** — use `noindex` instead; robots.txt prevents crawling, so Google can't see the noindex
2. **Sitemap with non-canonical URLs** — only canonical URLs belong in sitemaps
3. **Missing sitemap reference in robots.txt** — always include `Sitemap:` directive
4. **Client-side rendered critical content** — search engines may miss content that requires JS execution
5. **Orphan product pages** — new products must be linked from category pages
6. **Stale sitemaps** — regenerate when content changes, not just at deploy time
