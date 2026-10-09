"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { formatInr } from "@/lib/format";
import type { AdminProduct } from "@/lib/types";

export default function AdminProductsPage() {
  const token = useAuth((state) => state.token);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [q, setQ] = useState("");

  function load(query = q) {
    if (!token) return;
    api<{ products: AdminProduct[] }>(`/api/admin/products?q=${encodeURIComponent(query)}`, { token }).then((data) => setProducts(data.products));
  }

  useEffect(() => {
    load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Catalog</p>
          <h1 className="mt-2 font-serif text-4xl">Products</h1>
        </div>
        <Link href="/admin/products/new" className="btn-primary">
          New product
        </Link>
      </div>
      <form
        className="mt-6 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          load(q);
        }}
      >
        <input className="field max-w-sm" placeholder="Search name or SKU" value={q} onChange={(event) => setQ(event.target.value)} />
        <button className="btn-ghost">Search</button>
      </form>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-[11px] uppercase tracking-[0.14em] text-ink/45">
            <tr>
              <th className="py-2">Product</th>
              <th>SKU</th>
              <th>Price</th>
              <th>Stock</th>
              <th>COD</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-t border-sand">
                <td className="py-3">
                  <Link href={`/admin/products/${product.id}`} className="font-semibold">
                    {product.name}
                  </Link>
                  <p className="text-ink-soft">{product.category.name}</p>
                </td>
                <td>{product.sku}</td>
                <td>{formatInr(product.pricePaise)}</td>
                <td>{product.stock}</td>
                <td>{product.codAllowed ? "Allowed" : "Online only"}</td>
                <td>{product.active ? "Live" : "Hidden"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
