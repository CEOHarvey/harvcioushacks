export interface Product {
  id: string;
  name: string;
  description: string;
  features: string[];
  imageFilename: string;
  downloadUrl: string;
  createdAt: string;
  updatedAt: string;
  /** @deprecated Legacy hosted EXE — use downloadUrl */
  exeFilename?: string;
  originalExeName?: string;
}

export type ProductPublic = Product;
