"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-store";
import type { ProductDetailResponse } from "@/lib/types";

export function ProductPurchase({ product }: { product: ProductDetailResponse }) {
  const add = useCart((state) => state.add);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const router = useRouter();
  const out = product.stock < 1;

  function putInCart() {
    add(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        pricePaise: product.pricePaise,
        imageUrl: product.imageUrl,
        stock: product.stock,
        codAllowed: product.codAllowed,
      },
      quantity,
    );
  }

  return (
    <div className="mt-6">
      <div className="flex items-center gap-3">
        <label className="label mb-0" htmlFor="qty">
          Qty
        </label>
        <div className="inline-flex items-center rounded-full border border-sand bg-cream">
          <button type="button" className="px-3 py-2" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Decrease quantity">
            −
          </button>
          <input
            id="qty"
            className="w-10 bg-transparent text-center text-sm outline-none"
            value={quantity}
            onChange={(event) => setQuantity(Math.max(1, Math.min(product.stock || 1, Number(event.target.value) || 1)))}
          />
          <button type="button" className="px-3 py-2" onClick={() => setQuantity((value) => Math.min(product.stock, value + 1))} aria-label="Increase quantity">
            +
          </button>
        </div>
        <span className="text-sm text-ink-soft">{out ? "Out of stock" : `${product.stock} in stock`}</span>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          className="btn-primary"
          disabled={out}
          onClick={() => {
            putInCart();
            setNote("Added to cart");
          }}
        >
          Add to cart
        </button>
        <button
          type="button"
          className="btn-copper"
          disabled={out}
          onClick={() => {
            putInCart();
            router.push("/checkout");
          }}
        >
          Buy now
        </button>
      </div>
      {note ? <p className="mt-3 text-sm text-sage">{note}</p> : null}
    </div>
  );
}
