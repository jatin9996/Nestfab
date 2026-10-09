"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError, api, uploadMedia } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { paiseToRupees, rupeesToPaise } from "@/lib/format";
import type { AdminProduct, Category } from "@/lib/types";

type MediaItem = { url: string; alt: string; kind: "IMAGE" | "VIDEO" };

const empty = {
  name: "",
  slug: "",
  description: "",
  highlights: "",
  price: "",
  compareAt: "",
  sku: "",
  stock: "0",
  categoryId: "",
  material: "",
  weight: "",
  dimensions: "",
  care: "",
  featured: false,
  active: true,
  codAllowed: true,
  images: [] as MediaItem[],
  imageLink: "",
};

export function AdminProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const token = useAuth((state) => state.token);
  const [form, setForm] = useState(empty);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!token) return;
    api<{ categories: Category[] }>("/api/admin/categories", { token }).then((data) => {
      setCategories(data.categories);
      setForm((current) => ({ ...current, categoryId: current.categoryId || data.categories[0]?.id || "" }));
    });
    if (!productId) return;
    api<{ product: AdminProduct }>(`/api/admin/products/${productId}`, { token }).then(({ product }) => {
      setForm({
        name: product.name,
        slug: product.slug,
        description: product.description,
        highlights: product.highlights.join("\n"),
        price: paiseToRupees(product.pricePaise),
        compareAt: paiseToRupees(product.compareAtPaise),
        sku: product.sku,
        stock: String(product.stock),
        categoryId: product.categoryId,
        material: product.material || "",
        weight: product.weight || "",
        dimensions: product.dimensions || "",
        care: product.care || "",
        featured: product.featured,
        active: product.active,
        codAllowed: product.codAllowed,
        images: product.images
          .filter((image) => image.url)
          .map((image) => ({
            url: image.url as string,
            alt: image.alt || product.name,
            kind: image.kind === "VIDEO" ? ("VIDEO" as const) : ("IMAGE" as const),
          })),
        imageLink: "",
      });
    });
  }, [token, productId]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function remember(item: MediaItem) {
    setForm((current) => {
      if (item.kind === "VIDEO") {
        return { ...current, images: [...current.images.filter((media) => media.kind !== "VIDEO"), item] };
      }
      const photos = current.images.filter((media) => media.kind !== "VIDEO");
      if (photos.length >= 8) return current;
      return { ...current, images: [...current.images, item] };
    });
  }

  async function uploadFiles(list: FileList | null) {
    if (!list || !token) return;
    setUploading(true);
    setError("");
    let photos = form.images.filter((media) => media.kind !== "VIDEO").length;
    try {
      for (const file of Array.from(list)) {
        if (!file.type.startsWith("video/") && photos >= 8) {
          setError("A product can have up to 8 photos");
          break;
        }
        const uploaded = await uploadMedia(file, token);
        if (uploaded.kind === "IMAGE") photos += 1;
        remember({ url: uploaded.url, alt: form.name, kind: uploaded.kind });
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function addImageLink() {
    const url = form.imageLink.trim();
    if (!url) return;
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error("bad");
    } catch {
      setError("Image link needs to start with http:// or https://");
      return;
    }
    if (form.images.filter((media) => media.kind !== "VIDEO").length >= 8) {
      setError("A product can have up to 8 photos");
      return;
    }
    setError("");
    remember({ url, alt: form.name, kind: "IMAGE" });
    set("imageLink", "");
  }

  return (
    <form
      className="grid max-w-3xl gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError("");
        const payload = {
          name: form.name,
          slug: form.slug || undefined,
          description: form.description,
          highlights: form.highlights.split("\n").map((line) => line.trim()).filter(Boolean),
          pricePaise: rupeesToRupeesSafe(form.price),
          compareAtPaise: form.compareAt ? rupeesToRupeesSafe(form.compareAt) : null,
          sku: form.sku,
          stock: Number(form.stock),
          categoryId: form.categoryId,
          material: form.material || null,
          weight: form.weight || null,
          dimensions: form.dimensions || null,
          care: form.care || null,
          featured: form.featured,
          active: form.active,
          codAllowed: form.codAllowed,
          images: form.images,
        };
        try {
          if (productId) {
            await api(`/api/admin/products/${productId}`, { method: "PATCH", token, body: JSON.stringify(payload) });
          } else {
            await api("/api/admin/products", { method: "POST", token, body: JSON.stringify(payload) });
          }
          router.push("/admin/products");
          router.refresh();
        } catch (err) {
          setError(err instanceof ApiError ? err.message : "Could not save the product");
        } finally {
          setPending(false);
        }
      }}
    >
      <label>
        <span className="label">Name</span>
        <input className="field" required value={form.name} onChange={(event) => set("name", event.target.value)} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="label">Slug</span>
          <input className="field" value={form.slug} onChange={(event) => set("slug", event.target.value)} placeholder="Generated from the name if empty" />
        </label>
        <label>
          <span className="label">SKU</span>
          <input className="field" required value={form.sku} onChange={(event) => set("sku", event.target.value)} />
        </label>
      </div>
      <label>
        <span className="label">Description</span>
        <textarea className="field min-h-36" required value={form.description} onChange={(event) => set("description", event.target.value)} />
      </label>
      <label>
        <span className="label">Highlights, one per line</span>
        <textarea className="field min-h-24" value={form.highlights} onChange={(event) => set("highlights", event.target.value)} />
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        <label>
          <span className="label">Price ₹</span>
          <input className="field" required inputMode="decimal" value={form.price} onChange={(event) => set("price", event.target.value)} />
        </label>
        <label>
          <span className="label">Marketplace price ₹</span>
          <input className="field" inputMode="decimal" value={form.compareAt} onChange={(event) => set("compareAt", event.target.value)} />
        </label>
        <label>
          <span className="label">Stock</span>
          <input className="field" required type="number" min={0} value={form.stock} onChange={(event) => set("stock", event.target.value)} />
        </label>
      </div>
      <label>
        <span className="label">Category</span>
        <select className="field" value={form.categoryId} onChange={(event) => set("categoryId", event.target.value)}>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        <label>
          <span className="label">Material</span>
          <input className="field" value={form.material} onChange={(event) => set("material", event.target.value)} />
        </label>
        <label>
          <span className="label">Weight</span>
          <input className="field" value={form.weight} onChange={(event) => set("weight", event.target.value)} />
        </label>
        <label>
          <span className="label">Size</span>
          <input className="field" value={form.dimensions} onChange={(event) => set("dimensions", event.target.value)} />
        </label>
      </div>
      <label>
        <span className="label">Care</span>
        <textarea className="field min-h-20" value={form.care} onChange={(event) => set("care", event.target.value)} />
      </label>
      <div>
        <span className="label">Photos and video</span>
        <p className="mb-3 text-sm text-ink-soft">Up to 8 photos, JPG, PNG, WEBP, or GIF, 6 MB each. One video, MP4 or WEBM, up to 40 MB. A product with no video simply shows its photos.</p>
        {form.images.length > 0 ? (
          <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {form.images.map((item) => (
              <div key={item.url} className="overflow-hidden rounded-2xl border border-sand bg-cream">
                {item.kind === "VIDEO" ? (
                  <video src={item.url} className="aspect-square w-full bg-ink object-cover" muted />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.url} alt="" className="aspect-square w-full object-cover" />
                )}
                <div className="flex items-center justify-between gap-2 px-2 py-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/50">{item.kind === "VIDEO" ? "Video" : "Photo"}</span>
                  <button
                    type="button"
                    className="text-xs font-semibold text-copper-deep"
                    onClick={() => set("images", form.images.filter((media) => media.url !== item.url))}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <label className="btn-ghost cursor-pointer">
            {uploading ? "Uploading…" : "Upload photos"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="sr-only"
              disabled={uploading || !token}
              onChange={(event) => {
                void uploadFiles(event.target.files);
                event.target.value = "";
              }}
            />
          </label>
          <label className="btn-ghost cursor-pointer">
            {uploading ? "Uploading…" : "Upload video"}
            <input
              type="file"
              accept="video/mp4,video/webm"
              className="sr-only"
              disabled={uploading || !token}
              onChange={(event) => {
                void uploadFiles(event.target.files);
                event.target.value = "";
              }}
            />
          </label>
        </div>
        <div className="mt-3 flex gap-2">
          <input
            className="field"
            placeholder="Or paste an image link"
            value={form.imageLink}
            onChange={(event) => set("imageLink", event.target.value)}
          />
          <button type="button" className="btn-ghost shrink-0" onClick={addImageLink}>
            Add
          </button>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.featured} onChange={(event) => set("featured", event.target.checked)} />
        Featured on the home page
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.active} onChange={(event) => set("active", event.target.checked)} />
        Visible in the shop
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.codAllowed} onChange={(event) => set("codAllowed", event.target.checked)} />
        Allow cash on delivery
      </label>
      {error ? <p className="text-sm text-copper-deep">{error}</p> : null}
      <button className="btn-primary w-fit" disabled={pending}>
        {pending ? "Saving…" : "Save product"}
      </button>
    </form>
  );
}

function rupeesToRupeesSafe(value: string) {
  return rupeesToPaise(value);
}
