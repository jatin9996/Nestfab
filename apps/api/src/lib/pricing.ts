export const FREE_SHIPPING_THRESHOLD_PAISE = 99900;
export const FLAT_SHIPPING_PAISE = 7900;

export type CouponLike = {
  type: "PERCENT" | "FLAT";
  value: number;
  minOrderPaise: number;
  active: boolean;
  expiresAt: Date | null;
};

export function discountFor(subtotalPaise: number, coupon: CouponLike | null, now = new Date()) {
  if (!coupon) return { discountPaise: 0, error: "Coupon not found" };
  if (!coupon.active) return { discountPaise: 0, error: "This coupon is not active" };
  if (coupon.expiresAt && coupon.expiresAt.getTime() < now.getTime()) {
    return { discountPaise: 0, error: "This coupon has expired" };
  }
  if (subtotalPaise < coupon.minOrderPaise) {
    const rupees = Math.round(coupon.minOrderPaise / 100);
    return { discountPaise: 0, error: `Add more to your cart. This coupon needs an order of ₹${rupees.toLocaleString("en-IN")} before shipping.` };
  }

  const raw = coupon.type === "PERCENT" ? Math.floor((subtotalPaise * coupon.value) / 100) : coupon.value;
  const discountPaise = Math.max(0, Math.min(raw, subtotalPaise));
  return { discountPaise, error: null as string | null };
}

export function shippingFor(subtotalAfterDiscount: number) {
  if (subtotalAfterDiscount <= 0) return 0;
  if (subtotalAfterDiscount >= FREE_SHIPPING_THRESHOLD_PAISE) return 0;
  return FLAT_SHIPPING_PAISE;
}

export function totals(subtotalPaise: number, discountPaise: number) {
  const shippingPaise = shippingFor(subtotalPaise - discountPaise);
  const totalPaise = subtotalPaise - discountPaise + shippingPaise;
  return { subtotalPaise, discountPaise, shippingPaise, totalPaise };
}
