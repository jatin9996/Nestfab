export function formatInr(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: paise % 100 === 0 ? 0 : 2,
  }).format(paise / 100);
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function rupeesToPaise(value: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount * 100);
}

export function paiseToRupees(paise: number | null | undefined) {
  if (!paise) return "";
  return String(paise / 100);
}

export const orderStatusLabel: Record<string, string> = {
  PENDING: "Awaiting payment",
  CONFIRMED: "Confirmed",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export const paymentStatusLabel: Record<string, string> = {
  PENDING: "Unpaid",
  PAID: "Paid",
  FAILED: "Failed",
  COD: "Cash on delivery",
  REFUNDED: "Refunded",
};

export function savePercent(pricePaise: number, compareAtPaise: number | null) {
  if (!compareAtPaise || compareAtPaise <= pricePaise) return null;
  return Math.round((1 - pricePaise / compareAtPaise) * 100);
}
