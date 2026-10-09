"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { formatInr, rupeesToPaise } from "@/lib/format";

type Coupon = {
  id: string;
  code: string;
  description: string | null;
  type: "PERCENT" | "FLAT";
  value: number;
  minOrderPaise: number;
  active: boolean;
};

export default function CouponsPage() {
  const token = useAuth((state) => state.token);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [form, setForm] = useState({ code: "", description: "", type: "PERCENT", value: "10", min: "0" });

  function load() {
    if (!token) return;
    api<{ coupons: Coupon[] }>("/api/admin/coupons", { token }).then((data) => setCoupons(data.coupons));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <p className="eyebrow">Promotions</p>
        <h1 className="mt-2 font-serif text-4xl">Coupons</h1>
        <div className="mt-6 grid gap-3">
          {coupons.map((coupon) => (
            <article key={coupon.id} className="card flex items-center justify-between p-4 text-sm">
              <div>
                <h2 className="font-semibold">{coupon.code}</h2>
                <p className="text-ink-soft">
                  {coupon.type === "PERCENT" ? `${coupon.value}% off` : `${formatInr(coupon.value)} off`} · min {formatInr(coupon.minOrderPaise)} · {coupon.active ? "Active" : "Off"}
                </p>
              </div>
              <button
                type="button"
                className="underline"
                onClick={async () => {
                  await api(`/api/admin/coupons/${coupon.id}`, {
                    method: "PATCH",
                    token,
                    body: JSON.stringify({ ...coupon, description: coupon.description || "", active: !coupon.active, expiresAt: null }),
                  });
                  load();
                }}
              >
                {coupon.active ? "Disable" : "Enable"}
              </button>
            </article>
          ))}
        </div>
      </div>
      <form
        className="card grid h-fit gap-3 p-6"
        onSubmit={async (event) => {
          event.preventDefault();
          await api("/api/admin/coupons", {
            method: "POST",
            token,
            body: JSON.stringify({
              code: form.code,
              description: form.description,
              type: form.type,
              value: form.type === "PERCENT" ? Number(form.value) : rupeesToPaise(form.value),
              minOrderPaise: rupeesToPaise(form.min || "0"),
              active: true,
            }),
          });
          setForm({ code: "", description: "", type: "PERCENT", value: "10", min: "0" });
          load();
        }}
      >
        <h2 className="font-serif text-2xl">New coupon</h2>
        <input className="field" placeholder="Code" required value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} />
        <input className="field" placeholder="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        <select className="field" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
          <option value="PERCENT">Percent</option>
          <option value="FLAT">Flat rupees</option>
        </select>
        <input className="field" placeholder={form.type === "PERCENT" ? "Percent" : "Rupees off"} value={form.value} onChange={(event) => setForm({ ...form, value: event.target.value })} />
        <input className="field" placeholder="Minimum order ₹" value={form.min} onChange={(event) => setForm({ ...form, min: event.target.value })} />
        <button className="btn-primary w-fit">Create coupon</button>
      </form>
    </div>
  );
}
