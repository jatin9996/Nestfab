"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  pricePaise: number;
  imageUrl: string | null;
  quantity: number;
  stock: number;
  codAllowed: boolean;
};

type CartState = {
  items: CartLine[];
  hydrated: boolean;
  add: (item: Omit<CartLine, "quantity">, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  setHydrated: (hydrated: boolean) => void;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      hydrated: false,
      add: (item, quantity = 1) => {
        const existing = get().items.find((line) => line.productId === item.productId);
        const nextQty = Math.min(item.stock, (existing?.quantity ?? 0) + quantity);
        if (nextQty < 1) return;
        const line = { ...item, quantity: nextQty };
        set({
          items: existing
            ? get().items.map((entry) => (entry.productId === item.productId ? line : entry))
            : [...get().items, line],
        });
      },
      setQuantity: (productId, quantity) => {
        set({
          items: get()
            .items.map((line) =>
              line.productId === productId ? { ...line, quantity: Math.min(line.stock, Math.max(1, quantity)) } : line,
            )
            .filter((line) => line.quantity > 0),
        });
      },
      remove: (productId) => set({ items: get().items.filter((line) => line.productId !== productId) }),
      clear: () => set({ items: [] }),
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: "nestfab-cart",
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

export function cartCount(items: CartLine[]) {
  return items.reduce((sum, line) => sum + line.quantity, 0);
}

export function cartSubtotal(items: CartLine[]) {
  return items.reduce((sum, line) => sum + line.pricePaise * line.quantity, 0);
}
