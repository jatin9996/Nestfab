export function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5 text-copper" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <span key={value} aria-hidden className={value <= Math.round(rating) ? "opacity-100" : "opacity-25"}>
          ★
        </span>
      ))}
    </span>
  );
}
