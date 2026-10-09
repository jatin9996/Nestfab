import Link from "next/link";
import { AddToCart } from "@/components/add-to-cart";
import { ProductImage } from "@/components/product-image";
import { Stars } from "@/components/stars";
import { formatInr, savePercent } from "@/lib/format";
import type { ProductCard as ProductCardType } from "@/lib/types";

export function ProductCard({ product }: { product: ProductCardType }) {
  const saving = savePercent(product.pricePaise, product.compareAtPaise);
  return (
    <article className="group flex h-full flex-col">
      <Link href={`/product/${product.slug}`} className="relative block overflow-hidden rounded-[28px] bg-sand">
        <ProductImage src={product.imageUrl} alt={product.imageAlt || product.name} className="aspect-[4/5] w-full transition duration-500 group-hover:scale-[1.03]" />
        {saving ? (
          <span className="absolute left-3 top-3 rounded-full bg-cream/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-copper">
            Save {saving}%
          </span>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col px-1 pt-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/45">{product.category.name}</p>
        <Link href={`/product/${product.slug}`} className="mt-1 font-serif text-2xl leading-tight text-ink">
          {product.name}
        </Link>
        {product.rating ? (
          <p className="mt-2 flex items-center gap-2 text-sm text-ink-soft">
            <Stars rating={product.rating} />
            <span>{product.reviewCount}</span>
          </p>
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <p>
            <span className="text-base font-semibold">{formatInr(product.pricePaise)}</span>
            {product.compareAtPaise ? (
              <span className="ml-2 text-sm text-ink/40 line-through">{formatInr(product.compareAtPaise)}</span>
            ) : null}
          </p>
          <AddToCart product={product} compact />
        </div>
      </div>
    </article>
  );
}
