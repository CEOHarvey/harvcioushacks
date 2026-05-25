import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { isAdminAuthenticated } from "@/lib/auth";
import { imageExtFromType, parseFeatures } from "@/lib/product-form";
import { readProducts, writeProducts } from "@/lib/products";
import {
  deleteUploadedFile,
  readUploadedFile,
  saveUploadedFile,
  usesBlobStorage,
} from "@/lib/storage";

export const maxDuration = 60;

const MAX_EXE = 100 * 1024 * 1024;
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
      {
        error:
          "Kailangan ng Blob storage. Vercel → Storage → Blob → Connect → Redeploy.",
      },
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
    const exePreUploaded = formData.get("exePreUploaded") === "1";
    const exeFile = formData.get("exe") as File | null;
    const imageFile = formData.get("image") as File | null;

    if (!name || !description) {
      return NextResponse.json(
        { error: "Name and description are required." },
        { status: 400 }
      );
    }

    const product = products[index];
    let exeFilename = product.exeFilename;
    let imageFilename = product.imageFilename;
    let originalExeName = product.originalExeName;

    if (exePreUploaded) {
      const newExeFilename = String(formData.get("exeFilename") || "");
      const newOriginal = String(formData.get("originalExeName") || "");
      if (!newExeFilename || !newOriginal) {
        return NextResponse.json(
          { error: "EXE upload incomplete." },
          { status: 400 }
        );
      }
      const exists = await readUploadedFile(newExeFilename);
      if (!exists) {
        return NextResponse.json(
          { error: "EXE not found. Upload ulit ang EXE." },
          { status: 400 }
        );
      }
      if (newExeFilename !== exeFilename) {
        await deleteUploadedFile(exeFilename);
      }
      exeFilename = newExeFilename;
      originalExeName = newOriginal;
    } else if (exeFile && exeFile.size > 0) {
      if (!exeFile.name.toLowerCase().endsWith(".exe")) {
        return NextResponse.json(
          { error: "EXE file must have .exe extension." },
          { status: 400 }
        );
      }
      if (exeFile.size > MAX_EXE) {
        return NextResponse.json(
          { error: "EXE file too large (max 100MB)." },
          { status: 400 }
        );
      }
      const exeExt = path.extname(exeFile.name) || ".exe";
      const newExeFilename = `${id}${exeExt}`;
      if (newExeFilename !== exeFilename) {
        await deleteUploadedFile(exeFilename);
      }
      exeFilename = newExeFilename;
      originalExeName = exeFile.name;
      await saveUploadedFile(
        exeFilename,
        Buffer.from(await exeFile.arrayBuffer()),
        "application/octet-stream"
      );
    }

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
      exeFilename,
      imageFilename,
      originalExeName,
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

  await deleteUploadedFile(removed.exeFilename);
  await deleteUploadedFile(removed.imageFilename);

  return NextResponse.json({ success: true });
}
