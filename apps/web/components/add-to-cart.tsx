"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-store";

export function AddToCart({
  product,
  compact = false,
}: {
  product: {
    id: string;
    slug: string;
    name: string;
    pricePaise: number;
    imageUrl: string | null;
    stock: number;
    codAllowed: boolean;
  };
  compact?: boolean;
}) {
  const add = useCart((state) => state.add);
  const [note, setNote] = useState("");

  if (product.stock < 1) {
    return <span className="text-sm text-ink-soft">Out of stock</span>;
  }

  return (
    <div className={compact ? "" : "flex items-center gap-3"}>
      <button
        type="button"
        className={compact ? "btn-quiet px-0" : "btn-primary"}
        onClick={() => {
          add({
            productId: product.id,
            slug: product.slug,
            name: product.name,
            pricePaise: product.pricePaise,
            imageUrl: product.imageUrl,
            stock: product.stock,
            codAllowed: product.codAllowed,
          });
          setNote("Added");
          window.setTimeout(() => setNote(""), 1400);
        }}
      >
        {note || (compact ? "Add" : "Add to cart")}
      </button>
    </div>
  );
}
