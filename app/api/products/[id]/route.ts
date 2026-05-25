import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  imageExtFromType,
  normalizeDownloadUrl,
  parseFeatures,
} from "@/lib/product-form";
import { readProducts, writeProducts } from "@/lib/products";
import {
  deleteUploadedFile,
  saveUploadedFile,
  usesBlobStorage,
} from "@/lib/storage";

export const maxDuration = 60;

const MAX_IMAGE = 15 * 1024 * 1024;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (process.env.VERCEL === "1" && !usesBlobStorage()) {
    return NextResponse.json(
      { error: "Kailangan ng Blob storage para sa images." },
      { status: 503 }
    );
  }

  const { id } = await params;
  const products = await readProducts();
  const index = products.findIndex((p) => p.id === id);

  if (index === -1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const formData = await request.formData();
    const name = String(formData.get("name") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const featuresRaw = String(formData.get("features") || "");
    const downloadUrlRaw = String(formData.get("downloadUrl") || "");
    const imageFile = formData.get("image") as File | null;

    const downloadUrl = normalizeDownloadUrl(downloadUrlRaw);

    if (!name || !description || !downloadUrl) {
      return NextResponse.json(
        { error: "Name, description, and valid download link are required." },
        { status: 400 }
      );
    }

    const product = products[index];
    let imageFilename = product.imageFilename;

    if (imageFile && imageFile.size > 0) {
      const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!allowed.includes(imageFile.type)) {
        return NextResponse.json(
          { error: "Image must be JPEG, PNG, WebP, or GIF." },
          { status: 400 }
        );
      }
      if (imageFile.size > MAX_IMAGE) {
        return NextResponse.json(
          { error: "Image too large (max 15MB)." },
          { status: 400 }
        );
      }
      const newImageFilename = `${id}${imageExtFromType(imageFile.type)}`;
      if (newImageFilename !== imageFilename) {
        await deleteUploadedFile(imageFilename);
      }
      imageFilename = newImageFilename;
      await saveUploadedFile(
        imageFilename,
        Buffer.from(await imageFile.arrayBuffer()),
        imageFile.type
      );
    }

    products[index] = {
      ...product,
      name,
      description,
      features: parseFeatures(featuresRaw),
      downloadUrl,
      imageFilename,
      updatedAt: new Date().toISOString(),
    };

    await writeProducts(products);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Update error:", err);
    return NextResponse.json(
      { error: "Failed to update product." },
      { status: 500 }
    );
  }
}

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

  await deleteUploadedFile(removed.imageFilename);
  if (removed.exeFilename) {
    await deleteUploadedFile(removed.exeFilename);
  }

  return NextResponse.json({ success: true });
}
