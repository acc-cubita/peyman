---
name: seo-performance
description: Core Web Vitals and performance SEO rules for Next.js. Use when optimizing page load speed, addressing LCP/CLS/INP issues, working with third-party scripts like Google Tag Manager, fonts, or bundle size.
paths: "**/layout*.tsx, **/layout*.ts, **/page*.tsx, **/page*.ts, **/next.config.*, **/script*.tsx, **/loading*.tsx"
---

# Performance & Core Web Vitals SEO Guidelines

Core Web Vitals are a Google ranking factor. Follow these rules to maintain good performance on a Next.js e-commerce site.

## Targets

| Metric | Target | What it measures |
|--------|--------|-----------------|
| **LCP** (Largest Contentful Paint) | < 2.5s | How fast the main content loads |
| **CLS** (Cumulative Layout Shift) | < 0.1 | How much the page layout shifts during load |
| **INP** (Interaction to Next Paint) | < 200ms | How fast the page responds to user interaction |

## Server-Side Rendering by Default

- **Render critical content on the server** — product data, pricing, descriptions, specs, breadcrumbs
- **App Router**: Default to Server Components — only add `"use client"` when the component truly needs interactivity (click handlers, state, effects)
- **Pages Router**: Use `getServerSideProps` or `getStaticProps` to fetch data server-side
- Server-rendered content arrives as HTML — faster LCP, no JavaScript bundle cost for display-only content
- Client components are needed for: add-to-cart buttons, quantity selectors, language switcher, search input, filters

```typescript
// GOOD — Server-rendered (no "use client" in App Router; use getServerSideProps in Pages Router)
export default async function ProductPage({ params }: Props) {
  const product = await getProduct(params.id); // Server-side fetch
  return <ProductDetails product={product} />;
}

// GOOD — Only the interactive part is a client component
// components/AddToCartButton.tsx
"use client";
export function AddToCartButton({ productId }: Props) {
  const [quantity, setQuantity] = useState(1);
  // ...
}
```

**Why it matters**: Client-side rendering adds to the JavaScript bundle. On category pages with 50+ products, making each product card a client component can add hundreds of KB of JS, destroying LCP.

## LCP Optimization

The LCP element on product pages is typically the main product image. On category pages, it's the first visible product image or the hero banner.

1. **Preload the LCP image** — use `priority` prop on the `<Image>` component
2. **Avoid client-side data fetching for above-fold content** — fetch product data server-side
3. **Don't lazy-load the LCP image** — `priority` disables lazy loading automatically
4. **Minimize server response time** — use ISR (Incremental Static Regeneration) for product pages

```typescript
// next.config.js — ISR for product pages
// In page.tsx:
export const revalidate = 300; // 5 minutes — fresh enough for buyers
```

## CLS Prevention

1. **Always size images** — use `width`/`height` or `fill` with a sized container (see seo-images skill)
2. **Reserve space for dynamic content** — prices, stock badges, add-to-cart buttons
3. **Font loading** — use `next/font` with `display: swap` and `size-adjust` to prevent layout shift
4. **Avoid injecting content above existing content** — banners, promo bars, cookie consents should not push content down

```typescript
// GOOD — font with swap and size-adjust
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'], display: 'swap' });

// BAD — loading fonts via <link> causes FOUT and CLS
<link href="https://fonts.googleapis.com/css2?family=Inter" rel="stylesheet" />
```

## INP Optimization

1. **Minimize client-side JavaScript** — less JS = faster interactions
2. **Use `useTransition`** for non-urgent UI updates (filter changes, sort changes on category pages)
3. **Avoid blocking the main thread** — don't run expensive computations in event handlers
4. **Debounce search input** — don't fire a request on every keystroke

```typescript
"use client";
import { useTransition } from 'react';

function CategoryFilters({ onFilterChange }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleFilterChange(filter: string) {
    startTransition(() => {
      onFilterChange(filter); // Non-urgent, won't block interaction
    });
  }
}
```

## Google Tag Manager (GTM)

GTM is a significant performance cost if loaded incorrectly.

```typescript
// GOOD — load GTM after page is interactive
import Script from 'next/script';

<Script
  id="gtm"
  strategy="afterInteractive"
  dangerouslySetInnerHTML={{
    __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer', process.env.NEXT_PUBLIC_GTM_ID);`,
  }}
/>

// BAD — blocks page rendering
<Script strategy="beforeInteractive" src={`https://www.googletagmanager.com/gtm.js?id=${process.env.NEXT_PUBLIC_GTM_ID}`} />
```

**Rules**:
- Always use `strategy="afterInteractive"` for GTM
- Never use `beforeInteractive` for analytics/tracking scripts
- Store the GTM container ID in an environment variable (`NEXT_PUBLIC_GTM_ID`), never hardcode it
- Consider using `strategy="lazyOnload"` for non-critical third-party scripts (chat widgets, surveys)

## Font Loading

- **Always use `next/font`** — it self-hosts fonts, eliminating external requests
- **Set `display: 'swap'`** — shows fallback text immediately, swaps to custom font when loaded
- **Limit font weights** — only load weights you actually use (e.g. 400 and 700, not all 9 weights)

```typescript
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin', 'latin-ext'], // Include latin-ext for European languages
  display: 'swap',
  weight: ['400', '500', '700'], // Only weights actually used
});
```

## Bundle Size

1. **Dynamic imports for below-fold components** — product image gallery, reviews section, related products
2. **Avoid importing entire libraries** — `import { format } from 'date-fns'` not `import dayjs from 'dayjs'` if only formatting
3. **Analyze bundle** — use `@next/bundle-analyzer` to find oversized dependencies

```typescript
// GOOD — dynamic import for below-fold content
import dynamic from 'next/dynamic';

const ProductReviews = dynamic(() => import('./ProductReviews'), {
  loading: () => <ReviewsSkeleton />,
});

const RelatedProducts = dynamic(() => import('./RelatedProducts'));
```

## Streaming & Suspense

Use React Suspense to stream content progressively — the page shell renders immediately while slower data loads:

```typescript
import { Suspense } from 'react';

export default function ProductPage({ params }: Props) {
  return (
    <>
      <ProductHeader id={params.id} />  {/* Renders immediately */}
      <Suspense fallback={<PriceSkeleton />}>
        <ProductPrice id={params.id} />  {/* Streams when ready */}
      </Suspense>
      <Suspense fallback={<ReviewsSkeleton />}>
        <ProductReviews id={params.id} />  {/* Streams when ready */}
      </Suspense>
    </>
  );
}
```

## Common Technical Anti-Patterns

1. **"use client" on data-display components** — product cards, breadcrumbs, specs tables don't need client-side JS
2. **GTM with beforeInteractive** — blocks rendering, destroys LCP
3. **Loading fonts via `<link>`** — use next/font instead
4. **Loading all font weights** — only load what you use
5. **Synchronous data fetching in client components** — fetch on the server, pass data as props
6. **Not using Suspense** — causes the entire page to wait for the slowest data source
7. **Large dependencies for simple tasks** — don't import moment.js for a date format
8. **Hardcoded GTM container IDs** — use environment variables
