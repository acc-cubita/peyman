---
name: seo-redirects
description: Redirect rules and patterns for SEO. Use when implementing redirects, handling URL changes, managing 404 pages, or configuring middleware redirects in Next.js.
paths: "**/next.config.*, **/middleware.ts, **/middleware.tsx, **/redirect*, **/not-found*, **/*404*"
---

# Redirect & 404 Handling SEO Guidelines

Follow these rules when implementing redirects or handling missing pages.

## Redirect Types

| Code | Name | When to use |
|------|------|------------|
| **301** | Permanent | URL has permanently changed — product renamed, section restructured |
| **308** | Permanent (preserves method) | Same as 301 but preserves POST/PUT — use for API redirects |
| **302** | Temporary (default in Next.js) | Temporary redirect — locale detection, A/B tests, maintenance |
| **307** | Temporary (preserves method) | Same as 302 but preserves POST/PUT |

**Default rule**: Use **301** for permanent URL changes (most common SEO case). Use **302** for locale detection redirects. Never use 302 when you mean 301 — it delays canonicalization and signals the wrong intent to search engines.

## Next.js Redirects in next.config.js

For simple, static redirect patterns:

```javascript
// next.config.js
module.exports = {
  async redirects() {
    return [
      // Old product URL pattern to new
      {
        source: '/:locale/old-products/:id',
        destination: '/:locale/products/:id',
        permanent: true, // 301
      },
      // Removed page to replacement
      {
        source: '/:locale/about-us',
        destination: '/:locale/contact-us',
        permanent: true,
      },
      // Regex pattern for old category structure
      {
        source: '/:locale/shop/:category',
        destination: '/:locale/categories/:category',
        permanent: true,
      },
    ];
  },
};
```

**Use next.config.js redirects when**: The pattern is simple, applies to all requests, and doesn't need request-time logic.

## Middleware Redirects

For complex, dynamic redirect logic:

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Locale detection — TEMPORARY redirect (302)
  if (pathname === '/') {
    const locale = detectLocale(request) || DEFAULT_LOCALE;
    return NextResponse.redirect(new URL(`/${locale}/`, request.url), 302);
  }

  // Old product URL migration — PERMANENT redirect (301)
  const oldProductMatch = pathname.match(/^\/(\w{2}-\w{2})\/old-products\/(\d+)/);
  if (oldProductMatch) {
    const [, locale, id] = oldProductMatch;
    return NextResponse.redirect(
      new URL(`/${locale}/products/${id}`, request.url),
      301
    );
  }
}
```

**Use middleware redirects when**: You need request-time logic (headers, cookies, geo-detection) or complex matching.

## Redirect Chains

**Never create redirect chains** — where URL A redirects to B, which redirects to C.

```
BAD:  /old-page → /moved-page → /final-page  (chain)
GOOD: /old-page → /final-page  (direct)
      /moved-page → /final-page  (direct)
```

Redirect chains:
- Slow down page load (each redirect adds a network round trip)
- Waste crawl budget — Googlebot may stop following after several hops
- Confuse search engine crawlers and delay canonicalization

When migrating URLs, always redirect to the **final destination**, even if there were intermediate moves.

## Canonical vs Redirect

| Scenario | Solution |
|----------|----------|
| Two URLs serve the same content, both should remain accessible | Use canonical on both pointing to the preferred URL |
| An old URL should no longer be used | 301 redirect to the new URL |
| Trailing slash vs non-trailing slash | Pick one, redirect the other |
| HTTP to HTTPS | 301 redirect HTTP to HTTPS |
| www to non-www (or vice versa) | 301 redirect to the canonical domain |
| Filter params creating duplicate content | Set canonical to the base category URL |

## 404 Handling

- **Custom 404 page** with useful navigation — help users find what they were looking for
- **Never redirect 404s to the homepage** — it sends a false "200 OK" signal and confuses search engines
- **Return actual 404 status code** — Google needs to see 404 to remove old URLs from the index
- **Include in the 404 page**: search box, top categories, popular products, contact link

```typescript
// Not found page (app/[locale]/not-found.tsx or pages/404.tsx)
export default function NotFound() {
  return (
    <div>
      <h1>Page Not Found</h1>
      <p>The page you're looking for doesn't exist or has been moved.</p>
      <nav>
        <h2>Popular Categories</h2>
        <ul>
          <li><Link href="./categories/electronics">Electronics</Link></li>
          <li><Link href="./categories/accessories">Accessories</Link></li>
          <li><Link href="./contact-us">Contact Us</Link></li>
        </ul>
      </nav>
    </div>
  );
}
```

## Locale Redirects

- **Root `/` → detected locale** — use 302 (temporary), not 301
- **Locale mismatch** — if a user manually navigates to a wrong locale, do NOT auto-redirect; let them stay (they may be comparing prices or using a different language on purpose)
- **Non-existent locale** — `/xx-YY/products/123` should 404, not redirect to a default locale

```typescript
// middleware.ts — locale redirect rules
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Only redirect the bare root
  if (pathname === '/') {
    const locale = detectLocaleFromHeaders(request) || DEFAULT_LOCALE;
    return NextResponse.redirect(new URL(`/${locale}/`, request.url), 302);
  }

  // Validate locale prefix
  const localeMatch = pathname.match(/^\/([a-z]{2}-[A-Z]{2})\//);
  if (localeMatch && !ALL_LOCALES.includes(localeMatch[1])) {
    // Invalid locale — return 404, don't redirect
    return NextResponse.rewrite(new URL('/not-found', request.url));
  }
}
```

## HTTPS and Domain Redirects

- All HTTP requests must 301 redirect to HTTPS (typically handled at CDN/infrastructure level)
- Ensure consistent domain — no duplicate content between `www` and non-`www` variants

## Common Mistakes to Avoid

1. **302 for permanent moves** — always use 301 for permanent URL changes
2. **Redirect chains** — always redirect directly to the final URL
3. **Redirecting 404s to homepage** — return proper 404 status with helpful content
4. **301 for locale detection** — use 302 (user preference may change)
5. **Missing redirects after URL change** — if you rename a slug or move a section, add redirects for old URLs
6. **Redirect loops** — page A redirects to B, B redirects to A (crashes the browser)
7. **Redirecting with query params** — don't strip important query params during redirects without intent
