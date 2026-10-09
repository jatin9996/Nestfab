import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { ProductImage } from "@/components/product-image";
import { api } from "@/lib/api";
import { formatInr } from "@/lib/format";
import type { Category, ProductCard as Product } from "@/lib/types";

export const dynamic = "force-dynamic";

async function loadHome() {
  const [categories, featured] = await Promise.all([
    api<{ categories: Category[] }>("/api/categories"),
    api<{ items: Product[] }>("/api/products?featured=true&pageSize=4"),
  ]);
  return { categories: categories.categories, featured: featured.items };
}

export default async function HomePage() {
  let data: Awaited<ReturnType<typeof loadHome>> | null = null;
  try {
    data = await loadHome();
  } catch {
    data = null;
  }

  const lead = data?.featured[0];

  return (
    <div>
      <section className="container-page grid items-end gap-10 pb-8 pt-12 lg:grid-cols-12 lg:pt-16">
        <div className="lg:col-span-6">
          <p className="eyebrow">Home essentials, sold direct</p>
          <h1 className="mt-4 font-serif text-5xl leading-[1.02] text-ink sm:text-6xl">
            Cookware that can take a tadka. Guards that stop the slam.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-ink-soft">
            Nestfab makes everyday kitchenware and door guards for Indian homes. If you already buy us on Amazon, Flipkart, or Meesho, this is the same shelf — with the full range in one place.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/shop?category=kitchenware" className="btn-primary">
              Shop kitchenware
            </Link>
            <Link href="/shop?category=door-guards" className="btn-ghost">
              Shop door guards
            </Link>
          </div>
          <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-sand pt-6 text-sm">
            <div>
              <dt className="text-ink/45">Shipping</dt>
              <dd className="mt-1 font-medium">Free above ₹999</dd>
            </div>
            <div>
              <dt className="text-ink/45">Prices</dt>
              <dd className="mt-1 font-medium">GST included</dd>
            </div>
            <div>
              <dt className="text-ink/45">Payment</dt>
              <dd className="mt-1 font-medium">Online or COD</dd>
            </div>
          </dl>
        </div>
        <div className="relative lg:col-span-6">
          <ProductImage
            src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1600&q=80"
            alt="A warm home kitchen"
            className="aspect-[5/4] w-full rounded-[32px]"
          />
          {lead ? (
            <Link href={`/product/${lead.slug}`} className="card absolute -bottom-6 left-4 right-4 flex items-center gap-4 p-3 shadow-card sm:left-auto sm:right-6 sm:w-80">
              <ProductImage src={lead.imageUrl} alt="" className="h-20 w-16 rounded-2xl" />
              <span>
                <span className="block text-[11px] uppercase tracking-[0.16em] text-ink/45">Start here</span>
                <span className="mt-1 block font-serif text-xl leading-tight">{lead.name}</span>
                <span className="mt-1 block text-sm">{formatInr(lead.pricePaise)}</span>
              </span>
            </Link>
          ) : null}
        </div>
      </section>

      {!data ? (
        <section className="container-page py-16">
          <div className="card p-8">
            <h2 className="font-serif text-3xl">The shop is waiting on the API</h2>
            <p className="mt-3 max-w-xl text-ink-soft">
              Start Postgres, then run the API on port 4000. The storefront will fill in as soon as the catalog responds.
            </p>
          </div>
        </section>
      ) : (
        <>
          <section className="container-page grid gap-4 py-16 md:grid-cols-3">
            {data.categories.map((category, index) => (
              <Link key={category.id} href={`/shop?category=${category.slug}`} className="group relative min-h-64 overflow-hidden rounded-[28px]">
                <ProductImage src={category.imageUrl} alt="" className="absolute inset-0 h-full w-full transition duration-500 group-hover:scale-105" />
                <span className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
                <span className="absolute bottom-0 p-6 text-cream">
                  <span className="text-[11px] uppercase tracking-[0.18em] text-cream/70">0{index + 1}</span>
                  <span className="mt-1 block font-serif text-3xl">{category.name}</span>
                  <span className="mt-2 block max-w-xs text-sm text-cream/80">{category.description}</span>
                </span>
              </Link>
            ))}
          </section>

          <section className="container-page pb-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow">The shelf</p>
                <h2 className="mt-2 font-serif text-4xl">Pieces we keep coming back to</h2>
              </div>
              <Link href="/shop" className="link-underline text-sm">
                All products
              </Link>
            </div>
            <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {data.featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        </>
      )}

      <section className="container-page grid gap-6 py-16 md:grid-cols-3">
        {[
          ["01", "Buy direct", "Marketplace fees do not have to sit inside the price. The struck-through figure is our usual marketplace price, and you can change it in admin when that price changes."],
          ["02", "Made for this climate", "Kadhai heat, induction plates, monsoon drafts, and doors that slam in a cross-breeze. The range is chosen for those jobs, not a generic global catalogue."],
          ["03", "A person on the other end", "Replacements and questions come to Nestfab, not into a marketplace ticket queue. Write from the contact page and it lands in the admin inbox."],
        ].map(([index, title, copy]) => (
          <article key={index} className="card p-6">
            <p className="font-serif text-2xl text-copper">{index}</p>
            <h3 className="mt-4 font-serif text-2xl">{title}</h3>
            <p className="mt-3 text-sm leading-6 text-ink-soft">{copy}</p>
          </article>
        ))}
      </section>

      <section className="container-page pb-8">
        <blockquote className="rounded-[32px] bg-sage px-8 py-12 text-cream md:px-14">
          <p className="font-serif text-3xl leading-snug md:text-4xl">
            “Heat is even, the helper handle is not a toy, and it has not warped on my induction plate.”
          </p>
          <footer className="mt-6 text-sm text-cream/70">Priya, on the 24 cm tri-ply kadai · Pune</footer>
        </blockquote>
      </section>
    </div>
  );
}
