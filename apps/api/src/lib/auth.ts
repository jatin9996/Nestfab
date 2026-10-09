import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";
import { env } from "../env";

const TOKEN_TTL = "7d";

export type TokenPayload = {
  sub: string;
  email: string;
  role: Role;
};

export function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: TokenPayload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: TOKEN_TTL });
}

export function readToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded === "string" || !decoded.sub || !decoded.email || !decoded.role) {
    throw new Error("Invalid token");
  }
  return {
    sub: decoded.sub,
    email: decoded.email,
    role: decoded.role as Role,
  };
}
