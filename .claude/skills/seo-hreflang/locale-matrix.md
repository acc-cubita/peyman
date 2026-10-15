# Locale Matrix Template

This is a configuration pattern for multi-locale e-commerce sites. Adapt the locale list, currencies, and default locale to match your project.

## Example Locale Configuration

| Locale Code | Language | Country | Currency | URL Prefix |
|-------------|----------|---------|----------|------------|
| `en-US` | English | United States | USD | `/en-US/` |
| `en-GB` | English | United Kingdom | GBP | `/en-GB/` |
| `de-DE` | German | Germany | EUR | `/de-DE/` |
| `fr-FR` | French | France | EUR | `/fr-FR/` |
| `es-ES` | Spanish | Spain | EUR | `/es-ES/` |
| `it-IT` | Italian | Italy | EUR | `/it-IT/` |
| `nl-NL` | Dutch | Netherlands | EUR | `/nl-NL/` |
| `sv-SE` | Swedish | Sweden | SEK | `/sv-SE/` |
| `pl-PL` | Polish | Poland | PLN | `/pl-PL/` |
| `cs-CZ` | Czech | Czech Republic | CZK | `/cs-CZ/` |

Add additional locales following the same pattern: `{lang}-{COUNTRY}`.

## Multi-Language Countries Pattern

Countries with more than one language variant — all must cross-reference in hreflang:

- **Switzerland** (4): en-CH, de-CH, fr-CH, it-CH — Currency: CHF
- **Belgium** (4): en-BE, nl-BE, fr-BE, de-BE — Currency: EUR
- **Canada** (2): en-CA, fr-CA — Currency: CAD
- **Netherlands** (2): en-NL, nl-NL — Currency: EUR

## Currency Mapping Pattern

Use this pattern to map locale to currency for Product schema `offers.priceCurrency`:

```typescript
// config/locales.ts

export const DEFAULT_LOCALE = 'en-US';

export const ALL_LOCALES = [
  'en-US', 'en-GB', 'de-DE', 'fr-FR', 'es-ES',
  'it-IT', 'nl-NL', 'sv-SE', 'pl-PL', 'cs-CZ',
  // Add your project's locales here
] as const;

const LOCALE_CURRENCY_MAP: Record<string, string> = {
  'en-GB': 'GBP',
  'en-US': 'USD',
  'sv-SE': 'SEK',
  'cs-CZ': 'CZK',
  'pl-PL': 'PLN',
  // Multi-language countries share one currency
  'en-CH': 'CHF', 'de-CH': 'CHF', 'fr-CH': 'CHF', 'it-CH': 'CHF',
  // Default for unlisted locales
};

export function getCurrencyForLocale(locale: string): string {
  return LOCALE_CURRENCY_MAP[locale] ?? 'EUR';
}
```

## x-default

The `x-default` hreflang value should point to your default locale (e.g. `en-US`). This is the fallback for users whose locale doesn't match any available variant.
