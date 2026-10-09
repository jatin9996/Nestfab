"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { useCart } from "@/lib/cart-store";
import { formatInr } from "@/lib/format";
import { INDIAN_STATES } from "@/lib/states";
import type { Address, Order, PaymentStart, Quote } from "@/lib/types";

type RazorpaySuccess = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpay() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCart((state) => state.items);
  const hydrated = useCart((state) => state.hydrated);
  const clear = useCart((state) => state.clear);
  const token = useAuth((state) => state.token);
  const user = useAuth((state) => state.user);
  const authHydrated = useAuth((state) => state.hydrated);

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("Maharashtra");
  const [pincode, setPincode] = useState("");
  const [gstin, setGstin] = useState("");
  const [note, setNote] = useState("");
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"RAZORPAY" | "COD">("RAZORPAY");
  const [saveAddress, setSaveAddress] = useState(true);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [demo, setDemo] = useState<{ order: Order; payment: PaymentStart } | null>(null);

  const itemKey = useMemo(() => items.map((item) => `${item.productId}:${item.quantity}`).join("|"), [items]);

  useEffect(() => {
    if (!authHydrated || !user) return;
    setEmail((value) => value || user.email);
    setPhone((value) => value || user.phone || "");
    setFullName((value) => value || user.name);
    if (!token) return;
    api<{ addresses: Address[] }>("/api/account/addresses", { token })
      .then((data) => {
        const address = data.addresses[0];
        if (!address) return;
        setFullName(address.fullName);
        setPhone(address.phone);
        setLine1(address.line1);
        setLine2(address.line2 || "");
        setCity(address.city);
        setStateName(address.state);
        setPincode(address.pincode);
      })
      .catch(() => undefined);
  }, [authHydrated, user, token]);

  useEffect(() => {
    if (!hydrated || items.length === 0) return;
    let cancelled = false;
    api<Quote>("/api/orders/quote", {
      method: "POST",
      body: JSON.stringify({
        items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        couponCode: appliedCoupon,
      }),
    })
      .then((next) => {
        if (!cancelled) {
          setQuote(next);
          setError("");
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Could not price this cart");
      });
    return () => {
      cancelled = true;
    };
  }, [hydrated, itemKey, appliedCoupon, items]);

  useEffect(() => {
    if (quote && !quote.codAllowed && paymentMethod === "COD") setPaymentMethod("RAZORPAY");
  }, [quote, paymentMethod]);

  async function openRazorpay(order: Order, payment: Extract<PaymentStart, { mode: "razorpay" }>) {
    const ready = await loadRazorpay();
    if (!ready || !window.Razorpay) {
      setError("Razorpay could not be loaded. You can retry from the order page.");
      router.push(`/order/${order.orderNumber}?token=${order.accessToken}`);
      return;
    }
    const instance = new window.Razorpay({
      key: payment.keyId,
      amount: payment.amount,
      currency: payment.currency,
      name: payment.name,
      description: payment.description,
      order_id: payment.razorpayOrderId,
      prefill: payment.prefill,
      theme: { color: "#234237" },
      handler: async (response: RazorpaySuccess) => {
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
        router.push(`/order/${order.orderNumber}?token=${order.accessToken}`);
      },
      modal: {
        ondismiss: () => router.push(`/order/${order.orderNumber}?token=${order.accessToken}`),
      },
    });
    instance.open();
  }

  async function placeOrder(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const result = await api<{ order: Order; payment: PaymentStart }>("/api/orders", {
        method: "POST",
        token,
        body: JSON.stringify({
          email,
          phone,
          items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
          couponCode: appliedCoupon,
          paymentMethod,
          customerNote: note,
          gstin: gstin.toUpperCase(),
          saveAddress: Boolean(token && saveAddress),
          address: { fullName, phone, line1, line2, city, state: stateName, pincode },
        }),
      });
      clear();
      if (result.payment.mode === "cod" || result.payment.mode === "already_paid" || result.payment.mode === "error") {
        if (result.payment.mode === "error") setError(result.payment.message);
        router.push(`/order/${result.order.orderNumber}?token=${result.order.accessToken}`);
        return;
      }
      if (result.payment.mode === "demo") {
        setDemo(result);
        return;
      }
      await openRazorpay(result.order, result.payment);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not place the order");
    } finally {
      setPending(false);
    }
  }

  if (!hydrated) return <div className="container-page py-16 text-ink-soft">Preparing checkout…</div>;
  if (items.length === 0 && !demo) {
    return (
      <div className="container-page py-16">
        <h1 className="font-serif text-4xl">Your cart is empty</h1>
        <Link href="/shop" className="btn-primary mt-6">
          Return to shop
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-12">
      <p className="eyebrow">Checkout</p>
      <h1 className="mt-3 font-serif text-5xl">Delivery and payment</h1>
      {demo ? (
        <div className="card mt-8 max-w-xl p-6">
          <h2 className="font-serif text-3xl">Demo payment</h2>
          <p className="mt-3 text-sm leading-6 text-ink-soft">
            Razorpay keys are not set, so this environment simulates a successful online payment. No money moves. Order {demo.order.orderNumber} is reserved.
          </p>
          <button
            type="button"
            className="btn-primary mt-6"
            onClick={async () => {
              setPending(true);
              try {
                await api("/api/payments/demo-confirm", {
                  method: "POST",
                  token,
                  body: JSON.stringify({ orderNumber: demo.order.orderNumber, token: demo.order.accessToken }),
                });
                router.push(`/order/${demo.order.orderNumber}?token=${demo.order.accessToken}`);
              } catch (err) {
                setError(err instanceof ApiError ? err.message : "Demo payment failed");
              } finally {
                setPending(false);
              }
            }}
          >
            {pending ? "Confirming…" : `Mark ${formatInr(demo.order.totalPaise)} as paid`}
          </button>
          {error ? <p className="mt-3 text-sm text-copper-deep">{error}</p> : null}
        </div>
      ) : (
        <form className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]" onSubmit={placeOrder}>
          <div className="grid gap-6">
            <section className="card grid gap-4 p-6">
              <h2 className="font-serif text-2xl">Contact</h2>
              {!user ? (
                <p className="text-sm text-ink-soft">
                  <Link href="/login?next=/checkout" className="link-underline">
                    Sign in
                  </Link>{" "}
                  to use a saved address, or check out as a guest.
                </p>
              ) : null}
              <label>
                <span className="label">Email</span>
                <input className="field" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
              </label>
              <label>
                <span className="label">Mobile</span>
                <input className="field" required pattern="[6-9][0-9]{9}" value={phone} onChange={(event) => setPhone(event.target.value)} />
              </label>
            </section>
            <section className="card grid gap-4 p-6">
              <h2 className="font-serif text-2xl">Ship to</h2>
              <label>
                <span className="label">Full name</span>
                <input className="field" required value={fullName} onChange={(event) => setFullName(event.target.value)} />
              </label>
              <label>
                <span className="label">Address</span>
                <input className="field" required value={line1} onChange={(event) => setLine1(event.target.value)} />
              </label>
              <label>
                <span className="label">Apartment, area</span>
                <input className="field" value={line2} onChange={(event) => setLine2(event.target.value)} />
              </label>
              <div className="grid gap-4 sm:grid-cols-3">
                <label>
                  <span className="label">City</span>
                  <input className="field" required value={city} onChange={(event) => setCity(event.target.value)} />
                </label>
                <label>
                  <span className="label">State</span>
                  <select className="field" value={stateName} onChange={(event) => setStateName(event.target.value)}>
                    {INDIAN_STATES.map((state) => (
                      <option key={state}>{state}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="label">Pincode</span>
                  <input className="field" required pattern="[0-9]{6}" value={pincode} onChange={(event) => setPincode(event.target.value)} />
                </label>
              </div>
              <label>
                <span className="label">GSTIN, if you need it on the order</span>
                <input className="field" value={gstin} onChange={(event) => setGstin(event.target.value.toUpperCase())} />
              </label>
              <label>
                <span className="label">Note for delivery</span>
                <textarea className="field min-h-20" value={note} onChange={(event) => setNote(event.target.value)} />
              </label>
              {token ? (
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={saveAddress} onChange={(event) => setSaveAddress(event.target.checked)} />
                  Save this address to my account
                </label>
              ) : null}
            </section>
          </div>
          <aside className="card h-fit p-6">
            <h2 className="font-serif text-2xl">Order</h2>
            <div className="mt-4 grid gap-3 text-sm">
              {(quote?.lines || items).map((line) => (
                <p key={line.productId} className="flex justify-between gap-3">
                  <span>
                    {line.name} × {line.quantity}
                  </span>
                  <span>{formatInr("linePaise" in line ? line.linePaise : line.pricePaise * line.quantity)}</span>
                </p>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <input className="field" placeholder="Coupon" value={coupon} onChange={(event) => setCoupon(event.target.value.toUpperCase())} />
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  setAppliedCoupon(coupon.trim());
                }}
              >
                Apply
              </button>
            </div>
            {quote ? (
              <dl className="mt-4 grid gap-2 border-t border-sand pt-4 text-sm">
                <div className="flex justify-between">
                  <dt>Subtotal</dt>
                  <dd>{formatInr(quote.subtotalPaise)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Discount</dt>
                  <dd>{formatInr(quote.discountPaise)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Shipping</dt>
                  <dd>{quote.shippingPaise === 0 ? "Free" : formatInr(quote.shippingPaise)}</dd>
                </div>
                <div className="flex justify-between text-base font-semibold">
                  <dt>Total</dt>
                  <dd>{formatInr(quote.totalPaise)}</dd>
                </div>
              </dl>
            ) : null}
            <fieldset className="mt-5 grid gap-2 text-sm">
              <legend className="label">Payment</legend>
              <label className="flex items-center gap-2">
                <input type="radio" name="pay" checked={paymentMethod === "RAZORPAY"} onChange={() => setPaymentMethod("RAZORPAY")} />
                Pay online
              </label>
              <label className={`flex items-center gap-2 ${quote && !quote.codAllowed ? "text-ink/40" : ""}`}>
                <input
                  type="radio"
                  name="pay"
                  checked={paymentMethod === "COD"}
                  disabled={Boolean(quote && !quote.codAllowed)}
                  onChange={() => setPaymentMethod("COD")}
                />
                Cash on delivery
              </label>
            </fieldset>
            {quote && !quote.codAllowed ? (
              <p className="mt-3 text-sm text-ink-soft">
                Cash on delivery is turned off for {quote.codBlocked.join(", ")}. This order needs to be paid online.
              </p>
            ) : null}
            {error ? <p className="mt-4 text-sm text-copper-deep">{error}</p> : null}
            <button className="btn-primary mt-5 w-full" disabled={pending || !quote}>
              {pending ? "Placing order…" : paymentMethod === "COD" ? "Place COD order" : "Place order and pay"}
            </button>
          </aside>
        </form>
      )}
    </div>
  );
}
