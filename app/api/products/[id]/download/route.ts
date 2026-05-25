import { NextRequest, NextResponse } from "next/server";
import { getProductById } from "@/lib/products";
import { readUploadedFile } from "@/lib/storage";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (product.downloadUrl) {
    return NextResponse.redirect(product.downloadUrl);
  }

  if (!product.exeFilename) {
    return NextResponse.json({ error: "No download available" }, { status: 404 });
  }

  const buffer = await readUploadedFile(product.exeFilename);
  if (!buffer) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const filename = product.originalExeName || "download.exe";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
      "Content-Length": String(buffer.length),
      "Cache-Control": "no-store",
    },
  });
}
