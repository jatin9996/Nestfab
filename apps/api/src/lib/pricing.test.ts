import assert from "node:assert/strict";
import test from "node:test";
import { discountFor, shippingFor, totals } from "./pricing";

const coupon = {
  type: "PERCENT" as const,
  value: 10,
  minOrderPaise: 0,
  active: true,
  expiresAt: null,
};

test("percent coupon discounts the merchandise subtotal", () => {
  const result = discountFor(249900, coupon);
  assert.equal(result.error, null);
  assert.equal(result.discountPaise, 24990);
});

test("flat coupon cannot discount more than the subtotal", () => {
  const result = discountFor(4000, {
    type: "FLAT",
    value: 5000,
    minOrderPaise: 0,
    active: true,
    expiresAt: null,
  });
  assert.equal(result.discountPaise, 4000);
});

test("shipping is free at ₹999 and flat below that", () => {
  assert.equal(shippingFor(99900), 0);
  assert.equal(shippingFor(99800), 7900);
  assert.equal(totals(89900, 0).totalPaise, 97800);
});
