# E-Commerce SEO Reference

## URL Patterns (Example — Adapt to Your Project)

| Page Type | Example Pattern | Example URL |
|-----------|----------------|-------------|
| Category | `/{locale}/categories/{slug}` | `/en-US/categories/electronics` |
| Subcategory | `/{locale}/categories/{slug}/{sub-slug}` | `/en-US/categories/electronics/headphones` |
| Product | `/{locale}/products/{id}/{slug}` | `/en-US/products/123/widget-pro-500w` |
| Bundle | `/{locale}/products/{id}/{slug}` | `/en-US/products/456/starter-bundle` |

## SEO Priority by Page Type

| Page Type | SEO Priority | Key Technical Actions |
|-----------|-------------|----------------------|
| Product pages | Highest | Product schema with price + availability, unique `generateMetadata`, breadcrumbs |
| Category pages | High | ItemList schema, introductory content block, proper canonical on filtered views |
| Bundle pages | High | Product schema listing included items, cross-links to individual products |
| FAQ | Medium | FAQPage schema (only with visible Q&A), target common questions |
| Contact | Medium | Organization schema, LocalBusiness if applicable |
| Service pages | Medium | Unique content, relevant internal links |
| Legal/Privacy | Low | Needed for trust, low SEO impact |

## Rich Result Eligibility

| Rich Result | Schema Required | Implementation Notes |
|------------|----------------|----------------------|
| Product (price, availability) | Product + Offer with `price`, `priceCurrency`, `availability` | Most impactful for e-commerce — implement first |
| Breadcrumbs | BreadcrumbList | Required on all non-homepage pages |
| FAQ | FAQPage | Google restricts to government/health sites only — **skip for e-commerce**, essentially zero value |
| Site Search Box | WebSite + SearchAction | Add `potentialAction` with search URL template |
| Organization | Organization | Set in root layout, enhance with logo + social links |

## Currency by Locale Pattern

Map locales to currencies in site config. Common patterns:

| Currency | Example Locales |
|----------|----------------|
| GBP | en-GB |
| USD | en-US |
| EUR | de-DE, fr-FR, it-IT, es-ES, nl-NL, nl-BE, fr-BE |
| SEK | sv-SE |
| CHF | de-CH, fr-CH, it-CH |

Use a lookup function — never hardcode currency per page:

```typescript
// config/currency.ts
const LOCALE_CURRENCY_MAP: Record<string, string> = {
  'en-GB': 'GBP',
  'en-US': 'USD',
  'de-DE': 'EUR',
  // ... all locales
};

export function getCurrencyForLocale(locale: string): string {
  return LOCALE_CURRENCY_MAP[locale] ?? 'EUR';
}
```
