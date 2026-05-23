import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { readProducts, toPublicProduct } from "@/lib/products";

export async function GET() {
  const products = await readProducts();
  const isAdmin = await isAdminAuthenticated();
  if (isAdmin) {
    return NextResponse.json(products);
  }
  return NextResponse.json(products.map(toPublicProduct));
}

export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(
    { error: "Use POST /api/products/upload" },
    { status: 400 }
  );
}
