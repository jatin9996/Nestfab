import crypto from "node:crypto";
import { demoPaymentsEnabled, env, razorpayConfigured } from "../env";
import { HttpError } from "./http";
import { prisma } from "./prisma";

type PayableOrder = {
  id: string;
  orderNumber: string;
  email: string;
  phone: string;
  shippingName: string;
  totalPaise: number;
  paymentMethod: string;
  paymentStatus: string;
  razorpayOrderId: string | null;
};

export function paymentMode() {
  if (razorpayConfigured) return "razorpay" as const;
  if (demoPaymentsEnabled) return "demo" as const;
  return "unconfigured" as const;
}

async function createRazorpayOrder(order: PayableOrder) {
  const auth = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString("base64");
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: order.totalPaise,
      currency: "INR",
      receipt: order.orderNumber,
      notes: { orderNumber: order.orderNumber },
    }),
  });

  if (!response.ok) {
    console.error("Razorpay order create failed", response.status);
    throw new HttpError(502, "Payment could not be started. Please try again in a moment.");
  }

  const data = (await response.json()) as { id: string };
  await prisma.order.update({
    where: { id: order.id },
    data: { razorpayOrderId: data.id },
  });
  return data.id;
}

export async function startPayment(order: PayableOrder) {
  if (order.paymentMethod === "COD") {
    return { mode: "cod" as const };
  }
  if (order.paymentStatus === "PAID") {
    return { mode: "already_paid" as const };
  }

  const mode = paymentMode();
  if (mode === "demo") {
    return { mode: "demo" as const, orderNumber: order.orderNumber, amount: order.totalPaise, currency: "INR" };
  }
  if (mode === "unconfigured") {
    throw new HttpError(503, "Online payment is not configured yet. Choose cash on delivery or add Razorpay keys.");
  }

  const razorpayOrderId = order.razorpayOrderId ?? (await createRazorpayOrder(order));
  return {
    mode: "razorpay" as const,
    keyId: env.RAZORPAY_KEY_ID,
    razorpayOrderId,
    amount: order.totalPaise,
    currency: "INR",
    name: "Nestfab",
    description: `Order ${order.orderNumber}`,
    prefill: {
      name: order.shippingName,
      email: order.email,
      contact: order.phone,
    },
  };
}

export function verifyCheckoutSignature(razorpayOrderId: string, razorpayPaymentId: string, signature: string) {
  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new HttpError(400, "Payment verification failed");
  }
}

export async function markPaid(orderId: string, razorpayPaymentId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new HttpError(404, "Order not found");
  if (order.paymentStatus === "PAID") return order;
  return prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: "PAID",
      status: order.status === "PENDING" ? "CONFIRMED" : order.status,
      razorpayPaymentId,
    },
    include: { items: true },
  });
}

export function verifyWebhookSignature(rawBody: Buffer, signature: string | undefined) {
  if (!env.RAZORPAY_WEBHOOK_SECRET) {
    throw new HttpError(503, "Webhook secret is not configured");
  }
  if (!signature) throw new HttpError(400, "Missing signature");
  const expected = crypto.createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new HttpError(400, "Invalid webhook signature");
  }
}
