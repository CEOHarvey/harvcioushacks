import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { isAdminAuthenticated } from "@/lib/auth";
import { imageExtFromType, parseFeatures } from "@/lib/product-form";
import { readProducts, writeProducts } from "@/lib/products";
import { readUploadedFile, saveUploadedFile, usesBlobStorage } from "@/lib/storage";
import { Product } from "@/lib/types";

export const maxDuration = 60;

const MAX_EXE = 100 * 1024 * 1024;
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
          "Kailangan ng Blob storage. Vercel → Storage → Blob → Connect → Redeploy.",
      },
      { status: 503 }
    );
  }

  try {
    const formData = await request.formData();
    const name = String(formData.get("name") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const featuresRaw = String(formData.get("features") || "");
    const exePreUploaded = formData.get("exePreUploaded") === "1";
    const productId = String(formData.get("productId") || "") || uuidv4();
    const exeFile = formData.get("exe") as File | null;
    const imageFile = formData.get("image") as File | null;

    if (!name || !description || !imageFile) {
      return NextResponse.json(
        { error: "Name, description, and image are required." },
        { status: 400 }
      );
    }

    let exeFilename: string;
    let originalExeName: string;

    if (exePreUploaded) {
      exeFilename = String(formData.get("exeFilename") || "");
      originalExeName = String(formData.get("originalExeName") || "");
      if (!exeFilename || !originalExeName) {
        return NextResponse.json(
          { error: "EXE upload incomplete. Subukan ulit." },
          { status: 400 }
        );
      }
      const exists = await readUploadedFile(exeFilename);
      if (!exists) {
        return NextResponse.json(
          { error: "EXE file not found on server. Upload ulit ang EXE." },
          { status: 400 }
        );
      }
    } else {
      if (!exeFile) {
        return NextResponse.json(
          { error: "EXE file is required." },
          { status: 400 }
        );
      }
      if (!exeFile.name.toLowerCase().endsWith(".exe")) {
        return NextResponse.json(
          { error: "EXE file must have .exe extension." },
          { status: 400 }
        );
      }
      if (exeFile.size > MAX_EXE) {
        return NextResponse.json(
          {
            error: `EXE masyadong malaki (${(exeFile.size / 1024 / 1024).toFixed(1)}MB). Max 100MB.`,
          },
          { status: 400 }
        );
      }
      const exeExt = path.extname(exeFile.name) || ".exe";
      exeFilename = `${productId}${exeExt}`;
      originalExeName = exeFile.name;
      const exeBuffer = Buffer.from(await exeFile.arrayBuffer());
      await saveUploadedFile(
        exeFilename,
        exeBuffer,
        "application/octet-stream"
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

    const imageExt = imageExtFromType(imageFile.type);
    const imageFilename = `${productId}${imageExt}`;
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    await saveUploadedFile(imageFilename, imageBuffer, imageFile.type);

    const now = new Date().toISOString();
    const product: Product = {
      id: productId,
      name,
      description,
      features: parseFeatures(featuresRaw),
      imageFilename,
      exeFilename,
      originalExeName,
      createdAt: now,
      updatedAt: now,
    };

    const products = await readProducts();
    products.push(product);
    await writeProducts(products);

    return NextResponse.json({ success: true, id: productId });
  } catch (err) {
    console.error("Upload error:", err);
    const msg = err instanceof Error ? err.message : "Upload failed.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
