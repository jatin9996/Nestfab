"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/logo";
import { useAuth } from "@/lib/auth-store";
import { cartCount, useCart } from "@/lib/cart-store";

const links = [
  { href: "/shop", label: "Shop" },
  { href: "/shop?category=kitchenware", label: "Kitchenware" },
  { href: "/shop?category=door-guards", label: "Door Guards" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const hydratedCart = useCart((state) => state.hydrated);
  const count = useCart((state) => cartCount(state.items));
  const hydratedAuth = useAuth((state) => state.hydrated);
  const user = useAuth((state) => state.user);

  return (
    <header className="sticky top-0 z-40 border-b border-sand/80 bg-paper/90 backdrop-blur-md">
      <div className="bg-sage text-center text-[11px] uppercase tracking-[0.18em] text-cream">
        <p className="container-page py-2">Free shipping above ₹999 · Ships across India · Also on Amazon, Flipkart, and Meesho</p>
      </div>
      <div className="container-page flex items-center gap-6 py-4">
        <Logo />
        <nav className="ml-auto hidden items-center gap-6 text-sm md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-ink/80 hover:text-ink">
              {link.label}
            </Link>
          ))}
        </nav>
        <form action="/shop" className="hidden lg:block">
          <label className="sr-only" htmlFor="search">
            Search products
          </label>
          <input id="search" name="q" placeholder="Search kadai, door guard…" className="field w-56 py-2" />
        </form>
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Link href={hydratedAuth && user ? (user.role === "ADMIN" ? "/admin" : "/account") : "/login"} className="btn-quiet hidden sm:inline-flex">
            {hydratedAuth && user ? user.name.split(" ")[0] : "Account"}
          </Link>
          <Link href="/cart" className="btn-primary px-4">
            Cart
            {hydratedCart && count > 0 ? <span className="rounded-full bg-copper px-2 py-0.5 text-xs">{count}</span> : null}
          </Link>
          <button type="button" className="btn-ghost px-3 md:hidden" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
            Menu
          </button>
        </div>
      </div>
      {open ? (
        <div className="container-page grid gap-3 pb-5 md:hidden">
          {links.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="text-lg">
              {link.label}
            </Link>
          ))}
          <form action="/shop">
            <input name="q" placeholder="Search the shop" className="field" />
          </form>
        </div>
      ) : null}
    </header>
  );
}
