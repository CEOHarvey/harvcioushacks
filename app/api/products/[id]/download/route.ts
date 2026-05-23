import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import { getProductById, uploadPath } from "@/lib/products";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const filePath = uploadPath(product.exeFilename);

  try {
    const buffer = await fs.readFile(filePath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(product.originalExeName)}"`,
        "Content-Length": String(buffer.length),
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
