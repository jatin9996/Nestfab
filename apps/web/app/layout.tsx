import type { Metadata } from "next";
import { Figtree, Newsreader } from "next/font/google";
import "./globals.css";

const serif = Newsreader({ subsets: ["latin"], variable: "--font-serif", display: "swap" });
const sans = Figtree({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Nestfab — Kitchenware and door guards",
    template: "%s · Nestfab",
  },
  description:
    "Nestfab sells kitchenware and door guards direct to Indian homes. Tri-ply cookware, tawas, draft guards, and door seals, with shipping across India.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${serif.variable} ${sans.variable} font-sans text-ink antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
