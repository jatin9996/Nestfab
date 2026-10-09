"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { formatDate, formatInr, orderStatusLabel } from "@/lib/format";
import { INDIAN_STATES } from "@/lib/states";
import type { Address, AuthUser, Order } from "@/lib/types";

export default function AccountPage() {
  const router = useRouter();
  const hydrated = useAuth((state) => state.hydrated);
  const token = useAuth((state) => state.token);
  const user = useAuth((state) => state.user);
  const setUser = useAuth((state) => state.setUser);
  const clear = useAuth((state) => state.clear);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [address, setAddress] = useState({
    fullName: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "Maharashtra",
    pincode: "",
  });

  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      router.replace("/login?next=/account");
      return;
    }
    if (user) {
      setName(user.name);
      setPhone(user.phone || "");
    }
    Promise.all([
      api<{ orders: Order[] }>("/api/orders/mine", { token }),
      api<{ addresses: Address[] }>("/api/account/addresses", { token }),
    ])
      .then(([orderData, addressData]) => {
        setOrders(orderData.orders);
        setAddresses(addressData.addresses);
      })
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Could not load your account"));
  }, [hydrated, token, user, router]);

  if (!hydrated || !user) return <div className="container-page py-16 text-ink-soft">Loading your account…</div>;

  return (
    <div className="container-page py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Account</p>
          <h1 className="mt-3 font-serif text-5xl">Hello, {user.name.split(" ")[0]}</h1>
          <p className="mt-2 text-ink-soft">{user.email}</p>
        </div>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => {
            clear();
            router.push("/");
          }}
        >
          Sign out
        </button>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="font-serif text-3xl">Profile</h2>
          <form
            className="mt-4 grid gap-3"
            onSubmit={async (event) => {
              event.preventDefault();
              setError("");
              try {
                const result = await api<{ user: AuthUser }>("/api/account/profile", {
                  method: "PATCH",
                  token,
                  body: JSON.stringify({ name, phone }),
                });
                setUser(result.user);
                setMessage("Profile saved");
              } catch (err) {
                setError(err instanceof ApiError ? err.message : "Could not save");
              }
            }}
          >
            <label>
              <span className="label">Name</span>
              <input className="field" value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label>
              <span className="label">Mobile</span>
              <input className="field" value={phone} onChange={(event) => setPhone(event.target.value)} />
            </label>
            <button className="btn-primary w-fit">Save profile</button>
          </form>
          {message ? <p className="mt-3 text-sm text-sage">{message}</p> : null}
          {error ? <p className="mt-3 text-sm text-copper-deep">{error}</p> : null}
        </section>

        <section className="card p-6">
          <h2 className="font-serif text-3xl">Addresses</h2>
          <div className="mt-4 grid gap-3 text-sm">
            {addresses.map((item) => (
              <article key={item.id} className="flex items-start justify-between gap-3 rounded-2xl border border-sand p-3">
                <p>
                  {item.fullName}, {item.line1}
                  {item.line2 ? `, ${item.line2}` : ""}, {item.city}, {item.state} {item.pincode}
                </p>
                <button
                  type="button"
                  className="text-ink/50 underline"
                  onClick={async () => {
                    await api(`/api/account/addresses/${item.id}`, { method: "DELETE", token });
                    setAddresses((current) => current.filter((entry) => entry.id !== item.id));
                  }}
                >
                  Remove
                </button>
              </article>
            ))}
          </div>
          <form
            className="mt-4 grid gap-3"
            onSubmit={async (event) => {
              event.preventDefault();
              const result = await api<{ address: Address }>("/api/account/addresses", {
                method: "POST",
                token,
                body: JSON.stringify({ ...address, isDefault: addresses.length === 0 }),
              });
              setAddresses((current) => [result.address, ...current]);
              setAddress({ fullName: "", phone: "", line1: "", line2: "", city: "", state: "Maharashtra", pincode: "" });
            }}
          >
            <input className="field" placeholder="Full name" required value={address.fullName} onChange={(event) => setAddress({ ...address, fullName: event.target.value })} />
            <input className="field" placeholder="Mobile" required pattern="[6-9][0-9]{9}" value={address.phone} onChange={(event) => setAddress({ ...address, phone: event.target.value })} />
            <input className="field" placeholder="Address" required value={address.line1} onChange={(event) => setAddress({ ...address, line1: event.target.value })} />
            <input className="field" placeholder="Area" value={address.line2} onChange={(event) => setAddress({ ...address, line2: event.target.value })} />
            <div className="grid gap-3 sm:grid-cols-3">
              <input className="field" placeholder="City" required value={address.city} onChange={(event) => setAddress({ ...address, city: event.target.value })} />
              <select className="field" value={address.state} onChange={(event) => setAddress({ ...address, state: event.target.value })}>
                {INDIAN_STATES.map((state) => (
                  <option key={state}>{state}</option>
                ))}
              </select>
              <input className="field" placeholder="Pincode" required pattern="[0-9]{6}" value={address.pincode} onChange={(event) => setAddress({ ...address, pincode: event.target.value })} />
            </div>
            <button className="btn-ghost w-fit">Add address</button>
          </form>
        </section>
      </div>

      <section className="mt-8">
        <h2 className="font-serif text-3xl">Orders</h2>
        <div className="mt-4 grid gap-3">
          {orders.length === 0 ? <p className="text-sm text-ink-soft">No orders yet.</p> : null}
          {orders.map((order) => (
            <Link key={order.orderNumber} href={`/order/${order.orderNumber}`} className="card flex items-center justify-between p-4">
              <span>
                <span className="block font-semibold">{order.orderNumber}</span>
                <span className="text-sm text-ink-soft">
                  {formatDate(order.createdAt)} · {orderStatusLabel[order.status] || order.status}
                </span>
              </span>
              <span>{formatInr(order.totalPaise)}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
