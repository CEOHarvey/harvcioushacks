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

export function imageExtFromFilename(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith(".png")) return ".png";
  if (lower.endsWith(".webp")) return ".webp";
  if (lower.endsWith(".gif")) return ".gif";
  if (lower.endsWith(".jpeg") || lower.endsWith(".jpg")) return ".jpg";
  return ".jpg";
}
