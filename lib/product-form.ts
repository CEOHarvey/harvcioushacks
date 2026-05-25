import type { Product } from "./types";

export function parseFeatures(featuresRaw: string): string[] {
  return featuresRaw
    .split("\n")
    .map((f) => f.trim())
    .filter(Boolean);
}

export function imageExtFromType(type: string): string {
  if (type === "image/png") return ".png";
  if (type === "image/webp") return ".webp";
  if (type === "image/gif") return ".gif";
  return ".jpg";
}

export function normalizeDownloadUrl(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  if (raw.startsWith("/")) return null;

  try {
    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const url = new URL(withProtocol);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function getProductDownloadUrl(product: Product): string {
  if (product.downloadUrl?.trim()) return product.downloadUrl.trim();
  if (product.exeFilename) return `/api/products/${product.id}/download`;
  return "";
}

export function normalizeProduct(raw: Record<string, unknown>): Product {
  const features = raw.features;
  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? ""),
    description: String(raw.description ?? ""),
    features: Array.isArray(features)
      ? features.map((f) => String(f))
      : [],
    imageFilename: String(raw.imageFilename ?? ""),
    downloadUrl: String(raw.downloadUrl ?? ""),
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    updatedAt: String(raw.updatedAt ?? new Date().toISOString()),
    exeFilename:
      typeof raw.exeFilename === "string" ? raw.exeFilename : undefined,
    originalExeName:
      typeof raw.originalExeName === "string" ? raw.originalExeName : undefined,
  };
}
