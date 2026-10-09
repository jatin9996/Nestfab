import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { Request } from "express";
import multer from "multer";
import { HttpError } from "./http";

export const uploadDir = path.join(process.cwd(), "uploads");

const IMAGE_LIMIT = 6 * 1024 * 1024;
const VIDEO_LIMIT = 40 * 1024 * 1024;

const types: Record<string, { ext: string; kind: "IMAGE" | "VIDEO" }> = {
  "image/jpeg": { ext: ".jpg", kind: "IMAGE" },
  "image/png": { ext: ".png", kind: "IMAGE" },
  "image/webp": { ext: ".webp", kind: "IMAGE" },
  "image/gif": { ext: ".gif", kind: "IMAGE" },
  "video/mp4": { ext: ".mp4", kind: "VIDEO" },
  "video/webm": { ext: ".webm", kind: "VIDEO" },
};

export function mediaSpec(mime: string) {
  return types[mime];
}

export const mediaUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      fs.mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
      const spec = types[file.mimetype];
      cb(null, `${randomBytes(16).toString("hex")}${spec?.ext ?? ""}`);
    },
  }),
  limits: { fileSize: VIDEO_LIMIT, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!types[file.mimetype]) {
      cb(new HttpError(400, "Upload a JPG, PNG, WEBP, GIF, MP4, or WEBM file"));
      return;
    }
    cb(null, true);
  },
});

export function rejectOversized(file: Express.Multer.File) {
  const spec = types[file.mimetype];
  if (spec?.kind === "IMAGE" && file.size > IMAGE_LIMIT) {
    fs.unlink(file.path, () => undefined);
    throw new HttpError(400, "Photos can be up to 6 MB");
  }
}

export function publicFileUrl(req: Request, filename: string) {
  return `${req.protocol}://${req.get("host")}/uploads/${filename}`;
}

type MediaInput = { url: string; alt?: string; kind?: "IMAGE" | "VIDEO" };

export function orderedMedia(name: string, items: MediaInput[]) {
  const photos = items.filter((item) => (item.kind ?? "IMAGE") === "IMAGE");
  const videos = items.filter((item) => item.kind === "VIDEO");
  if (photos.length > 8) throw new HttpError(400, "A product can have up to 8 photos");
  if (videos.length > 1) throw new HttpError(400, "A product can have one video");
  return [...photos, ...videos].map((item, index) => ({
    url: item.url,
    alt: item.alt || name,
    kind: item.kind ?? "IMAGE",
    sortOrder: index,
  }));
}

export function coverImage<T extends { url: string; alt?: string | null; kind?: string | null }>(images: T[]) {
  return images.find((image) => image.kind !== "VIDEO") ?? null;
}
