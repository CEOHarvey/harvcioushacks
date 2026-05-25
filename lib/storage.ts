import { promises as fs } from "fs";
import path from "path";
import { del, get, list, put } from "@vercel/blob";
import { normalizeProduct } from "./product-form";
import { Product } from "./types";
import { PRODUCTS_FILE, UPLOADS_DIR } from "./paths";

const PRODUCTS_BLOB_KEY = "meta/products.json";
const FILE_PREFIX = "files/";
const BLOB_ACCESS = "private" as const;

export function usesBlobStorage(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function fileBlobKey(filename: string): string {
  return `${FILE_PREFIX}${filename}`;
}

async function streamToBuffer(
  stream: ReadableStream<Uint8Array>
): Promise<Buffer> {
  const arrayBuffer = await new Response(stream).arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function readBlobBuffer(pathname: string): Promise<Buffer | null> {
  try {
    const result = await get(pathname, { access: BLOB_ACCESS });
    if (!result || result.statusCode !== 200 || !result.stream) {
      return null;
    }
    return streamToBuffer(result.stream);
  } catch {
    return null;
  }
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
    if (!Array.isArray(parsed)) return [];
    return parsed.map((p) =>
      normalizeProduct(p as Record<string, unknown>)
    );
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
    const buffer = await readBlobBuffer(PRODUCTS_BLOB_KEY);
    if (!buffer) return [];
    const parsed = JSON.parse(buffer.toString("utf-8"));
    if (!Array.isArray(parsed)) return [];
    return parsed.map((p) =>
      normalizeProduct(p as Record<string, unknown>)
    );
  } catch {
    return [];
  }
}

async function writeProductsBlob(products: Product[]): Promise<void> {
  await put(PRODUCTS_BLOB_KEY, JSON.stringify(products), {
    access: BLOB_ACCESS,
    addRandomSuffix: false,
    allowOverwrite: true,
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

async function findBlobUrl(pathname: string): Promise<string | null> {
  const { blobs } = await list({ prefix: pathname, limit: 1 });
  return blobs[0]?.url ?? null;
}

export async function saveUploadedFile(
  filename: string,
  data: Buffer,
  contentType: string
): Promise<void> {
  if (usesBlobStorage()) {
    await put(fileBlobKey(filename), data, {
      access: BLOB_ACCESS,
      addRandomSuffix: false,
      allowOverwrite: true,
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
    return readBlobBuffer(fileBlobKey(filename));
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
