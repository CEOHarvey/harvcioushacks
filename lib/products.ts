import { getProductDownloadUrl } from "./product-form";
import { Product, ProductPublic } from "./types";
import { readProducts, writeProducts } from "./storage";

export { readProducts, writeProducts };

export function toPublicProduct(p: Product): ProductPublic {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    features: p.features,
    imageFilename: p.imageFilename,
    downloadUrl: getProductDownloadUrl(p),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const products = await readProducts();
  return products.find((p) => p.id === id);
}
