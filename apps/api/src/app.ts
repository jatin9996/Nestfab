import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./env";
import { uploadDir } from "./lib/media";
import { errorHandler } from "./middleware/error";
import { accountRouter } from "./routes/account";
import { adminRouter } from "./routes/admin";
import { authRouter } from "./routes/auth";
import { catalogRouter } from "./routes/catalog";
import { ordersRouter } from "./routes/orders";
import { paymentsRouter, paymentsWebhook } from "./routes/payments";

export function createApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use("/uploads", express.static(uploadDir, { maxAge: "7d", index: false }));
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );

  app.post("/api/payments/webhook", express.raw({ type: "application/json" }), paymentsWebhook);
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "nestfab-api" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api", catalogRouter);
  app.use("/api/orders", ordersRouter);
  app.use("/api/payments", paymentsRouter);
  app.use("/api/account", accountRouter);
  app.use("/api/admin", adminRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });
  app.use(errorHandler);
  return app;
}
