"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";

export function ReviewForm({ slug }: { slug: string }) {
  const token = useAuth((state) => state.token);
  const hydrated = useAuth((state) => state.hydrated);
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  if (!hydrated) return null;
  if (!token) {
    return (
      <p className="text-sm text-ink-soft">
        <button type="button" className="link-underline" onClick={() => router.push(`/login?next=/product/${slug}`)}>
          Sign in
        </button>{" "}
        to review this after you have ordered it.
      </p>
    );
  }

  return (
    <form
      className="grid gap-3"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError("");
        try {
          await api(`/api/products/${slug}/reviews`, {
            method: "POST",
            token,
            body: JSON.stringify({ rating, title, body }),
          });
          setTitle("");
          setBody("");
          router.refresh();
        } catch (err) {
          setError(err instanceof ApiError ? err.message : "Could not save the review");
        } finally {
          setPending(false);
        }
      }}
    >
      <label>
        <span className="label">Rating</span>
        <select className="field" value={rating} onChange={(event) => setRating(Number(event.target.value))}>
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>
              {value} star{value === 1 ? "" : "s"}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="label">Title</span>
        <input className="field" value={title} onChange={(event) => setTitle(event.target.value)} required />
      </label>
      <label>
        <span className="label">Review</span>
        <textarea className="field min-h-28" value={body} onChange={(event) => setBody(event.target.value)} required />
      </label>
      {error ? <p className="text-sm text-copper-deep">{error}</p> : null}
      <button className="btn-primary w-fit" disabled={pending}>
        {pending ? "Saving…" : "Publish review"}
      </button>
    </form>
  );
}
