import Link from "next/link";

export function Logo({ tone = "ink" }: { tone?: "ink" | "cream" }) {
  const text = tone === "cream" ? "text-cream" : "text-ink";
  return (
    <Link href="/" className={`inline-flex items-center gap-2.5 ${text}`} aria-label="Nestfab home">
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden>
        <rect width="32" height="32" rx="8" fill={tone === "cream" ? "#d4532b" : "#234237"} />
        <path d="M8 18c0-4 3.2-7 8-7s8 3 8 7" fill="none" stroke="#f4f1ea" strokeWidth="1.7" />
        <path d="M6 20h20v2.2c0 1.2-1 2.3-2.4 2.3H8.4C7 24.5 6 23.4 6 22.2V20z" fill={tone === "cream" ? "#f4f1ea" : "#d4532b"} />
      </svg>
      <span className="font-serif text-[1.35rem] leading-none tracking-[0.16em]">NESTFAB</span>
    </Link>
  );
}
