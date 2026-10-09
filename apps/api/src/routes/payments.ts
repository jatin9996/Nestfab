import { Router } from "express";
import { z } from "zod";
import { demoPaymentsEnabled } from "../env";
import { asyncRoute, HttpError, parseOrThrow } from "../lib/http";
import { assertOrderAccess } from "../lib/orders";
import { markPaid, startPayment, verifyCheckoutSignature, verifyWebhookSignature } from "../lib/payments";
import { prisma } from "../lib/prisma";
import { optionalAuth } from "../middleware/auth";

const accessSchema = z.object({
  orderNumber: z.string().min(4),
  token: z.string().optional(),
});

const verifySchema = accessSchema.extend({
  razorpayOrderId: z.string().min(4),
  razorpayPaymentId: z.string().min(4),
  razorpaySignature: z.string().min(8),
});

export const paymentsRouter = Router();

paymentsRouter.post(
  "/start",
  optionalAuth,
  asyncRoute(async (req, res) => {
    const body = parseOrThrow(accessSchema, req.body);
    const order = await prisma.order.findUnique({ where: { orderNumber: body.orderNumber } });
    if (!order) throw new HttpError(404, "Order not found");
    assertOrderAccess(order, { userId: req.user?.id, role: req.user?.role, token: body.token });
    if (order.status === "CANCELLED") throw new HttpError(400, "This order was cancelled");
    const payment = await startPayment(order);
    res.json({ payment });
  }),
);

paymentsRouter.post(
  "/verify",
  optionalAuth,
  asyncRoute(async (req, res) => {
    const body = parseOrThrow(verifySchema, req.body);
    const order = await prisma.order.findUnique({ where: { orderNumber: body.orderNumber }, include: { items: true } });
    if (!order) throw new HttpError(404, "Order not found");
    assertOrderAccess(order, { userId: req.user?.id, role: req.user?.role, token: body.token });
    if (order.razorpayOrderId && order.razorpayOrderId !== body.razorpayOrderId) {
      throw new HttpError(400, "Payment does not match this order");
    }
    verifyCheckoutSignature(body.razorpayOrderId, body.razorpayPaymentId, body.razorpaySignature);
    const paid = await markPaid(order.id, body.razorpayPaymentId);
    res.json({
      order: {
        orderNumber: paid.orderNumber,
        status: paid.status,
        paymentStatus: paid.paymentStatus,
      },
    });
  }),
);

paymentsRouter.post(
  "/demo-confirm",
  optionalAuth,
  asyncRoute(async (req, res) => {
    if (!demoPaymentsEnabled) {
      throw new HttpError(403, "Demo payments are turned off");
    }
    const body = parseOrThrow(accessSchema, req.body);
    const order = await prisma.order.findUnique({ where: { orderNumber: body.orderNumber } });
    if (!order) throw new HttpError(404, "Order not found");
    assertOrderAccess(order, { userId: req.user?.id, role: req.user?.role, token: body.token });
    if (order.paymentMethod !== "RAZORPAY") throw new HttpError(400, "This order is not an online payment");
    if (order.status === "CANCELLED") throw new HttpError(400, "This order was cancelled");
    const paid = await markPaid(order.id, "demo");
    res.json({
      order: {
        orderNumber: paid.orderNumber,
        status: paid.status,
        paymentStatus: paid.paymentStatus,
      },
    });
  }),
);

export const paymentsWebhook = asyncRoute(async (req, res) => {
  const signature = req.header("x-razorpay-signature");
  const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
  verifyWebhookSignature(raw, signature);
  const event = JSON.parse(raw.toString("utf8")) as {
    event?: string;
    payload?: { payment?: { entity?: { id?: string; order_id?: string } } };
  };
  if (event.event === "payment.captured" || event.event === "order.paid") {
    const payment = event.payload?.payment?.entity;
    if (payment?.order_id && payment.id) {
      const order = await prisma.order.findFirst({ where: { razorpayOrderId: payment.order_id } });
      if (order) await markPaid(order.id, payment.id);
    }
  }
  res.json({ ok: true });
});
