import { Product, ProductPublic } from "./types";
import { readProducts, writeProducts } from "./storage";

export { readProducts, writeProducts };

export function toPublicProduct(p: Product): ProductPublic {
  const { exeFilename: _, ...rest } = p;
  return rest;
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const products = await readProducts();
  return products.find((p) => p.id === id);
}
