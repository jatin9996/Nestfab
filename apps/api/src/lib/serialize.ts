import { coverImage } from "./media";

type ReviewLite = { rating: number };
type ImageLite = { url: string; alt: string | null; kind?: "IMAGE" | "VIDEO" };
type CategoryLite = { name: string; slug: string };

export type CatalogProduct = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  highlights?: string[];
  pricePaise: number;
  compareAtPaise: number | null;
  sku?: string;
  stock: number;
  material: string | null;
  weight?: string | null;
  dimensions?: string | null;
  care?: string | null;
  featured: boolean;
  codAllowed: boolean;
  active?: boolean;
  category: CategoryLite;
  categoryId?: string;
  imageUrl: string | null;
  imageAlt: string | null;
  images?: { url: string; alt: string | null; kind: "IMAGE" | "VIDEO" }[];
  rating: number | null;
  reviewCount: number;
  reviews?: {
    id: string;
    rating: number;
    title: string;
    body: string;
    createdAt: Date;
    author: string;
  }[];
  createdAt?: Date;
};

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  highlights: string[];
  pricePaise: number;
  compareAtPaise: number | null;
  sku: string;
  stock: number;
  material: string | null;
  weight: string | null;
  dimensions: string | null;
  care: string | null;
  featured: boolean;
  codAllowed: boolean;
  active: boolean;
  categoryId: string;
  createdAt: Date;
  category: CategoryLite;
  images: ImageLite[];
  reviews: { id?: string; rating: number; title?: string; body?: string; createdAt?: Date; user?: { name: string } }[];
};

function ratingOf(reviews: ReviewLite[]) {
  if (reviews.length === 0) return { rating: null, reviewCount: 0 };
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return {
    rating: Math.round((total / reviews.length) * 10) / 10,
    reviewCount: reviews.length,
  };
}

export function toProductCard(product: ProductRow) {
  const { rating, reviewCount } = ratingOf(product.reviews);
  const cover = coverImage(product.images);
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    pricePaise: product.pricePaise,
    compareAtPaise: product.compareAtPaise,
    stock: product.stock,
    featured: product.featured,
    codAllowed: product.codAllowed,
    material: product.material,
    category: { name: product.category.name, slug: product.category.slug },
    imageUrl: cover?.url ?? null,
    imageAlt: cover?.alt ?? product.name,
    rating,
    reviewCount,
  };
}

export function toProductDetail(product: ProductRow) {
  return {
    ...toProductCard(product),
    description: product.description,
    highlights: product.highlights,
    sku: product.sku,
    weight: product.weight,
    dimensions: product.dimensions,
    care: product.care,
    images: product.images.map((image) => ({
      url: image.url,
      alt: image.alt ?? product.name,
      kind: image.kind ?? "IMAGE",
    })),
    reviews: product.reviews
      .filter((review) => review.id && review.title && review.body && review.createdAt && review.user)
      .map((review) => ({
        id: review.id as string,
        rating: review.rating,
        title: review.title as string,
        body: review.body as string,
        createdAt: review.createdAt as Date,
        author: (review.user as { name: string }).name.split(" ")[0],
      })),
  };
}

export function toAdminProduct(product: ProductRow) {
  return {
    ...toProductDetail(product),
    active: product.active,
    categoryId: product.categoryId,
    createdAt: product.createdAt,
  };
}
