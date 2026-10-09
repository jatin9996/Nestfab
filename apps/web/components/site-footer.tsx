import Link from "next/link";
import { Logo } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-sand bg-sage text-cream">
      <div className="container-page grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo tone="cream" />
          <p className="mt-4 max-w-sm text-sm leading-6 text-cream/75">
            Kitchenware and door guards for Indian homes. The same kinds of products we sell on Amazon, Flipkart, and Meesho — now available direct.
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cream/50">Shop</p>
          <div className="mt-3 grid gap-2 text-sm">
            <Link href="/shop?category=kitchenware">Kitchenware</Link>
            <Link href="/shop?category=door-guards">Door guards</Link>
            <Link href="/shop?category=storage">Storage</Link>
            <Link href="/cart">Cart</Link>
          </div>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cream/50">Help</p>
          <div className="mt-3 grid gap-2 text-sm">
            <Link href="/contact">Contact</Link>
            <Link href="/policies/shipping">Shipping</Link>
            <Link href="/policies/returns">Returns</Link>
            <Link href="/policies/privacy">Privacy</Link>
            <Link href="/policies/terms">Terms</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="container-page py-4 text-xs text-cream/50">© {new Date().getFullYear()} Nestfab. Prices include GST.</p>
      </div>
    </footer>
  );
}
