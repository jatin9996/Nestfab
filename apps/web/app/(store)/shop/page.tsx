import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProductCard } from "@/components/product-card";
import { SortSelect } from "@/components/sort-select";
import { api } from "@/lib/api";
import type { Category, ProductCard as Product } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Shop" };

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const category = one(params.category) || "";
  const q = one(params.q) || "";
  const sort = one(params.sort) || "newest";
  const page = Number(one(params.page) || "1");

  const query = new URLSearchParams();
  if (category) query.set("category", category);
  if (q) query.set("q", q);
  if (sort) query.set("sort", sort);
  query.set("page", String(page));
  query.set("pageSize", "12");

  let items: Product[] = [];
  let categories: Category[] = [];
  let total = 0;
  let failed = false;

  try {
    const [products, categoryList] = await Promise.all([
      api<{ items: Product[]; total: number }>(`/api/products?${query.toString()}`),
      api<{ categories: Category[] }>("/api/categories"),
    ]);
    items = products.items;
    total = products.total;
    categories = categoryList.categories;
  } catch {
    failed = true;
  }

  const active = categories.find((entry) => entry.slug === category);
  const pages = Math.max(1, Math.ceil(total / 12));

  function pageHref(nextPage: number) {
    const next = new URLSearchParams(query);
    next.set("page", String(nextPage));
    return `/shop?${next.toString()}`;
  }

  return (
    <div className="container-page py-12">
      <p className="eyebrow">Catalog</p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-5xl">{active ? active.name : q ? `Results for “${q}”` : "The shop"}</h1>
          <p className="mt-3 max-w-2xl text-ink-soft">
            {active?.description || "Kitchenware, door guards, and the storage that keeps a small kitchen workable."}
          </p>
        </div>
        <Suspense fallback={null}>
          <SortSelect value={sort} />
        </Suspense>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        <Link href="/shop" className={`rounded-full px-4 py-2 text-sm ${!category ? "bg-ink text-cream" : "bg-cream text-ink"}`}>
          All
        </Link>
        {categories.map((entry) => (
          <Link
            key={entry.id}
            href={`/shop?category=${entry.slug}`}
            className={`rounded-full px-4 py-2 text-sm ${category === entry.slug ? "bg-ink text-cream" : "bg-cream text-ink"}`}
          >
            {entry.name}
            <span className="ml-2 text-xs opacity-60">{entry.productCount}</span>
          </Link>
        ))}
      </div>

      {failed ? (
        <p className="mt-12 text-ink-soft">The catalog could not be loaded. Check that the API is running.</p>
      ) : items.length === 0 ? (
        <p className="mt-12 text-ink-soft">Nothing matches that search. Try a kadai, a tawa, or a door guard.</p>
      ) : (
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {pages > 1 ? (
        <div className="mt-10 flex gap-3">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="btn-ghost">
              Previous
            </Link>
          ) : null}
          <span className="self-center text-sm text-ink-soft">
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link href={pageHref(page + 1)} className="btn-ghost">
              Next
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
