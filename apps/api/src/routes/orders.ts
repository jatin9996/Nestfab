import { Router } from "express";
import { z } from "zod";
import { asyncRoute, HttpError, parseOrThrow } from "../lib/http";
import { assertOrderAccess, createOrder, publicOrder, quoteOrder, releaseStock } from "../lib/orders";
import { startPayment } from "../lib/payments";
import { prisma } from "../lib/prisma";
import { optionalAuth, requireAuth } from "../middleware/auth";

const itemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(10),
});

const addressSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a 10-digit mobile number"),
  line1: z.string().trim().min(4).max(160),
  line2: z.string().trim().max(160).optional().or(z.literal("")),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  pincode: z.string().trim().regex(/^\d{6}$/, "Enter a 6-digit pincode"),
});

const quoteSchema = z.object({
  items: z.array(itemSchema).min(1).max(30),
  couponCode: z.string().trim().max(20).optional().or(z.literal("")),
});

const checkoutSchema = quoteSchema.extend({
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a 10-digit mobile number"),
  paymentMethod: z.enum(["RAZORPAY", "COD"]),
  customerNote: z.string().trim().max(500).optional().or(z.literal("")),
  gstin: z
    .string()
    .trim()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/, "Enter a valid GSTIN")
    .optional()
    .or(z.literal("")),
  saveAddress: z.boolean().optional(),
  address: addressSchema,
});

export const ordersRouter = Router();

ordersRouter.post(
  "/quote",
  asyncRoute(async (req, res) => {
    const body = parseOrThrow(quoteSchema, req.body);
    const quote = await quoteOrder(body.items, body.couponCode || undefined);
    res.json(quote);
  }),
);

ordersRouter.post(
  "/",
  optionalAuth,
  asyncRoute(async (req, res) => {
    const body = parseOrThrow(checkoutSchema, req.body);
    const order = await createOrder(
      {
        email: body.email,
        phone: body.phone,
        items: body.items,
        couponCode: body.couponCode || undefined,
        paymentMethod: body.paymentMethod,
        customerNote: body.customerNote || undefined,
        gstin: body.gstin || undefined,
        saveAddress: body.saveAddress,
        address: {
          ...body.address,
          line2: body.address.line2 || undefined,
        },
      },
      req.user?.id,
    );
    try {
      const payment = await startPayment(order);
      res.status(201).json({ order: publicOrder(order), payment });
    } catch (error) {
      const message = error instanceof HttpError ? error.message : "Payment could not be started. You can retry from the order page.";
      res.status(201).json({ order: publicOrder(order), payment: { mode: "error", message } });
    }
  }),
);

ordersRouter.get(
  "/mine",
  requireAuth,
  asyncRoute(async (req, res) => {
    const orders = await prisma.order.findMany({
      where: { userId: req.user!.id },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ orders: orders.map(publicOrder) });
  }),
);

ordersRouter.get(
  "/:orderNumber",
  optionalAuth,
  asyncRoute(async (req, res) => {
    const order = await prisma.order.findUnique({
      where: { orderNumber: req.params.orderNumber },
      include: { items: true },
    });
    if (!order) throw new HttpError(404, "Order not found");
    assertOrderAccess(order, {
      userId: req.user?.id,
      role: req.user?.role,
      token: typeof req.query.token === "string" ? req.query.token : undefined,
    });
    res.json({ order: publicOrder(order) });
  }),
);

ordersRouter.post(
  "/:orderNumber/cancel",
  optionalAuth,
  asyncRoute(async (req, res) => {
    const order = await prisma.order.findUnique({
      where: { orderNumber: req.params.orderNumber },
      include: { items: true },
    });
    if (!order) throw new HttpError(404, "Order not found");
    const token = typeof req.body?.token === "string" ? req.body.token : undefined;
    assertOrderAccess(order, { userId: req.user?.id, role: req.user?.role, token });
    if (order.paymentStatus === "PAID" || order.paymentStatus === "COD") {
      throw new HttpError(400, "This order is already confirmed. Write to us if you need to cancel it.");
    }
    if (order.status !== "CANCELLED") {
      await releaseStock(order.id);
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED", paymentStatus: "FAILED" },
      });
    }
    const fresh = await prisma.order.findUnique({ where: { id: order.id }, include: { items: true } });
    res.json({ order: publicOrder(fresh!) });
  }),
);
