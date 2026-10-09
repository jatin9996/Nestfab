import crypto from "node:crypto";
import { Prisma, type PaymentMethod } from "@prisma/client";
import { codDecision } from "./cod";
import { HttpError } from "./http";
import { discountFor, totals } from "./pricing";
import { coverImage } from "./media";
import { prisma } from "./prisma";

export type QuoteItem = { productId: string; quantity: number };

export type CheckoutInput = {
  email: string;
  phone: string;
  items: QuoteItem[];
  couponCode?: string;
  paymentMethod: PaymentMethod;
  customerNote?: string;
  gstin?: string;
  saveAddress?: boolean;
  address: {
    fullName: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
};

const productInclude = {
  images: { orderBy: { sortOrder: "asc" as const }, take: 8 },
};

function codSummary(lines: { product: { name: string; codAllowed: boolean } }[]) {
  const decision = codDecision(lines.map((line) => ({ name: line.product.name, codAllowed: line.product.codAllowed })));
  return { codAllowed: decision.allowed, codBlocked: decision.blocked };
}

function makeOrderNumber() {
  const now = new Date();
  const year = String(now.getFullYear()).slice(2);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `NF${year}${month}${rand}`;
}

async function loadLines(items: QuoteItem[]) {
  const ids = [...new Set(items.map((item) => item.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    include: productInclude,
  });
  const byId = new Map(products.map((product) => [product.id, product]));
  return items.map((item) => {
    const product = byId.get(item.productId);
    if (!product || !product.active) {
      throw new HttpError(400, "A product in your cart is no longer available");
    }
    if (item.quantity > product.stock) {
      throw new HttpError(400, product.stock === 0 ? `${product.name} is out of stock` : `${product.name} has only ${product.stock} left`);
    }
    return { product, quantity: item.quantity };
  });
}

async function priceLines(lines: Awaited<ReturnType<typeof loadLines>>, couponCode?: string) {
  const subtotalPaise = lines.reduce((sum, line) => sum + line.product.pricePaise * line.quantity, 0);
  let discountPaise = 0;
  let appliedCode: string | null = null;

  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode.toUpperCase() } });
    if (!coupon) throw new HttpError(400, "Coupon not found");
    const result = discountFor(subtotalPaise, coupon);
    if (result.error) throw new HttpError(400, result.error);
    discountPaise = result.discountPaise;
    appliedCode = coupon.code;
  }

  return { ...totals(subtotalPaise, discountPaise), couponCode: appliedCode };
}

export async function quoteOrder(items: QuoteItem[], couponCode?: string) {
  const lines = await loadLines(items);
  const priced = await priceLines(lines, couponCode);
  return {
    lines: lines.map((line) => ({
      productId: line.product.id,
      name: line.product.name,
      slug: line.product.slug,
      quantity: line.quantity,
      unitPaise: line.product.pricePaise,
      linePaise: line.product.pricePaise * line.quantity,
      imageUrl: coverImage(line.product.images)?.url ?? null,
      stock: line.product.stock,
      codAllowed: line.product.codAllowed,
    })),
    ...priced,
    ...codSummary(lines),
  };
}

export async function createOrder(input: CheckoutInput, userId?: string) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(async (tx) => {
        const ids = [...new Set(input.items.map((item) => item.productId))];
        const products = await tx.product.findMany({
          where: { id: { in: ids } },
          include: productInclude,
        });
        const byId = new Map(products.map((product) => [product.id, product]));
        const lines = input.items.map((item) => {
          const product = byId.get(item.productId);
          if (!product || !product.active) {
            throw new HttpError(400, "A product in your cart is no longer available");
          }
          return { product, quantity: item.quantity };
        });

        if (input.paymentMethod === "COD") {
          const cod = codDecision(lines.map((line) => ({ name: line.product.name, codAllowed: line.product.codAllowed })));
          if (!cod.allowed) throw new HttpError(400, cod.message || "Cash on delivery is not available for this order");
        }

        const subtotalPaise = lines.reduce((sum, line) => sum + line.product.pricePaise * line.quantity, 0);
        let discountPaise = 0;
        let appliedCode: string | null = null;
        if (input.couponCode) {
          const coupon = await tx.coupon.findUnique({ where: { code: input.couponCode.toUpperCase() } });
          if (!coupon) throw new HttpError(400, "Coupon not found");
          const result = discountFor(subtotalPaise, coupon);
          if (result.error) throw new HttpError(400, result.error);
          discountPaise = result.discountPaise;
          appliedCode = coupon.code;
        }
        const money = totals(subtotalPaise, discountPaise);

        for (const line of lines) {
          const updated = await tx.product.updateMany({
            where: { id: line.product.id, active: true, stock: { gte: line.quantity } },
            data: { stock: { decrement: line.quantity } },
          });
          if (updated.count !== 1) {
            throw new HttpError(409, `${line.product.name} just sold out. Refresh your cart and try again.`);
          }
        }

        const isCod = input.paymentMethod === "COD";
        const order = await tx.order.create({
          data: {
            orderNumber: makeOrderNumber(),
            accessToken: crypto.randomBytes(24).toString("hex"),
            userId,
            email: input.email.toLowerCase(),
            phone: input.phone,
            status: isCod ? "CONFIRMED" : "PENDING",
            paymentStatus: isCod ? "COD" : "PENDING",
            paymentMethod: input.paymentMethod,
            subtotalPaise: money.subtotalPaise,
            discountPaise: money.discountPaise,
            shippingPaise: money.shippingPaise,
            totalPaise: money.totalPaise,
            couponCode: appliedCode,
            shippingName: input.address.fullName,
            shippingLine1: input.address.line1,
            shippingLine2: input.address.line2 || null,
            shippingCity: input.address.city,
            shippingState: input.address.state,
            shippingPincode: input.address.pincode,
            gstin: input.gstin || null,
            customerNote: input.customerNote || null,
            items: {
              create: lines.map((line) => ({
                productId: line.product.id,
                name: line.product.name,
                sku: line.product.sku,
                pricePaise: line.product.pricePaise,
                quantity: line.quantity,
                imageUrl: coverImage(line.product.images)?.url ?? null,
              })),
            },
          },
          include: { items: true },
        });

        if (userId && input.saveAddress) {
          await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
          await tx.address.create({
            data: {
              userId,
              fullName: input.address.fullName,
              phone: input.address.phone,
              line1: input.address.line1,
              line2: input.address.line2 || null,
              city: input.address.city,
              state: input.address.state,
              pincode: input.address.pincode,
              isDefault: true,
            },
          });
        }

        return order;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002" && attempt < 2) {
        continue;
      }
      throw error;
    }
  }
  throw new HttpError(500, "Could not create the order. Please try again.");
}

export async function releaseStock(orderId: string) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order || order.stockRestored) return;
    for (const item of order.items) {
      if (!item.productId) continue;
      await tx.product.updateMany({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }
    await tx.order.update({
      where: { id: orderId },
      data: { stockRestored: true },
    });
  });
}

export function assertOrderAccess(
  order: { userId: string | null; accessToken: string },
  actor: { userId?: string; role?: string; token?: string },
) {
  if (actor.role === "ADMIN") return;
  if (actor.userId && order.userId === actor.userId) return;
  if (actor.token && actor.token === order.accessToken) return;
  throw new HttpError(404, "Order not found");
}

export function publicOrder(order: {
  orderNumber: string;
  accessToken: string;
  email: string;
  phone: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  totalPaise: number;
  couponCode: string | null;
  shippingName: string;
  shippingLine1: string;
  shippingLine2: string | null;
  shippingCity: string;
  shippingState: string;
  shippingPincode: string;
  gstin: string | null;
  customerNote: string | null;
  razorpayOrderId: string | null;
  createdAt: Date;
  items: {
    id: string;
    name: string;
    sku: string;
    pricePaise: number;
    quantity: number;
    imageUrl: string | null;
  }[];
}) {
  return {
    orderNumber: order.orderNumber,
    accessToken: order.accessToken,
    email: order.email,
    phone: order.phone,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    subtotalPaise: order.subtotalPaise,
    discountPaise: order.discountPaise,
    shippingPaise: order.shippingPaise,
    totalPaise: order.totalPaise,
    couponCode: order.couponCode,
    shippingName: order.shippingName,
    shippingLine1: order.shippingLine1,
    shippingLine2: order.shippingLine2,
    shippingCity: order.shippingCity,
    shippingState: order.shippingState,
    shippingPincode: order.shippingPincode,
    gstin: order.gstin,
    customerNote: order.customerNote,
    razorpayOrderId: order.razorpayOrderId,
    createdAt: order.createdAt,
    items: order.items.map((item) => ({
      id: item.id,
      name: item.name,
      sku: item.sku,
      pricePaise: item.pricePaise,
      quantity: item.quantity,
      imageUrl: item.imageUrl,
    })),
  };
}
