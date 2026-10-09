"use client";

import { useState } from "react";
import { ProductImage } from "@/components/product-image";

type Media = { url: string | null; alt: string | null; kind?: "IMAGE" | "VIDEO" };

export function ProductGallery({ name, media }: { name: string; media: Media[] }) {
  const photos = media.filter((item) => item.url && item.kind !== "VIDEO") as { url: string; alt: string | null }[];
  const video = media.find((item) => item.kind === "VIDEO" && item.url);
  const frames = [
    ...photos.map((photo) => ({ type: "image" as const, url: photo.url, alt: photo.alt || name })),
    ...(video?.url ? [{ type: "video" as const, url: video.url, alt: `${name} video` }] : []),
  ];
  const [active, setActive] = useState(0);
  const frame = frames[active] ?? frames[0];

  if (!frame) {
    return <ProductImage alt={name} className="aspect-[4/5] w-full rounded-[32px] sm:aspect-[5/4]" />;
  }

  return (
    <div className="grid gap-3">
      {frame.type === "video" ? (
        <video key={frame.url} src={frame.url} controls playsInline className="aspect-[4/5] w-full rounded-[32px] bg-ink object-contain sm:aspect-[5/4]" />
      ) : (
        <ProductImage src={frame.url} alt={frame.alt} className="aspect-[4/5] w-full rounded-[32px] sm:aspect-[5/4]" />
      )}
      {frames.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto">
          {frames.map((item, index) => (
            <button
              key={item.url}
              type="button"
              aria-label={item.type === "video" ? "Play product video" : `Photo ${index + 1}`}
              onClick={() => setActive(index)}
              className={`relative h-20 w-16 shrink-0 overflow-hidden rounded-2xl border ${index === active ? "border-sage" : "border-transparent"}`}
            >
              {item.type === "video" ? (
                <span className="grid h-full w-full place-items-center bg-sage text-[10px] font-semibold uppercase tracking-[0.14em] text-cream">Video</span>
              ) : (
                <ProductImage src={item.url} alt="" className="h-full w-full" />
              )}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
