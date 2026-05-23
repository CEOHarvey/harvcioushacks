import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  getProductById,
  readProducts,
  uploadPath,
  writeProducts,
} from "@/lib/products";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const products = await readProducts();
  const index = products.findIndex((p) => p.id === id);

  if (index === -1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [removed] = products.splice(index, 1);
  await writeProducts(products);

  try {
    await fs.unlink(uploadPath(removed.exeFilename));
    await fs.unlink(uploadPath(removed.imageFilename));
  } catch {
    /* files may already be missing */
  }

  return NextResponse.json({ success: true });
}
