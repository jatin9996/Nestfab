"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Logo } from "@/components/logo";
import { useAuth } from "@/lib/auth-store";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/inquiries", label: "Inbox" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const hydrated = useAuth((state) => state.hydrated);
  const user = useAuth((state) => state.user);
  const clear = useAuth((state) => state.clear);

  useEffect(() => {
    if (!hydrated) return;
    if (!user || user.role !== "ADMIN") router.replace("/login?next=/admin");
  }, [hydrated, user, router]);

  if (!hydrated || user?.role !== "ADMIN") {
    return <div className="grid min-h-screen place-items-center text-ink-soft">Checking access…</div>;
  }

  return (
    <div className="min-h-screen bg-paper md:grid md:grid-cols-[240px_1fr]">
      <aside className="bg-sage text-cream md:min-h-screen">
        <div className="px-5 py-6">
          <Logo tone="cream" />
          <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-cream/60">Admin</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-4 md:grid md:px-3">
          {links.map((link) => {
            const active = pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href));
            return (
              <Link key={link.href} href={link.href} className={`whitespace-nowrap rounded-full px-3 py-2 text-sm ${active ? "bg-cream text-ink" : "text-cream/80 hover:bg-white/10"}`}>
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden px-5 pb-6 md:block">
          <Link href="/" className="text-sm text-cream/70">
            View store
          </Link>
          <button
            type="button"
            className="mt-3 block text-sm text-cream/70"
            onClick={() => {
              clear();
              router.push("/");
            }}
          >
            Sign out
          </button>
        </div>
      </aside>
      <div className="px-5 py-8 sm:px-8">{children}</div>
    </div>
  );
}
