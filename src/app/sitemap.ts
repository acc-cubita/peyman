import type { MetadataRoute } from "next";
import { getCategories, getProducts } from "@/lib/catalog";
import { site } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);
  const lastCatalogUpdate = products.reduce((latest, p) => (p.updatedAt > latest ? p.updatedAt : latest), "");

  return [
    { url: site.url, lastModified: lastCatalogUpdate },
    ...categories.map((category) => ({
      url: `${site.url}/category/${category.slug}`,
      lastModified: lastCatalogUpdate,
    })),
    ...products.map((product) => ({
      url: `${site.url}/product/${product.slug}`,
      lastModified: product.updatedAt,
    })),
  ];
}
