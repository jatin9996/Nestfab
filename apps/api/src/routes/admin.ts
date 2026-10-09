import { Prisma, type OrderStatus, type PaymentStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { asyncRoute, HttpError, parseOrThrow } from "../lib/http";
import { mediaUpload, orderedMedia, publicFileUrl, rejectOversized } from "../lib/media";
import { releaseStock } from "../lib/orders";
import { prisma } from "../lib/prisma";
import { toAdminProduct } from "../lib/serialize";
import { slugify } from "../lib/slug";
import { requireAdmin, requireAuth } from "../middleware/auth";

const imageSchema = z.object({
  url: z.string().url("Media needs a full link"),
  alt: z.string().trim().max(160).optional(),
  kind: z.enum(["IMAGE", "VIDEO"]).default("IMAGE"),
});

const productSchema = z.object({
  name: z.string().trim().min(2).max(140),
  slug: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().min(10).max(8000),
  highlights: z.array(z.string().trim().min(1).max(160)).max(12).default([]),
  pricePaise: z.number().int().min(100, "Price looks too low").max(10_000_000),
  compareAtPaise: z.number().int().min(0).nullable().optional(),
  sku: z.string().trim().min(2).max(40),
  stock: z.number().int().min(0).max(100000),
  categoryId: z.string().min(1),
  material: z.string().trim().max(120).nullable().optional(),
  weight: z.string().trim().max(80).nullable().optional(),
  dimensions: z.string().trim().max(80).nullable().optional(),
  care: z.string().trim().max(2000).nullable().optional(),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  codAllowed: z.boolean().default(true),
  images: z.array(imageSchema).max(9).default([]),
});

const categorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().min(4).max(500),
  imageUrl: z.string().trim().url().optional().or(z.literal("")).nullable(),
});

const couponSchema = z.object({
  code: z.string().trim().min(3).max(20),
  description: z.string().trim().max(200).optional().or(z.literal("")),
  type: z.enum(["PERCENT", "FLAT"]),
  value: z.number().int().positive(),
  minOrderPaise: z.number().int().min(0).default(0),
  active: z.boolean().default(true),
  expiresAt: z.string().datetime().nullable().optional(),
});

const orderPatchSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"]).optional(),
  paymentStatus: z.enum(["PENDING", "PAID", "FAILED", "COD", "REFUNDED"]).optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
});

const adminProductInclude = {
  category: true,
  images: { orderBy: { sortOrder: "asc" as const } },
  reviews: { include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" as const } },
};

function productData(body: z.infer<typeof productSchema>) {
  const compareAtPaise = body.compareAtPaise && body.compareAtPaise > body.pricePaise ? body.compareAtPaise : null;
  return {
    name: body.name,
    slug: slugify(body.slug || body.name),
    description: body.description,
    highlights: body.highlights.map((line) => line.trim()).filter(Boolean),
    pricePaise: body.pricePaise,
    compareAtPaise,
    sku: body.sku.toUpperCase(),
    stock: body.stock,
    categoryId: body.categoryId,
    material: body.material || null,
    weight: body.weight || null,
    dimensions: body.dimensions || null,
    care: body.care || null,
    featured: body.featured,
    active: body.active,
    codAllowed: body.codAllowed,
  };
}

function validateCoupon(body: z.infer<typeof couponSchema>) {
  if (body.type === "PERCENT" && body.value > 90) {
    throw new HttpError(400, "Percent coupons cannot be more than 90%");
  }
}

export const adminRouter = Router();
adminRouter.use(requireAuth, requireAdmin);

adminRouter.post(
  "/media",
  mediaUpload.single("file"),
  asyncRoute(async (req, res) => {
    const file = req.file;
    if (!file) throw new HttpError(400, "Choose a photo or video to upload");
    rejectOversized(file);
    const kind = file.mimetype.startsWith("video/") ? "VIDEO" : "IMAGE";
    res.status(201).json({ url: publicFileUrl(req, file.filename), kind });
  }),
);

adminRouter.get(
  "/stats",
  asyncRoute(async (_req, res) => {
    const [paid, toShip, lowStock, customers, recent] = await Promise.all([
      prisma.order.aggregate({
        where: { paymentStatus: "PAID" },
        _sum: { totalPaise: true },
        _count: true,
      }),
      prisma.order.count({ where: { status: { in: ["CONFIRMED", "PACKED"] } } }),
      prisma.product.findMany({
        where: { active: true, stock: { lte: 8 } },
        orderBy: { stock: "asc" },
        take: 6,
        include: { images: { take: 8, orderBy: { sortOrder: "asc" } } },
      }),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { items: true },
      }),
    ]);

    res.json({
      revenuePaise: paid._sum.totalPaise ?? 0,
      paidOrders: paid._count,
      toShip,
      customers,
      lowStock: lowStock.map((product) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        stock: product.stock,
        imageUrl: product.images.find((image) => image.kind !== "VIDEO")?.url ?? null,
      })),
      recentOrders: recent.map((order) => ({
        orderNumber: order.orderNumber,
        email: order.email,
        totalPaise: order.totalPaise,
        status: order.status,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      })),
    });
  }),
);

adminRouter.get(
  "/products",
  asyncRoute(async (req, res) => {
    const q = typeof req.query.q === "string" ? req.query.q : "";
    const where: Prisma.ProductWhereInput = q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { sku: { contains: q, mode: "insensitive" } },
          ],
        }
      : {};
    const products = await prisma.product.findMany({
      where,
      include: adminProductInclude,
      orderBy: { updatedAt: "desc" },
    });
    res.json({ products: products.map(toAdminProduct) });
  }),
);

adminRouter.get(
  "/products/:id",
  asyncRoute(async (req, res) => {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: adminProductInclude,
    });
    if (!product) throw new HttpError(404, "Product not found");
    res.json({ product: toAdminProduct(product) });
  }),
);

adminRouter.post(
  "/products",
  asyncRoute(async (req, res) => {
    const body = parseOrThrow(productSchema, req.body);
    const product = await prisma.product.create({
      data: {
        ...productData(body),
        images: {
          create: orderedMedia(body.name, body.images),
        },
      },
      include: adminProductInclude,
    });
    res.status(201).json({ product: toAdminProduct(product) });
  }),
);

adminRouter.patch(
  "/products/:id",
  asyncRoute(async (req, res) => {
    const body = parseOrThrow(productSchema, req.body);
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, "Product not found");
    const product = await prisma.product.update({
      where: { id: existing.id },
      data: {
        ...productData(body),
        images: {
          deleteMany: {},
          create: orderedMedia(body.name, body.images),
        },
      },
      include: adminProductInclude,
    });
    res.json({ product: toAdminProduct(product) });
  }),
);

adminRouter.delete(
  "/products/:id",
  asyncRoute(async (req, res) => {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) throw new HttpError(404, "Product not found");
    const used = await prisma.orderItem.count({ where: { productId: product.id } });
    if (used > 0) {
      await prisma.product.update({ where: { id: product.id }, data: { active: false } });
      res.json({ deactivated: true });
      return;
    }
    await prisma.product.delete({ where: { id: product.id } });
    res.json({ deleted: true });
  }),
);

adminRouter.get(
  "/categories",
  asyncRoute(async (_req, res) => {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
    });
    res.json({
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        imageUrl: category.imageUrl,
        productCount: category._count.products,
      })),
    });
  }),
);

adminRouter.post(
  "/categories",
  asyncRoute(async (req, res) => {
    const body = parseOrThrow(categorySchema, req.body);
    const category = await prisma.category.create({
      data: {
        name: body.name,
        slug: slugify(body.slug || body.name),
        description: body.description,
        imageUrl: body.imageUrl || null,
      },
    });
    res.status(201).json({ category });
  }),
);

adminRouter.patch(
  "/categories/:id",
  asyncRoute(async (req, res) => {
    const body = parseOrThrow(categorySchema, req.body);
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: {
        name: body.name,
        slug: slugify(body.slug || body.name),
        description: body.description,
        imageUrl: body.imageUrl || null,
      },
    });
    res.json({ category });
  }),
);

adminRouter.delete(
  "/categories/:id",
  asyncRoute(async (req, res) => {
    const count = await prisma.product.count({ where: { categoryId: req.params.id } });
    if (count > 0) throw new HttpError(400, "Move or remove products in this category first");
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  }),
);

adminRouter.get(
  "/orders",
  asyncRoute(async (req, res) => {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const where: Prisma.OrderWhereInput = {};
    if (status && status !== "ALL") where.status = status as OrderStatus;
    const orders = await prisma.order.findMany({
      where,
      include: { items: true, user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    res.json({
      orders: orders.map((order) => ({
        orderNumber: order.orderNumber,
        email: order.email,
        phone: order.phone,
        shippingName: order.shippingName,
        shippingCity: order.shippingCity,
        shippingState: order.shippingState,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        totalPaise: order.totalPaise,
        createdAt: order.createdAt,
        itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      })),
    });
  }),
);

adminRouter.get(
  "/orders/:orderNumber",
  asyncRoute(async (req, res) => {
    const order = await prisma.order.findUnique({
      where: { orderNumber: req.params.orderNumber },
      include: { items: true },
    });
    if (!order) throw new HttpError(404, "Order not found");
    res.json({ order });
  }),
);

adminRouter.patch(
  "/orders/:orderNumber",
  asyncRoute(async (req, res) => {
    const body = parseOrThrow(orderPatchSchema, req.body);
    const order = await prisma.order.findUnique({ where: { orderNumber: req.params.orderNumber } });
    if (!order) throw new HttpError(404, "Order not found");
    if (order.status === "CANCELLED" && body.status && body.status !== "CANCELLED") {
      throw new HttpError(400, "Cancelled orders stay cancelled. Place a new order if the customer still wants the goods.");
    }
    if (body.status === "CANCELLED" && order.status !== "CANCELLED") {
      await releaseStock(order.id);
    }
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: body.status as OrderStatus | undefined,
        paymentStatus: body.paymentStatus as PaymentStatus | undefined,
        notes: body.notes === undefined ? undefined : body.notes,
      },
      include: { items: true },
    });
    res.json({ order: updated });
  }),
);

adminRouter.get(
  "/coupons",
  asyncRoute(async (_req, res) => {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
    res.json({ coupons });
  }),
);

adminRouter.post(
  "/coupons",
  asyncRoute(async (req, res) => {
    const body = parseOrThrow(couponSchema, req.body);
    validateCoupon(body);
    const coupon = await prisma.coupon.create({
      data: {
        code: body.code.toUpperCase(),
        description: body.description || null,
        type: body.type,
        value: body.value,
        minOrderPaise: body.minOrderPaise,
        active: body.active,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      },
    });
    res.status(201).json({ coupon });
  }),
);

adminRouter.patch(
  "/coupons/:id",
  asyncRoute(async (req, res) => {
    const body = parseOrThrow(couponSchema, req.body);
    validateCoupon(body);
    const coupon = await prisma.coupon.update({
      where: { id: req.params.id },
      data: {
        code: body.code.toUpperCase(),
        description: body.description || null,
        type: body.type,
        value: body.value,
        minOrderPaise: body.minOrderPaise,
        active: body.active,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      },
    });
    res.json({ coupon });
  }),
);

adminRouter.delete(
  "/coupons/:id",
  asyncRoute(async (req, res) => {
    await prisma.coupon.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  }),
);

adminRouter.get(
  "/customers",
  asyncRoute(async (_req, res) => {
    const customers = await prisma.user.findMany({
      where: { role: "CUSTOMER" },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { orders: true } } },
    });
    res.json({
      customers: customers.map((customer) => ({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        createdAt: customer.createdAt,
        orderCount: customer._count.orders,
      })),
    });
  }),
);

adminRouter.get(
  "/inquiries",
  asyncRoute(async (_req, res) => {
    const inquiries = await prisma.inquiry.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
    res.json({ inquiries });
  }),
);

adminRouter.patch(
  "/inquiries/:id",
  asyncRoute(async (req, res) => {
    const body = parseOrThrow(z.object({ handled: z.boolean() }), req.body);
    const inquiry = await prisma.inquiry.update({
      where: { id: req.params.id },
      data: { handled: body.handled },
    });
    res.json({ inquiry });
  }),
);
