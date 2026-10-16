import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { warrantyLabel } from "@/lib/format";
import type { Product } from "@/lib/types";
import { PriceTag } from "./price-tag";
import { ProductArt } from "./product-art";
import { ProductName } from "./product-name";
import { Rating } from "./rating";

export function ProductCard({ product }: { product: Product }) {
  const soldOut = product.stock === 0;

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex w-full flex-col rounded-2xl bg-surface p-3 ring-1 ring-line transition-shadow hover:shadow-[0_6px_24px_-12px_rgb(15_77_58/0.45)] hover:ring-board/30"
    >
      <div className="relative">
        <ProductArt product={product} className={soldOut ? "opacity-60" : undefined} />
        {soldOut && (
          <span className="absolute top-3 right-3 rounded-full bg-ink px-2.5 py-0.5 text-xs text-silk">
            ناموجود
          </span>
        )}
      </div>
      <div className="mt-3 flex flex-1 flex-col gap-1 px-1">
        <p dir="ltr" className="text-end font-mono text-[11px] uppercase tracking-wider text-muted">
          {product.brand}
        </p>
        <h3 className="line-clamp-2 text-sm leading-7 font-medium text-ink group-hover:text-board">
          <ProductName name={product.name} />
        </h3>
        <Rating value={product.rating} count={product.reviewCount} />
        {product.warrantyMonths > 0 && (
          <p className="flex items-center gap-1.5 text-xs text-board">
            <ShieldCheck aria-hidden className="size-3.5 shrink-0" />
            {warrantyLabel(product.warrantyMonths)}
          </p>
        )}
        <div className="mt-auto pt-3">
          {soldOut ? (
            <p className="text-end text-sm text-muted">فعلاً موجود نیست</p>
          ) : (
            <PriceTag price={product.price} compareAtPrice={product.compareAtPrice} />
          )}
        </div>
      </div>
    </Link>
  );
}

export function ProductGrid({ products }: { products: readonly Product[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <li key={product.slug} className="flex">
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}
