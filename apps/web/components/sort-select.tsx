"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const params = useSearchParams();

  return (
    <label className="text-sm">
      <span className="sr-only">Sort</span>
      <select
        className="field w-auto"
        value={value}
        onChange={(event) => {
          const next = new URLSearchParams(params.toString());
          next.set("sort", event.target.value);
          next.delete("page");
          router.push(`/shop?${next.toString()}`);
        }}
      >
        <option value="newest">Newest</option>
        <option value="price_asc">Price: low to high</option>
        <option value="price_desc">Price: high to low</option>
        <option value="name">Name</option>
      </select>
    </label>
  );
}
