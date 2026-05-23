import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { readProducts, toPublicProduct } from "@/lib/products";

export async function GET() {
  const products = (await readProducts()).map(toPublicProduct);
  return NextResponse.json(products);
}

export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(
    { error: "Use multipart form at POST /api/products/upload" },
    { status: 400 }
  );
}
