import type { NextFunction, Request, Response } from "express";
import { z, type ZodSchema } from "zod";

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type Handler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export function asyncRoute(fn: Handler) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

export function parseOrThrow<S extends ZodSchema>(schema: S, data: unknown): z.infer<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new HttpError(400, result.error.issues[0]?.message ?? "Invalid input");
  }
  return result.data;
}
