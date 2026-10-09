"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { formatDate } from "@/lib/format";

type Inquiry = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  handled: boolean;
  createdAt: string;
};

export default function InquiriesPage() {
  const token = useAuth((state) => state.token);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);

  function load() {
    if (!token) return;
    api<{ inquiries: Inquiry[] }>("/api/admin/inquiries", { token }).then((data) => setInquiries(data.inquiries));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div>
      <p className="eyebrow">Inbox</p>
      <h1 className="mt-2 font-serif text-4xl">Messages</h1>
      <div className="mt-6 grid gap-4">
        {inquiries.length === 0 ? <p className="text-ink-soft">No messages yet.</p> : null}
        {inquiries.map((inquiry) => (
          <article key={inquiry.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-serif text-2xl">{inquiry.subject}</h2>
                <p className="text-sm text-ink-soft">
                  {inquiry.name} · {inquiry.email}
                  {inquiry.phone ? ` · ${inquiry.phone}` : ""} · {formatDate(inquiry.createdAt)}
                </p>
              </div>
              <button
                type="button"
                className="btn-ghost"
                onClick={async () => {
                  await api(`/api/admin/inquiries/${inquiry.id}`, {
                    method: "PATCH",
                    token,
                    body: JSON.stringify({ handled: !inquiry.handled }),
                  });
                  load();
                }}
              >
                {inquiry.handled ? "Reopen" : "Mark handled"}
              </button>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-6">{inquiry.message}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
