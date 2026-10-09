import { AdminProductForm } from "@/components/admin-product-form";

export default function NewProductPage() {
  return (
    <div>
      <p className="eyebrow">Catalog</p>
      <h1 className="mt-2 font-serif text-4xl">New product</h1>
      <div className="mt-6">
        <AdminProductForm />
      </div>
    </div>
  );
}
