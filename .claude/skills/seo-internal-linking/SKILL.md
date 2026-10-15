---
name: seo-internal-linking
description: Internal linking strategy and rules for SEO. Use when adding navigation, breadcrumbs, footer links, related products, cross-links, or language switcher components.
paths: "**/nav*, **/breadcrumb*, **/footer*, **/sidebar*, **/related*, **/header*"
---

# Internal Linking SEO Guidelines

Follow these rules when building navigation, breadcrumbs, and cross-linking features.

## Why Internal Linking Matters

Internal links distribute PageRank (ranking power) across your site and help search engines discover pages. A product page with 50 internal links pointing to it will outrank an identical page with only 1 internal link.

## Use next/link for All Internal Links

- **Always use `<Link>` from `next/link`** for internal navigation — never raw `<a>` tags
- next/link enables client-side navigation (faster) and prefetching (even faster)
- Raw `<a>` tags trigger full page reloads

```typescript
// GOOD
import Link from 'next/link';
<Link href={`/${locale}/products/${product.id}/${product.slug}`}>
  {product.name}
</Link>

// BAD
<a href={`/${locale}/products/${product.id}/${product.slug}`}>
  {product.name}
</a>
```

## Breadcrumbs

Every page except the homepage should have visible breadcrumbs AND matching BreadcrumbList schema. Note: as of January 2025, Google no longer displays breadcrumbs in mobile search results (they still appear on desktop). Breadcrumbs remain valuable for desktop SERP display, site hierarchy understanding, and user navigation.

### Implementation Rules

1. **Mirror the URL/site hierarchy** — Home > Category > Subcategory > Product
2. **Every level is a clickable link** except the current page
3. **Current page is plain text** (not a link)
4. **Consistent across locales** — same hierarchy, translated labels
5. **Visible in the page** — not hidden, not only in schema
6. **Minimum 2 breadcrumb items required** for Google to recognize the trail
7. **Represent the user's navigation path**, not necessarily the URL hierarchy

```typescript
// Example breadcrumbs component — adapt to your project
import Link from 'next/link';
import { JsonLd } from './JsonLd';
// Example import — use your project's actual config
import { siteConfig } from '@/config/site';

interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items, locale }: { items: Crumb[]; locale: string }) {
  const schema = {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: `${siteConfig.url}${item.href}` } : {}),
    })),
  };

  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", ...schema }} />
      <nav aria-label="Breadcrumb">
        <ol>
          {items.map((item, index) => (
            <li key={index}>
              {item.href ? (
                <Link href={item.href}>{item.label}</Link>
              ) : (
                <span aria-current="page">{item.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

// Usage on a product page:
<Breadcrumbs
  locale="en-GB"
  items={[
    { label: 'Home', href: `/${locale}/` },
    { label: 'Electronics', href: `/${locale}/categories/electronics` },
    { label: 'Wireless Headphones', href: `/${locale}/categories/electronics/wireless-headphones` },
    { label: 'Widget Pro 500W' }, // Current page — no href
  ]}
/>
```

## Anchor Text

Anchor text (the clickable text of a link) tells search engines what the target page is about.

### Rules

- **Use descriptive text** — the product name, category name, or action
- **Never use "click here"** or "read more" or "learn more" as the sole anchor text
- **Include keywords naturally** — "View our industrial widgets" not "click here for products"
- **Vary anchor text** — don't use the exact same text for every link to the same page
- **Don't over-optimize** — natural language, not keyword-stuffed

```typescript
// GOOD
<Link href={`/${locale}/categories/electronics/wireless-headphones`}>
  Wireless Headphones
</Link>

<Link href={`/${locale}/products/${id}/${slug}`}>
  {product.name} — {product.shortSpec}
</Link>

// BAD
<Link href={url}>Click here</Link>
<Link href={url}>Read more</Link>
<Link href={url}>Link</Link>
```

## Related Products / Cross-Linking

Product pages should link to related products:

1. **Same category** — other products in a similar range
2. **Compatible accessories** — add-ons, parts, maintenance kits for this product
3. **Upgrade/downgrade** — next model up/down in the range
4. **Bundles** — if this product is part of a bundle, link to the bundle

```typescript
// components/RelatedProducts.tsx
export function RelatedProducts({ products, locale }: Props) {
  return (
    <section>
      <h2>Related Products</h2>
      <ul>
        {products.map(product => (
          <li key={product.id}>
            <Link href={`/${locale}/products/${product.id}/${product.slug}`}>
              <Image src={product.image} alt={`${product.name} - ${product.shortSpec}`} width={200} height={150} />
              <span>{product.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

## Navigation (Header/Footer)

### Header Navigation
- Include links to top-level categories
- Include subcategory links in dropdown menus
- Links should use the current locale prefix
- Include the language/country switcher

### Footer Navigation
- Include links to: all top-level categories, FAQ, contact, legal, services
- **Consistent across all pages and locales** — same structure, translated labels
- Footer links help search engines discover important pages from every page on the site

### Language Switcher

The language/country switcher MUST:

1. **Link to the same page** in the target locale — not the homepage
2. **Preserve the full URL path** — switching from `/en-GB/products/123/widget-pro` to French → `/fr-FR/products/123/widget-pro`
3. **Be a visible, crawlable link** — not hidden behind JavaScript-only interaction
4. **Use `<Link>` from next/link**

```typescript
// components/LanguageSwitcher.tsx
export function LanguageSwitcher({ currentLocale, currentPath }: Props) {
  return (
    <nav aria-label="Language">
      {ALL_LOCALES.map(locale => (
        <Link
          key={locale}
          href={`/${locale}${currentPath}`}
          hrefLang={locale}
          aria-current={locale === currentLocale ? 'true' : undefined}
        >
          {getLocaleName(locale)}
        </Link>
      ))}
    </nav>
  );
}
```

**Why the switcher matters for SEO**: Search engine crawlers use the language switcher to discover locale variants of pages. If the switcher only links to homepages, crawlers won't efficiently find all localized versions.

## Nofollow Usage

Use `rel="nofollow"` sparingly and only where appropriate:

| Link Type | nofollow? | Reason |
|-----------|-----------|--------|
| Internal navigation | No | You want PageRank to flow |
| Internal product links | No | You want PageRank to flow |
| External affiliate links | Yes | Paid/sponsored links |
| User-generated content | Yes | Untrusted content |
| Login/register links | Optional | Low SEO value |
| Social media links | No | But they're external, so limited value |

**Default rule**: Do NOT add nofollow to internal links. Only add it to external untrusted or paid links.

```typescript
// External affiliate link — use nofollow
<a href="https://partner-site.com" rel="nofollow noopener" target="_blank">
  Partner Name
</a>

// Internal link — NEVER nofollow
<Link href={`/${locale}/products/${id}/${slug}`}>
  {productName}
</Link>
```

## Common Mistakes to Avoid

1. **Raw `<a>` for internal links** — always use next/link
2. **"Click here" anchor text** — use descriptive text
3. **Language switcher linking to homepage** — must preserve current page path
4. **Missing breadcrumbs** — required on every page except homepage
5. **Breadcrumb schema without visible breadcrumbs** — both must exist and match
6. **nofollow on internal links** — never nofollow your own pages
7. **Orphan product pages** — every product must be linked from at least one category page
