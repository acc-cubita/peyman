---
name: seo-images
description: Image SEO and optimization rules for Next.js. Use when adding images, product photos, icons, banners, or working with the next/image component. Covers alt text, sizing, formats, lazy loading, and LCP optimization.
paths: "**/*.tsx, **/*.jsx"
---

# Image SEO & Optimization Guidelines

Technical rules for image implementation in a Next.js e-commerce site.

## Always Use next/image

- **Never use raw `<img>` tags** — always use `<Image>` from `next/image`
- next/image provides automatic: WebP/AVIF conversion, lazy loading, responsive sizing, blur placeholders
- Missing these optimizations directly hurts Core Web Vitals (LCP and CLS), which are ranking factors

```typescript
// GOOD
import Image from 'next/image';
<Image src={product.imageUrl} alt="Blue Widget Pro 3000 - front view" width={800} height={600} />

// BAD - never do this
<img src={product.imageUrl} alt="product image" />
```

## Alt Text Technical Requirements

The `alt` prop is required on every `<Image>` component. Search engines use alt text for image indexing and accessibility tools depend on it.

### Rules

- **`alt` prop must always be present** — never omit it
- **Must not be empty on meaningful images** — product photos, category heroes, and informational images must have descriptive alt text
- **Only use `alt=""`** on purely decorative images (background patterns, visual separators)
- **Pass alt text from data** — pull from CMS/PIM `altText` field when available, fall back to product name + context

### Examples by Image Type

| Image Type | Alt Pattern | Example |
|-----------|------------|---------|
| Product main | `{Name} - {Key Spec or View}` | "Blue Widget Pro 3000 - front view" |
| Product gallery | `{Name} - {Angle/Detail}` | "Blue Widget Pro 3000 - control panel detail" |
| Category hero | `{Description of content}` | "Range of wireless headphones from 20Hz to 40kHz" |
| Icon/decorative | `""` (empty) | `alt=""` |
| Logo | `{Company} logo` | "Acme Corp logo" |

```typescript
// GOOD — descriptive, from data
alt={`${product.name} - ${image.viewLabel}`}

// BAD
alt="product image"
alt="image_0"
alt=""  // on a meaningful product image
alt={product.sku}  // Not human-readable
```

## Sizing & Layout Stability

- **Always specify `width` and `height`** — or use `fill` with a sized container
- Missing dimensions cause CLS (Cumulative Layout Shift) — content jumps around as images load
- Use the image's intrinsic dimensions, not display dimensions

```typescript
// GOOD - explicit dimensions
<Image src={url} alt={alt} width={800} height={600} />

// GOOD - fill mode with container
<div className="relative aspect-[4/3] w-full">
  <Image src={url} alt={alt} fill className="object-cover" />
</div>

// BAD - no dimensions, causes CLS
<Image src={url} alt={alt} />
```

## Priority & LCP Optimization

- **Use `priority` on the LCP image** — the largest above-the-fold image (usually the hero product photo)
- Only 1-2 images per page should have `priority` — it disables lazy loading and triggers preload
- On product pages, the main product image is almost always the LCP element

```typescript
// Product page hero image — this is the LCP element
<Image src={product.mainImage} alt={alt} width={800} height={600} priority />

// Gallery thumbnails — NOT priority, they're below fold or secondary
<Image src={product.thumbnail} alt={thumbAlt} width={200} height={150} />
```

## Image Formats

Configure next.config.js for optimal format delivery:

```javascript
// next.config.js
module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'],
    // If using an external image CDN:
    remotePatterns: [
      { protocol: 'https', hostname: '*.your-cdn.com' },
    ],
  },
};
```

- AVIF can be up to ~50% smaller than JPEG, WebP typically ~30% smaller (varies by image content and quality settings)
- next/image automatically serves the best format the browser supports
- If the image source is external, add the domain to `remotePatterns`

## Lazy Loading

- **Default behavior is lazy loading** — do not add `loading="lazy"` manually (it's redundant)
- Only override with `priority` for above-the-fold images
- Lazy loading prevents offscreen images from blocking initial page load

## Blur Placeholder

Use blur placeholders for product images to reduce perceived loading time and CLS:

```typescript
<Image
  src={product.imageUrl}
  alt={`${product.name} - ${image.viewLabel}`}
  width={800}
  height={600}
  placeholder="blur"
  blurDataURL={product.blurDataUrl} // Base64 tiny image
/>
```

Generate `blurDataURL` at build time or from the CMS/PIM system.

## Common Technical Anti-Patterns

1. **Raw `<img>` tags** — always use next/image
2. **Missing `alt` prop** — every `<Image>` must have `alt`; use empty string only for decorative images
3. **Empty alt on product images** — only use `alt=""` for purely decorative images
4. **Missing dimensions** — causes CLS, hurts Core Web Vitals
5. **Priority on every image** — only the LCP image (1-2 per page) should have priority
6. **Enormous source images** — if displaying at 800px wide, don't serve a 4000px source; use `sizes` prop
7. **Missing remote patterns** — external images fail silently without `remotePatterns` config
