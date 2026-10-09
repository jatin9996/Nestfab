"use client";

import { useState } from "react";
import { ApiError, api } from "@/lib/api";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "Order help", message: "", company: "" });
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  if (done) {
    return (
      <div className="container-page max-w-xl py-16">
        <h1 className="font-serif text-5xl">Message received.</h1>
        <p className="mt-4 text-ink-soft">It is in the Nestfab admin inbox. We read those on working days.</p>
      </div>
    );
  }

  return (
    <div className="container-page grid gap-10 py-14 lg:grid-cols-2">
      <div>
        <p className="eyebrow">Contact</p>
        <h1 className="mt-3 font-serif text-5xl">Write to the people who pack the order.</h1>
        <p className="mt-4 leading-7 text-ink-soft">
          For a damaged delivery, a missing piece, or a question about which door guard fits, use this form. It reaches the admin panel directly. Email hello@nestfab.in if you prefer.
        </p>
      </div>
      <form
        className="card grid gap-4 p-6"
        onSubmit={async (event) => {
          event.preventDefault();
          setPending(true);
          setError("");
          try {
            await api("/api/inquiries", { method: "POST", body: JSON.stringify(form) });
            setDone(true);
          } catch (err) {
            setError(err instanceof ApiError ? err.message : "Could not send the message");
          } finally {
            setPending(false);
          }
        }}
      >
        <label>
          <span className="label">Name</span>
          <input className="field" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </label>
        <label>
          <span className="label">Email</span>
          <input className="field" type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        </label>
        <label>
          <span className="label">Mobile</span>
          <input className="field" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
        </label>
        <label>
          <span className="label">Subject</span>
          <select className="field" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })}>
            <option>Order help</option>
            <option>Product question</option>
            <option>Wholesale</option>
            <option>Something else</option>
          </select>
        </label>
        <label>
          <span className="label">Message</span>
          <textarea className="field min-h-32" required value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} />
        </label>
        <label className="hidden" aria-hidden>
          Company
          <input tabIndex={-1} autoComplete="off" value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} />
        </label>
        {error ? <p className="text-sm text-copper-deep">{error}</p> : null}
        <button className="btn-primary w-fit" disabled={pending}>
          {pending ? "Sending…" : "Send"}
        </button>
      </form>
    </div>
  );
}
