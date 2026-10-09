import { Prisma } from "@prisma/client";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { asyncRoute, HttpError, parseOrThrow } from "../lib/http";
import { prisma } from "../lib/prisma";
import { toProductCard, toProductDetail } from "../lib/serialize";
import { requireAuth } from "../middleware/auth";

const listSchema = z.object({
  category: z.string().optional(),
  q: z.string().optional(),
  featured: z.enum(["true", "false"]).optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "name"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(48).default(12),
});

const inquirySchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  subject: z.string().trim().min(2).max(120),
  message: z.string().trim().min(10, "Tell us a little more").max(4000),
  company: z.string().optional(),
});

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().min(2).max(80),
  body: z.string().trim().min(10).max(2000),
});

const inquiryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many messages. Please try again later." },
});

const cardInclude = {
  category: true,
  images: { orderBy: { sortOrder: "asc" as const }, take: 8 },
  reviews: { select: { rating: true } },
};

export const catalogRouter = Router();

catalogRouter.get(
  "/categories",
  asyncRoute(async (_req, res) => {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: { where: { active: true } } } } },
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

catalogRouter.get(
  "/products",
  asyncRoute(async (req, res) => {
    const query = parseOrThrow(listSchema, req.query);
    const where: Prisma.ProductWhereInput = { active: true };
    if (query.category) where.category = { slug: query.category };
    if (query.featured === "true") where.featured = true;
    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: "insensitive" } },
        { description: { contains: query.q, mode: "insensitive" } },
        { sku: { contains: query.q, mode: "insensitive" } },
        { material: { contains: query.q, mode: "insensitive" } },
      ];
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      query.sort === "price_asc"
        ? { pricePaise: "asc" }
        : query.sort === "price_desc"
          ? { pricePaise: "desc" }
          : query.sort === "name"
            ? { name: "asc" }
            : { createdAt: "desc" };

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: cardInclude,
        orderBy,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);

    res.json({
      items: products.map(toProductCard),
      total,
      page: query.page,
      pageSize: query.pageSize,
    });
  }),
);

catalogRouter.get(
  "/products/:slug",
  asyncRoute(async (req, res) => {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug },
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
        reviews: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!product || !product.active) throw new HttpError(404, "Product not found");
    res.json({ product: toProductDetail(product) });
  }),
);

catalogRouter.post(
  "/products/:slug/reviews",
  requireAuth,
  asyncRoute(async (req, res) => {
    const body = parseOrThrow(reviewSchema, req.body);
    const product = await prisma.product.findUnique({ where: { slug: req.params.slug } });
    if (!product || !product.active) throw new HttpError(404, "Product not found");

    const purchased = await prisma.orderItem.findFirst({
      where: {
        productId: product.id,
        order: { userId: req.user!.id, paymentStatus: { in: ["PAID", "COD"] } },
      },
    });
    if (!purchased) {
      throw new HttpError(403, "You can review this after it has been ordered on your account");
    }

    const review = await prisma.review.upsert({
      where: { productId_userId: { productId: product.id, userId: req.user!.id } },
      update: body,
      create: { ...body, productId: product.id, userId: req.user!.id },
    });
    res.status(201).json({ review });
  }),
);

catalogRouter.post(
  "/inquiries",
  inquiryLimiter,
  asyncRoute(async (req, res) => {
    const body = parseOrThrow(inquirySchema, req.body);
    if (body.company) {
      res.status(201).json({ ok: true });
      return;
    }
    await prisma.inquiry.create({
      data: {
        name: body.name,
        email: body.email.toLowerCase(),
        phone: body.phone || null,
        subject: body.subject,
        message: body.message,
      },
    });
    res.status(201).json({ ok: true });
  }),
);
