import { promises as fs } from "fs";
import path from "path";
import { Product, ProductPublic } from "./types";
import { DATA_DIR, PRODUCTS_FILE, UPLOADS_DIR } from "./paths";

async function ensureDataDir() {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  try {
    await fs.access(PRODUCTS_FILE);
  } catch {
    await fs.writeFile(PRODUCTS_FILE, "[]", "utf-8");
  }
}

export async function readProducts(): Promise<Product[]> {
  await ensureDataDir();
  const raw = await fs.readFile(PRODUCTS_FILE, "utf-8");
  return JSON.parse(raw) as Product[];
}

export async function writeProducts(products: Product[]) {
  await ensureDataDir();
  await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2), "utf-8");
}

export function toPublicProduct(p: Product): ProductPublic {
  const { exeFilename: _, ...rest } = p;
  return rest;
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const products = await readProducts();
  return products.find((p) => p.id === id);
}

export function uploadPath(filename: string) {
  return path.join(UPLOADS_DIR, filename);
}
