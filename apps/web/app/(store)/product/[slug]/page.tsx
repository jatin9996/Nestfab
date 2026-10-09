import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/product-gallery";
import { ProductPurchase } from "@/components/product-purchase";
import { ReviewForm } from "@/components/review-form";
import { Stars } from "@/components/stars";
import { ApiError, api } from "@/lib/api";
import { formatDate, formatInr, savePercent } from "@/lib/format";
import type { ProductDetailResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getProduct(slug: string) {
  try {
    const data = await api<{ product: ProductDetailResponse }>(`/api/products/${slug}`);
    return data.product;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug).catch(() => null);
  if (!product) return { title: "Product" };
  return { title: product.name, description: product.description.slice(0, 155) };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  const saving = savePercent(product.pricePaise, product.compareAtPaise);
  const media = product.images.length > 0 ? product.images : [{ url: product.imageUrl, alt: product.name, kind: "IMAGE" as const }];

  return (
    <div className="container-page py-12">
      <p className="text-sm text-ink-soft">
        <Link href="/shop" className="link-underline">
          Shop
        </Link>
        <span className="px-2">/</span>
        <Link href={`/shop?category=${product.category.slug}`} className="link-underline">
          {product.category.name}
        </Link>
      </p>
      <div className="mt-6 grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <ProductGallery name={product.name} media={media} />
        </div>
        <div className="lg:col-span-5 lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow">{product.category.name}</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">{product.name}</h1>
          {product.rating ? (
            <p className="mt-3 flex items-center gap-2 text-sm">
              <Stars rating={product.rating} />
              <span className="text-ink-soft">
                {product.rating} · {product.reviewCount} review{product.reviewCount === 1 ? "" : "s"}
              </span>
            </p>
          ) : null}
          <p className="mt-5 flex flex-wrap items-baseline gap-3">
            <span className="font-serif text-4xl">{formatInr(product.pricePaise)}</span>
            {product.compareAtPaise ? <span className="text-lg text-ink/40 line-through">{formatInr(product.compareAtPaise)}</span> : null}
            {saving ? <span className="text-sm font-semibold text-copper">Save {saving}% vs marketplace</span> : null}
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.14em] text-ink/45">Inclusive of GST · SKU {product.sku}</p>
          <p className="mt-3 text-sm font-medium text-sage">{product.codAllowed ? "Cash on delivery available" : "Pay online only"}</p>
          <p className="mt-6 leading-7 text-ink-soft">{product.description}</p>
          <ProductPurchase product={product} />
          {product.highlights.length > 0 ? (
            <ul className="mt-8 grid gap-2 text-sm">
              {product.highlights.map((highlight) => (
                <li key={highlight} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-copper" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          ) : null}
          <dl className="mt-8 grid gap-3 border-t border-sand pt-6 text-sm">
            {product.material ? (
              <div className="flex justify-between gap-4">
                <dt className="text-ink/50">Material</dt>
                <dd>{product.material}</dd>
              </div>
            ) : null}
            {product.dimensions ? (
              <div className="flex justify-between gap-4">
                <dt className="text-ink/50">Size</dt>
                <dd className="text-right">{product.dimensions}</dd>
              </div>
            ) : null}
            {product.weight ? (
              <div className="flex justify-between gap-4">
                <dt className="text-ink/50">Weight</dt>
                <dd>{product.weight}</dd>
              </div>
            ) : null}
          </dl>
          {product.care ? (
            <div className="mt-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-ink/50">Care</h2>
              <p className="mt-2 text-sm leading-6 text-ink-soft">{product.care}</p>
            </div>
          ) : null}
        </div>
      </div>

      <section className="mt-16 grid gap-10 border-t border-sand pt-12 lg:grid-cols-2">
        <div>
          <h2 className="font-serif text-3xl">Reviews</h2>
          <div className="mt-6 grid gap-5">
            {product.reviews.length === 0 ? <p className="text-sm text-ink-soft">No reviews yet.</p> : null}
            {product.reviews.map((review) => (
              <article key={review.id} className="card p-5">
                <Stars rating={review.rating} />
                <h3 className="mt-2 font-semibold">{review.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-soft">{review.body}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.14em] text-ink/40">
                  {review.author} · {formatDate(review.createdAt)}
                </p>
              </article>
            ))}
          </div>
        </div>
        <div>
          <h2 className="font-serif text-3xl">Write a review</h2>
          <p className="mt-2 text-sm text-ink-soft">Reviews are open once the product has been ordered on your account.</p>
          <div className="mt-5">
            <ReviewForm slug={product.slug} />
          </div>
        </div>
      </section>
    </div>
  );
}
