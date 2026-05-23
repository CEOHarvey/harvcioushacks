export interface Product {
  id: string;
  name: string;
  description: string;
  features: string[];
  imageFilename: string;
  exeFilename: string;
  originalExeName: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductPublic extends Omit<Product, "exeFilename"> {}
