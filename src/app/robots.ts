import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // Search results are near-infinite URL combinations; cart, checkout and
    // order pages carry `noindex` in their own metadata instead.
    rules: { userAgent: "*", disallow: ["/search", "/admin", "/account", "/api/"] },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
