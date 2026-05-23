import { promises as fs } from "fs";
import path from "path";
import { del, list, put } from "@vercel/blob";
import { Product } from "./types";
import { PRODUCTS_FILE, UPLOADS_DIR } from "./paths";

const PRODUCTS_BLOB_KEY = "meta/products.json";
const FILE_PREFIX = "files/";

export function usesBlobStorage(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function fileBlobKey(filename: string): string {
  return `${FILE_PREFIX}${filename}`;
}

async function readProductsLocal(): Promise<Product[]> {
  try {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    try {
      await fs.access(PRODUCTS_FILE);
    } catch {
      await fs.writeFile(PRODUCTS_FILE, "[]", "utf-8");
    }
    const raw = await fs.readFile(PRODUCTS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Product[]) : [];
  } catch {
    return [];
  }
}

async function writeProductsLocal(products: Product[]): Promise<void> {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2), "utf-8");
}

async function readProductsBlob(): Promise<Product[]> {
  try {
    const { blobs } = await list({ prefix: PRODUCTS_BLOB_KEY, limit: 1 });
    if (blobs.length === 0) return [];
    const res = await fetch(blobs[0].url, { cache: "no-store" });
    if (!res.ok) return [];
    const parsed = await res.json();
    return Array.isArray(parsed) ? (parsed as Product[]) : [];
  } catch {
    return [];
  }
}

async function writeProductsBlob(products: Product[]): Promise<void> {
  await put(PRODUCTS_BLOB_KEY, JSON.stringify(products), {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/json",
  });
}

export async function readProducts(): Promise<Product[]> {
  if (usesBlobStorage()) return readProductsBlob();
  return readProductsLocal();
}

export async function writeProducts(products: Product[]): Promise<void> {
  if (usesBlobStorage()) {
    await writeProductsBlob(products);
    return;
  }
  await writeProductsLocal(products);
}

async function findBlobUrl(key: string): Promise<string | null> {
  const { blobs } = await list({ prefix: key, limit: 1 });
  return blobs[0]?.url ?? null;
}

export async function saveUploadedFile(
  filename: string,
  data: Buffer,
  contentType: string
): Promise<void> {
  if (usesBlobStorage()) {
    await put(fileBlobKey(filename), data, {
      access: "public",
      addRandomSuffix: false,
      contentType,
    });
    return;
  }
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOADS_DIR, filename), data);
}

export async function readUploadedFile(
  filename: string
): Promise<Buffer | null> {
  if (usesBlobStorage()) {
    const url = await findBlobUrl(fileBlobKey(filename));
    if (!url) return null;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  }
  try {
    return await fs.readFile(path.join(UPLOADS_DIR, filename));
  } catch {
    return null;
  }
}

export async function deleteUploadedFile(filename: string): Promise<void> {
  if (usesBlobStorage()) {
    const url = await findBlobUrl(fileBlobKey(filename));
    if (url) await del(url);
    return;
  }
  try {
    await fs.unlink(path.join(UPLOADS_DIR, filename));
  } catch {
    /* missing file */
  }
}
