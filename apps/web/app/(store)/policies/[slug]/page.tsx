import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { policies } from "@/lib/policies";

export function generateStaticParams() {
  return Object.keys(policies).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const policy = policies[slug];
  return { title: policy?.title || "Policy" };
}

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const policy = policies[slug];
  if (!policy) notFound();

  return (
    <div className="container-page max-w-3xl py-14">
      <p className="eyebrow">Policy</p>
      <h1 className="mt-3 font-serif text-5xl">{policy.title}</h1>
      <div className="mt-8 grid gap-5 text-base leading-7 text-ink-soft">
        {policy.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </div>
  );
}
