import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { hashPassword, signToken, verifyPassword } from "../lib/auth";
import { asyncRoute, parseOrThrow } from "../lib/http";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please wait a few minutes." },
});

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80),
  email: z.string().trim().email("Enter a valid email").max(160),
  password: z.string().min(8, "Use at least 8 characters").max(72),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a 10-digit mobile number")
    .optional()
    .or(z.literal("")),
});

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

function publicUser(user: { id: string; email: string; name: string; phone: string | null; role: "CUSTOMER" | "ADMIN" }) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
  };
}

export const authRouter = Router();

authRouter.post(
  "/register",
  authLimiter,
  asyncRoute(async (req, res) => {
    const body = parseOrThrow(registerSchema, req.body);
    const existing = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
    if (existing) {
      res.status(409).json({ error: "An account with this email already exists. Sign in instead." });
      return;
    }
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email.toLowerCase(),
        passwordHash: await hashPassword(body.password),
        phone: body.phone || null,
      },
    });
    const token = signToken({ sub: user.id, email: user.email, role: user.role });
    res.status(201).json({ token, user: publicUser(user) });
  }),
);

authRouter.post(
  "/login",
  authLimiter,
  asyncRoute(async (req, res) => {
    const body = parseOrThrow(loginSchema, req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      res.status(401).json({ error: "Email or password is incorrect" });
      return;
    }
    const token = signToken({ sub: user.id, email: user.email, role: user.role });
    res.json({ token, user: publicUser(user) });
  }),
);

authRouter.get(
  "/me",
  requireAuth,
  asyncRoute(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      res.status(401).json({ error: "Please sign in again" });
      return;
    }
    res.json({ user: publicUser(user) });
  }),
);
