import path from "path";

export const DATA_DIR = path.join(process.cwd(), "data");
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
export const PRODUCTS_FILE = path.join(DATA_DIR, "products.json");
