"use client";

import { useState } from "react";

export function ProductImage({
  src,
  alt,
  className = "",
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`grid place-items-center bg-[linear-gradient(165deg,#e7efe9,#f7f4ee_48%,#f6e4dc)] ${className}`}>
        <span className="font-serif text-sm tracking-[0.18em] text-ink/35">NESTFAB</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={`object-cover ${className}`} onError={() => setFailed(true)} />
  );
}
