---
name: seo-hreflang
description: Hreflang and internationalization SEO rules. Use when working with locale routing, language switching, alternate language links, the /{lang}-{country}/ URL pattern, i18n configuration, or middleware locale detection.
paths: "**/i18n*, **/locale*, **/lang*, **/middleware.ts, **/middleware.tsx, **/layout*.tsx, **/layout*.ts, **/next.config.*"
---

# Hreflang & Internationalization SEO Guidelines

Technical rules for implementing locale routing and multi-language hreflang tags in a Next.js e-commerce site. These patterns apply to any multi-locale site — adapt the locale list to match your project's configuration.

For locale configuration patterns, see [locale-matrix.md](locale-matrix.md).

## Hreflang Link Tags

Every indexable page MUST include `<link rel="alternate" hreflang="xx-YY">` tags for ALL locale variants of that page, plus an `x-default` entry.

### Rules

1. **All variants must be listed** — if a page exists in N locales, there must be N+1 link tags (all locales + x-default)
2. **Self-referencing required** — the current page's locale must be included in its own hreflang tags
3. **x-default** — should point to the default/international locale as the fallback for unmatched users
4. **URLs must be absolute** — full URL with protocol, domain, and locale prefix
5. **Bidirectional** — if page A hreflang-links to page B, page B must hreflang-link back to page A
6. **Same content** — hreflang links must connect equivalent pages (same product, same category), not different pages
7. **Hreflang value format** — use lowercase language, uppercase country: `en-GB`, `de-DE`, `fr-FR` (ISO 639-1 + ISO 3166-1 Alpha-2)

### Implementation in Next.js

**App Router**: Use the `alternates.languages` field in `generateMetadata`. **Pages Router**: Render `<link rel="alternate">` tags via `next/head`.

```typescript
// Example imports — use your project's actual config
import { SITE_URL } from '@/config/site';
import { ALL_LOCALES, DEFAULT_LOCALE } from '@/config/locales';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id, slug } = params;
  const path = `/products/${id}/${slug}`; // adapt to your project's URL structure

  // Build hreflang map dynamically from locale config
  const languages: Record<string, string> = {
    'x-default': `${SITE_URL}/${DEFAULT_LOCALE}${path}`,
  };
  for (const loc of ALL_LOCALES) {
    languages[loc] = `${SITE_URL}/${loc}${path}`;
  }

  return {
    alternates: {
      canonical: `${SITE_URL}/${locale}${path}`,
      languages,
    },
  };
}
```

For the root layout (applies to all pages). In Pages Router, place this logic in `_app.tsx` or a shared layout component.

```typescript
// Layout file (e.g. app/[locale]/layout.tsx or a shared layout component)
// Example imports — use your project's actual config
import { SITE_URL } from '@/config/site';
import { ALL_LOCALES, DEFAULT_LOCALE } from '@/config/locales';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const languages: Record<string, string> = {
    'x-default': `${SITE_URL}/${DEFAULT_LOCALE}/`,
  };

  for (const loc of ALL_LOCALES) {
    languages[loc] = `${SITE_URL}/${loc}/`;
  }

  return {
    alternates: {
      languages,
    },
  };
}
```

### Hreflang in Sitemaps (best practice)

In addition to HTML link tags, include hreflang in XML sitemaps using `<xhtml:link>`:

```xml
<url>
  <loc>https://example.com/en-GB/products/123/blue-widget-pro</loc>
  <xhtml:link rel="alternate" hreflang="en-GB" href="https://example.com/en-GB/products/123/blue-widget-pro"/>
  <xhtml:link rel="alternate" hreflang="de-DE" href="https://example.com/de-DE/products/123/blue-widget-pro"/>
  <xhtml:link rel="alternate" hreflang="x-default" href="https://example.com/en-US/products/123/blue-widget-pro"/>
  <!-- ... all locales -->
</url>
```

## HTTP Header Method

For non-HTML resources (PDFs, downloadable files), use HTTP `Link` headers:

```
Link: <https://example.com/en-US/file.pdf>; rel="alternate"; hreflang="en-US",
      <https://example.com/de-DE/file.pdf>; rel="alternate"; hreflang="de-DE",
      <https://example.com/en-US/file.pdf>; rel="alternate"; hreflang="x-default"
```

Google treats all three methods (HTML tags, HTTP headers, sitemaps) as equivalent signals. There is no benefit from combining multiple methods for the same page — pick whichever is most convenient.

## Multi-Language Countries

Several countries have multiple language variants. All variants must cross-reference each other:

| Country | Locales |
|---------|---------|
| Switzerland | `en-CH`, `de-CH`, `fr-CH`, `it-CH` |
| Belgium | `en-BE`, `nl-BE`, `fr-BE`, `de-BE` |
| Canada | `en-CA`, `fr-CA` |
| Netherlands | `en-NL`, `nl-NL` |

**All locale variants must be included in hreflang** — do not only link within the same country. A German-speaking user in Switzerland (`de-CH`) should also see links to `de-DE` and `de-BE`.

## Language Switcher Component

The language/country switcher in the UI must:

1. **Link to the same page** in the target locale — not just the homepage of that locale
2. **Use `<Link>` from next/link** — enables client-side navigation
3. **Preserve URL path** — switching from `/en-GB/products/123/blue-widget-pro` to German should go to `/de-DE/products/123/blue-widget-pro`
4. **Be visible and crawlable** — search engines use the switcher to discover locale variants

## Middleware Locale Detection

```typescript
// middleware.ts
// Example imports — use your project's actual config
import { ALL_LOCALES, DEFAULT_LOCALE } from '@/config/locales';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if pathname already has a locale prefix
  const pathnameHasLocale = ALL_LOCALES.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (!pathnameHasLocale) {
    // Detect preferred locale from Accept-Language header
    const locale = detectLocale(request) || DEFAULT_LOCALE;
    // 302 redirect (temporary) — locale preference may change
    return NextResponse.redirect(new URL(`/${locale}${pathname}`, request.url));
  }
}
```

**Use 302 (temporary) for locale detection redirects** — the user's preferred locale may change, so this should not be a permanent redirect.

## Common Technical Anti-Patterns

1. **Missing self-referencing hreflang** — the page must include itself in the hreflang set
2. **Missing x-default** — always include x-default pointing to the default locale
3. **Language switcher links to locale homepage** — must preserve the current page path
4. **One-directional hreflang** — if en-GB links to de-DE, de-DE must link back to en-GB
5. **Hardcoded locale list** — always derive from a single config source (e.g. a shared locale config array)
6. **301 for locale detection** — use 302 (temporary) for Accept-Language redirects
7. **Missing locales from hreflang** — every locale the page is available in must be listed, or Google may not associate them

**Why it matters**: Incorrect hreflang causes search engines to show the wrong language version to users, or to treat locale variants as duplicate content. For a multi-locale site, this can massively dilute ranking signals.

**Important caveat**: Google treats hreflang as a **hint, not a directive**. Google may still choose a different locale version based on canonical tags, site structure, or content similarity. Correct implementation improves the odds of Google serving the right version, but does not guarantee it.
