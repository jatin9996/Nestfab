import { Router } from "express";
import { z } from "zod";
import { asyncRoute, HttpError, parseOrThrow } from "../lib/http";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const profileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a 10-digit mobile number")
    .optional()
    .or(z.literal("")),
});

const addressSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a 10-digit mobile number"),
  line1: z.string().trim().min(4).max(160),
  line2: z.string().trim().max(160).optional().or(z.literal("")),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  pincode: z.string().trim().regex(/^\d{6}$/, "Enter a 6-digit pincode"),
  isDefault: z.boolean().optional(),
});

export const accountRouter = Router();
accountRouter.use(requireAuth);

accountRouter.patch(
  "/profile",
  asyncRoute(async (req, res) => {
    const body = parseOrThrow(profileSchema, req.body);
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { name: body.name, phone: body.phone || null },
    });
    res.json({
      user: { id: user.id, email: user.email, name: user.name, phone: user.phone, role: user.role },
    });
  }),
);

accountRouter.get(
  "/addresses",
  asyncRoute(async (req, res) => {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user!.id },
      orderBy: [{ isDefault: "desc" }, { id: "desc" }],
    });
    res.json({ addresses });
  }),
);

accountRouter.post(
  "/addresses",
  asyncRoute(async (req, res) => {
    const body = parseOrThrow(addressSchema, req.body);
    if (body.isDefault) {
      await prisma.address.updateMany({ where: { userId: req.user!.id }, data: { isDefault: false } });
    }
    const address = await prisma.address.create({
      data: {
        userId: req.user!.id,
        fullName: body.fullName,
        phone: body.phone,
        line1: body.line1,
        line2: body.line2 || null,
        city: body.city,
        state: body.state,
        pincode: body.pincode,
        isDefault: body.isDefault ?? false,
      },
    });
    res.status(201).json({ address });
  }),
);

accountRouter.delete(
  "/addresses/:id",
  asyncRoute(async (req, res) => {
    const address = await prisma.address.findUnique({ where: { id: req.params.id } });
    if (!address || address.userId !== req.user!.id) throw new HttpError(404, "Address not found");
    await prisma.address.delete({ where: { id: address.id } });
    res.json({ ok: true });
  }),
);
