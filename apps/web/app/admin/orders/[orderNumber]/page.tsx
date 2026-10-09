"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { formatInr, orderStatusLabel, paymentStatusLabel } from "@/lib/format";
import type { Order } from "@/lib/types";

type AdminOrder = Order & { notes: string | null };

export default function AdminOrderPage() {
  const params = useParams<{ orderNumber: string }>();
  const token = useAuth((state) => state.token);
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [status, setStatus] = useState("PENDING");
  const [paymentStatus, setPaymentStatus] = useState("PENDING");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) return;
    api<{ order: AdminOrder }>(`/api/admin/orders/${params.orderNumber}`, { token }).then(({ order: next }) => {
      setOrder(next);
      setStatus(next.status);
      setPaymentStatus(next.paymentStatus);
      setNotes(next.notes || "");
    });
  }, [token, params.orderNumber]);

  if (!order) return <p className="text-ink-soft">Loading order…</p>;

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div>
        <p className="eyebrow">{order.orderNumber}</p>
        <h1 className="mt-2 font-serif text-4xl">{order.shippingName}</h1>
        <p className="mt-3 text-sm leading-6 text-ink-soft">
          {order.email} · {order.phone}
          <br />
          {order.shippingLine1}
          {order.shippingLine2 ? `, ${order.shippingLine2}` : ""}
          <br />
          {order.shippingCity}, {order.shippingState} {order.shippingPincode}
        </p>
        <div className="mt-6 grid gap-3">
          {order.items.map((item) => (
            <article key={item.id} className="card flex justify-between p-4 text-sm">
              <span>
                {item.name}
                <span className="block text-ink-soft">
                  {item.sku} · Qty {item.quantity}
                </span>
              </span>
              <span>{formatInr(item.pricePaise * item.quantity)}</span>
            </article>
          ))}
        </div>
        <p className="mt-4 text-right font-semibold">Total {formatInr(order.totalPaise)}</p>
      </div>
      <form
        className="card grid h-fit gap-4 p-6"
        onSubmit={async (event) => {
          event.preventDefault();
          const result = await api<{ order: AdminOrder }>(`/api/admin/orders/${order.orderNumber}`, {
            method: "PATCH",
            token,
            body: JSON.stringify({ status, paymentStatus, notes }),
          });
          setOrder(result.order);
          setMessage("Order updated");
        }}
      >
        <h2 className="font-serif text-2xl">Fulfilment</h2>
        <label>
          <span className="label">Status</span>
          <select className="field" value={status} onChange={(event) => setStatus(event.target.value)}>
            {Object.entries(orderStatusLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="label">Payment</span>
          <select className="field" value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value)}>
            {Object.entries(paymentStatusLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="label">Internal note</span>
          <textarea className="field min-h-24" value={notes} onChange={(event) => setNotes(event.target.value)} />
        </label>
        <p className="text-xs text-ink-soft">Cancelling an unpaid or paid order returns the stock. Mark COD as paid when the courier has collected the cash. Refunds in Razorpay are still done in the Razorpay dashboard.</p>
        {message ? <p className="text-sm text-sage">{message}</p> : null}
        <button className="btn-primary w-fit">Save order</button>
      </form>
    </div>
  );
}
