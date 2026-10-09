"use client";

import { useParams, useRouter } from "next/navigation";
import { AdminProductForm } from "@/components/admin-product-form";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const token = useAuth((state) => state.token);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Catalog</p>
          <h1 className="mt-2 font-serif text-4xl">Edit product</h1>
        </div>
        <button
          type="button"
          className="btn-ghost"
          onClick={async () => {
            if (!confirm("Remove this product? If it has been ordered, it will be hidden instead of deleted.")) return;
            await api(`/api/admin/products/${params.id}`, { method: "DELETE", token });
            router.push("/admin/products");
          }}
        >
          Remove
        </button>
      </div>
      <div className="mt-6">
        <AdminProductForm productId={params.id} />
      </div>
    </div>
  );
}
