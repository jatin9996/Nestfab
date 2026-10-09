import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-6">
      <div className="max-w-md text-center">
        <p className="eyebrow">404</p>
        <h1 className="mt-3 font-serif text-5xl">That page is not on the shelf.</h1>
        <Link href="/" className="btn-primary mt-6">
          Back home
        </Link>
      </div>
    </div>
  );
}
