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

import type { Product } from "./types";

export function normalizeDownloadUrl(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function getProductDownloadUrl(product: Product): string {
  if (product.downloadUrl) return product.downloadUrl;
  if (product.exeFilename) return `/api/products/${product.id}/download`;
  return "";
}
