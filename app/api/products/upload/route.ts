import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  imageExtFromType,
  normalizeDownloadUrl,
  parseFeatures,
} from "@/lib/product-form";
import { readProducts, writeProducts } from "@/lib/products";
import { saveUploadedFile, usesBlobStorage } from "@/lib/storage";
import { Product } from "@/lib/types";

export const maxDuration = 60;

const MAX_IMAGE = 15 * 1024 * 1024;

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json(
      { error: "Hindi ka naka-login. Login ulit gamit ang ADMIN_PASSWORD." },
      { status: 401 }
    );
  }

  if (process.env.VERCEL === "1" && !usesBlobStorage()) {
    return NextResponse.json(
      {
        error:
          "Kailangan ng Blob para sa image. Vercel → Storage → Blob → Connect → Redeploy.",
      },
      { status: 503 }
    );
  }

  try {
    const formData = await request.formData();
    const name = String(formData.get("name") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const featuresRaw = String(formData.get("features") || "");
    const downloadUrlRaw = String(formData.get("downloadUrl") || "");
    const imageFile = formData.get("image") as File | null;

    const downloadUrl = normalizeDownloadUrl(downloadUrlRaw);

    if (!name || !description || !downloadUrl || !imageFile) {
      return NextResponse.json(
        {
          error:
            "Kailangan ang pangalan, description, download link (https://...), at image.",
        },
        { status: 400 }
      );
    }

    if (imageFile.size > MAX_IMAGE) {
      return NextResponse.json(
        { error: "Image too large (max 15MB)." },
        { status: 400 }
      );
    }

    const allowedImageTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    if (!allowedImageTypes.includes(imageFile.type)) {
      return NextResponse.json(
        { error: "Image must be JPEG, PNG, WebP, or GIF." },
        { status: 400 }
      );
    }

    const id = uuidv4();
    const imageExt = imageExtFromType(imageFile.type);
    const imageFilename = `${id}${imageExt}`;
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    await saveUploadedFile(imageFilename, imageBuffer, imageFile.type);

    const now = new Date().toISOString();
    const product: Product = {
      id,
      name,
      description,
      features: parseFeatures(featuresRaw),
      imageFilename,
      downloadUrl,
      createdAt: now,
      updatedAt: now,
    };

    const products = await readProducts();
    products.push(product);
    await writeProducts(products);

    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error("Upload error:", err);
    const msg = err instanceof Error ? err.message : "Upload failed.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
