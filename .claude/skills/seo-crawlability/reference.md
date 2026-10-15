# Crawlability Reference: E-Commerce Site

## Recommended robots.txt for E-Commerce (adapt paths to your project)

```
User-agent: *
Disallow: /*/search/
Disallow: /*/search

Sitemap: ${SITE_URL}/sitemap_index.xml
```

**Why only search?** robots.txt blocks crawling, not indexing. Pages like cart, checkout, and account are finite URLs with minimal crawl budget impact — use `noindex` meta tags on those instead (see noindex table below). Search results are blocked because they generate near-infinite URL combinations that waste crawl budget.

## Sitemap Structure

Use a sitemap index referencing sub-sitemaps, split by content type or volume. Example file names (adapt to your project):

- `${SITE_URL}/sitemap_index.xml` — index file
- `${SITE_URL}/sitemap/products.xml` — all product pages
- `${SITE_URL}/sitemap/categories.xml` — all category pages
- `${SITE_URL}/sitemap/pages.xml` — static pages (FAQ, contact, legal, etc.)

Sitemaps should include `<xhtml:link rel="alternate" hreflang="...">` tags connecting locale variants.

Split further if any single sitemap exceeds 50,000 URLs or 50MB.

## Pages That Should Be Blocked/Noindexed

### Block in robots.txt (prevent crawling — saves crawl budget):
- `/*/search/` — search results (near-infinite URL combinations)
- `/*/search` — search results (no trailing slash variant)

### Should be noindexed (crawlable but not indexed):

Example paths -- adapt to your project's actual routes:

| Path Pattern | Page Type | Directive |
|-------------|-----------|-----------|
| `/*/cart` | Shopping cart | `noindex, nofollow` |
| `/*/checkout/*` | Checkout flow | `noindex, nofollow` |
| `/*/account/*` | User account pages | `noindex, nofollow` |
| `/*/wishlist` | Wishlist | `noindex, nofollow` |
| `/*/login` | Login page | `noindex, follow` |
| `/*/register` | Registration page | `noindex, follow` |
| `/*/order-confirmation/*` | Thank you pages | `noindex, nofollow` |
| Category + multiple filter params | Granular filter combinations | `noindex, follow` (but keep useful single-filter pages indexable) |

### Must remain indexable:
- Homepage (all locales)
- Product pages
- Category pages (base, without filters)
- Contact / support pages
- FAQ pages
- Legal / privacy pages
- Service / information pages
