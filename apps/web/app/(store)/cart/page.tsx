"use client";

import Link from "next/link";
import { ProductImage } from "@/components/product-image";
import { cartSubtotal, useCart } from "@/lib/cart-store";
import { formatInr } from "@/lib/format";

const FREE_SHIPPING = 99900;

export default function CartPage() {
  const hydrated = useCart((state) => state.hydrated);
  const items = useCart((state) => state.items);
  const setQuantity = useCart((state) => state.setQuantity);
  const remove = useCart((state) => state.remove);
  const subtotal = cartSubtotal(items);
  const remaining = FREE_SHIPPING - subtotal;

  if (!hydrated) return <div className="container-page py-16 text-ink-soft">Loading your cart…</div>;

  return (
    <div className="container-page py-12">
      <p className="eyebrow">Cart</p>
      <h1 className="mt-3 font-serif text-5xl">Your basket</h1>
      {items.length === 0 ? (
        <div className="mt-10">
          <p className="text-ink-soft">Nothing here yet. The kadai and the door guard are a good pair to start with.</p>
          <Link href="/shop" className="btn-primary mt-6">
            Browse the shop
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-10 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="grid gap-4">
            {items.map((item) => (
              <article key={item.productId} className="card flex gap-4 p-4">
                <Link href={`/product/${item.slug}`}>
                  <ProductImage src={item.imageUrl} alt="" className="h-28 w-24 rounded-2xl" />
                </Link>
                <div className="flex flex-1 flex-col">
                  <Link href={`/product/${item.slug}`} className="font-serif text-2xl leading-tight">
                    {item.name}
                  </Link>
                  <p className="mt-1 text-sm text-ink-soft">
                    {formatInr(item.pricePaise)}
                    {item.codAllowed === false ? " · Pay online" : ""}
                  </p>
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <div className="inline-flex items-center rounded-full border border-sand">
                      <button type="button" className="px-3 py-1" onClick={() => setQuantity(item.productId, item.quantity - 1)} aria-label="Decrease">
                        −
                      </button>
                      <span className="w-6 text-center text-sm">{item.quantity}</span>
                      <button type="button" className="px-3 py-1" onClick={() => setQuantity(item.productId, item.quantity + 1)} aria-label="Increase">
                        +
                      </button>
                    </div>
                    <button type="button" className="text-sm text-ink/50 underline" onClick={() => remove(item.productId)}>
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <aside className="card h-fit p-6">
            <h2 className="font-serif text-2xl">Summary</h2>
            <p className="mt-4 flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatInr(subtotal)}</span>
            </p>
            <p className="mt-2 text-sm text-ink-soft">
              {remaining > 0 ? `Add ${formatInr(remaining)} for free shipping.` : "This order qualifies for free shipping."}
            </p>
            <p className="mt-2 text-xs text-ink/45">Shipping and coupons are confirmed at checkout. Final prices come from the server.</p>
            {items.some((item) => item.codAllowed === false) ? (
              <p className="mt-3 text-sm text-ink-soft">This basket includes a product that has to be paid online, so cash on delivery will not be offered.</p>
            ) : null}
            <Link href="/checkout" className="btn-primary mt-6 w-full">
              Checkout
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
