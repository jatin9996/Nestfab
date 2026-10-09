"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { formatDate, formatInr, orderStatusLabel, paymentStatusLabel } from "@/lib/format";
import type { Order, PaymentStart } from "@/lib/types";

function OrderView() {
  const params = useParams<{ orderNumber: string }>();
  const search = useSearchParams();
  const token = useAuth((state) => state.token);
  const access = search.get("token") || "";
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function load() {
    const data = await api<{ order: Order }>(`/api/orders/${params.orderNumber}?token=${encodeURIComponent(access)}`, { token });
    setOrder(data.order);
  }

  useEffect(() => {
    load().catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Order not found"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.orderNumber, access, token]);

  async function pay() {
    if (!order) return;
    setPending(true);
    setError("");
    try {
      const result = await api<{ payment: PaymentStart }>("/api/payments/start", {
        method: "POST",
        token,
        body: JSON.stringify({ orderNumber: order.orderNumber, token: order.accessToken }),
      });
      if (result.payment.mode === "demo") {
        await api("/api/payments/demo-confirm", {
          method: "POST",
          token,
          body: JSON.stringify({ orderNumber: order.orderNumber, token: order.accessToken }),
        });
        await load();
        return;
      }
      if (result.payment.mode !== "razorpay") {
        await load();
        return;
      }
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Razorpay failed to load"));
        document.body.appendChild(script);
      });
      const payment = result.payment;
      const Razorpay = window.Razorpay;
      if (!Razorpay) throw new Error("Razorpay failed to load");
      const instance = new Razorpay({
        key: payment.keyId,
        amount: payment.amount,
        currency: payment.currency,
        name: payment.name,
        description: payment.description,
        order_id: payment.razorpayOrderId,
        prefill: payment.prefill,
        theme: { color: "#234237" },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          await api("/api/payments/verify", {
            method: "POST",
            token,
            body: JSON.stringify({
              orderNumber: order.orderNumber,
              token: order.accessToken,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          });
          await load();
        },
      });
      instance.open();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Payment could not be started");
    } finally {
      setPending(false);
    }
  }

  if (error && !order) {
    return (
      <div className="container-page py-16">
        <h1 className="font-serif text-4xl">We could not open that order</h1>
        <p className="mt-3 text-ink-soft">{error}</p>
      </div>
    );
  }
  if (!order) return <div className="container-page py-16 text-ink-soft">Loading order…</div>;

  const unpaid = order.paymentStatus === "PENDING" && order.status !== "CANCELLED";

  return (
    <div className="container-page py-12">
      <p className="eyebrow">{orderStatusLabel[order.status] || order.status}</p>
      <h1 className="mt-3 font-serif text-5xl">Order {order.orderNumber}</h1>
      <p className="mt-3 text-ink-soft">
        Placed {formatDate(order.createdAt)} · {paymentStatusLabel[order.paymentStatus] || order.paymentStatus}
      </p>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-3">
          {order.items.map((item) => (
            <article key={item.id} className="card flex items-center justify-between p-4">
              <div>
                <h2 className="font-serif text-2xl">{item.name}</h2>
                <p className="text-sm text-ink-soft">
                  {item.sku} · Qty {item.quantity}
                </p>
              </div>
              <p>{formatInr(item.pricePaise * item.quantity)}</p>
            </article>
          ))}
        </div>
        <aside className="card h-fit p-6 text-sm">
          <h2 className="font-serif text-2xl">Delivery</h2>
          <p className="mt-3 leading-6">
            {order.shippingName}
            <br />
            {order.shippingLine1}
            {order.shippingLine2 ? `, ${order.shippingLine2}` : ""}
            <br />
            {order.shippingCity}, {order.shippingState} {order.shippingPincode}
          </p>
          <dl className="mt-4 grid gap-2 border-t border-sand pt-4">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{formatInr(order.subtotalPaise)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Discount</dt>
              <dd>{formatInr(order.discountPaise)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Shipping</dt>
              <dd>{order.shippingPaise === 0 ? "Free" : formatInr(order.shippingPaise)}</dd>
            </div>
            <div className="flex justify-between font-semibold">
              <dt>Total</dt>
              <dd>{formatInr(order.totalPaise)}</dd>
            </div>
          </dl>
          {unpaid ? (
            <button type="button" className="btn-primary mt-5 w-full" onClick={pay} disabled={pending}>
              {pending ? "Opening payment…" : "Pay now"}
            </button>
          ) : null}
          {error ? <p className="mt-3 text-copper-deep">{error}</p> : null}
          <Link href="/shop" className="btn-ghost mt-3 w-full">
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={<div className="container-page py-16 text-ink-soft">Loading order…</div>}>
      <OrderView />
    </Suspense>
  );
}
