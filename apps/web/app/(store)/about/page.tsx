import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="container-page max-w-3xl py-14">
      <p className="eyebrow">The company</p>
      <h1 className="mt-3 font-serif text-5xl leading-tight">A home-products label, now selling direct.</h1>
      <div className="mt-8 grid gap-5 text-lg leading-8 text-ink-soft">
        <p>
          Nestfab has been selling kitchenware and door guards on Amazon, Flipkart, and Meesho. This site is the same catalogue, owned by us: the price, the description, and the person who answers when a lid or a seal is wrong.
        </p>
        <p>
          The kitchen range is built around daily Indian cooking. A kadai has to survive tadka heat and an induction plate. A tawa has to stay flat. A milk pan has to heat fast, because nobody wants to watch chai for ten minutes. The door range comes from the same brief: dust under the main door, cooled air leaking into a hall, and doors that mark the paint when they slam.
        </p>
        <p>
          We would rather describe a product narrowly and sell it to the person it is for, than promise a universal pan. Materials, sizes, and care sit on every product page so you can decide before it is in a courier bag.
        </p>
      </div>
      <Link href="/shop" className="btn-primary mt-8">
        Shop the range
      </Link>
    </div>
  );
}
