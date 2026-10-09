"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { formatDate, formatInr, orderStatusLabel } from "@/lib/format";

type Stats = {
  revenuePaise: number;
  paidOrders: number;
  toShip: number;
  customers: number;
  lowStock: { id: string; name: string; sku: string; stock: number }[];
  recentOrders: {
    orderNumber: string;
    email: string;
    totalPaise: number;
    status: string;
    paymentStatus: string;
    createdAt: string;
    itemCount: number;
  }[];
};

export default function AdminHomePage() {
  const token = useAuth((state) => state.token);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!token) return;
    api<Stats>("/api/admin/stats", { token }).then(setStats).catch(() => setStats(null));
  }, [token]);

  if (!stats) return <p className="text-ink-soft">Loading the desk…</p>;

  const cards = [
    ["Paid revenue", formatInr(stats.revenuePaise)],
    ["Paid orders", String(stats.paidOrders)],
    ["To pack or ship", String(stats.toShip)],
    ["Customers", String(stats.customers)],
  ];

  return (
    <div>
      <p className="eyebrow">Overview</p>
      <h1 className="mt-2 font-serif text-4xl">Today’s desk</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value]) => (
          <article key={label} className="card p-5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-ink/45">{label}</p>
            <p className="mt-2 font-serif text-3xl">{value}</p>
          </article>
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="font-serif text-2xl">Recent orders</h2>
          <div className="mt-4 grid gap-3 text-sm">
            {stats.recentOrders.map((order) => (
              <Link key={order.orderNumber} href={`/admin/orders/${order.orderNumber}`} className="flex items-center justify-between gap-3">
                <span>
                  <span className="block font-semibold">{order.orderNumber}</span>
                  <span className="text-ink-soft">
                    {order.email} · {formatDate(order.createdAt)}
                  </span>
                </span>
                <span className="text-right">
                  <span className="block">{formatInr(order.totalPaise)}</span>
                  <span className="text-ink-soft">{orderStatusLabel[order.status] || order.status}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
        <section className="card p-5">
          <h2 className="font-serif text-2xl">Low stock</h2>
          <div className="mt-4 grid gap-3 text-sm">
            {stats.lowStock.length === 0 ? <p className="text-ink-soft">Nothing is at 8 or below.</p> : null}
            {stats.lowStock.map((product) => (
              <Link key={product.id} href={`/admin/products/${product.id}`} className="flex justify-between">
                <span>{product.name}</span>
                <span>{product.stock} left</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
