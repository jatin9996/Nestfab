"use client";

import { useEffect, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import type { Category } from "@/lib/types";

export default function CategoriesPage() {
  const token = useAuth((state) => state.token);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({ name: "", description: "", imageUrl: "" });
  const [error, setError] = useState("");

  function load() {
    if (!token) return;
    api<{ categories: Category[] }>("/api/admin/categories", { token }).then((data) => setCategories(data.categories));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <p className="eyebrow">Catalog</p>
        <h1 className="mt-2 font-serif text-4xl">Categories</h1>
        <div className="mt-6 grid gap-3">
          {categories.map((category) => (
            <article key={category.id} className="card flex items-start justify-between p-4">
              <div>
                <h2 className="font-semibold">{category.name}</h2>
                <p className="text-sm text-ink-soft">{category.description}</p>
                <p className="mt-1 text-xs text-ink/45">{category.productCount} products</p>
              </div>
              <button
                type="button"
                className="text-sm underline"
                onClick={async () => {
                  try {
                    await api(`/api/admin/categories/${category.id}`, { method: "DELETE", token });
                    load();
                  } catch (err) {
                    setError(err instanceof ApiError ? err.message : "Could not delete");
                  }
                }}
              >
                Delete
              </button>
            </article>
          ))}
        </div>
      </div>
      <form
        className="card grid h-fit gap-3 p-6"
        onSubmit={async (event) => {
          event.preventDefault();
          setError("");
          try {
            await api("/api/admin/categories", { method: "POST", token, body: JSON.stringify(form) });
            setForm({ name: "", description: "", imageUrl: "" });
            load();
          } catch (err) {
            setError(err instanceof ApiError ? err.message : "Could not save");
          }
        }}
      >
        <h2 className="font-serif text-2xl">New category</h2>
        <input className="field" placeholder="Name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <textarea className="field min-h-24" placeholder="Description" required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        <input className="field" placeholder="Image URL" value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} />
        {error ? <p className="text-sm text-copper-deep">{error}</p> : null}
        <button className="btn-primary w-fit">Add category</button>
      </form>
    </div>
  );
}
