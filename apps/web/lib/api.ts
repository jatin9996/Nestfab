export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function apiBase() {
  return BASE;
}

export async function api<T>(path: string, options: RequestInit & { token?: string | null } = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (options.token) headers.set("Authorization", `Bearer ${options.token}`);

  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  const data = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) {
    throw new ApiError(response.status, data.error || "Something went wrong");
  }
  return data as T;
}

export async function uploadMedia(file: File, token: string) {
  const body = new FormData();
  body.append("file", file);
  const response = await fetch(`${BASE}/api/admin/media`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body,
  });
  const data = (await response.json().catch(() => ({}))) as { error?: string; url?: string; kind?: "IMAGE" | "VIDEO" };
  if (!response.ok || !data.url || !data.kind) {
    throw new ApiError(response.status, data.error || "Upload failed");
  }
  return { url: data.url, kind: data.kind };
}
