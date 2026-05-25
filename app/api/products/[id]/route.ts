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

async function applyProductUpdate(
  index: number,
  products: Awaited<ReturnType<typeof readProducts>>,
  data: {
    name: string;
    description: string;
    features: string[];
    downloadUrl: string;
    imageFilename: string;
  }
) {
  const product = products[index];
  products[index] = {
    ...product,
    name: data.name,
    description: data.description,
    features: data.features,
    downloadUrl: data.downloadUrl,
    imageFilename: data.imageFilename,
    updatedAt: new Date().toISOString(),
    exeFilename: undefined,
    originalExeName: undefined,
  };
  await writeProducts(products);
}

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

  const product = products[index];
  const contentType = request.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      const body = await request.json();
      const name = String(body.name || "").trim();
      const description = String(body.description || "").trim();
      const downloadUrlRaw = String(body.downloadUrl || "");
      const features = Array.isArray(body.features)
        ? body.features.map((f: unknown) => String(f).trim()).filter(Boolean)
        : parseFeatures(String(body.features || ""));

      const downloadUrl = normalizeDownloadUrl(downloadUrlRaw);
      if (!name || !description || !downloadUrl) {
        return NextResponse.json(
          {
            error:
              "Kailangan ang pangalan, description, at valid download link (https://...).",
          },
          { status: 400 }
        );
      }

      await applyProductUpdate(index, products, {
        name,
        description,
        features,
        downloadUrl,
        imageFilename: product.imageFilename,
      });

      return NextResponse.json({ success: true });
    }

    const formData = await request.formData();
    const name = String(formData.get("name") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const featuresRaw = String(formData.get("features") || "");
    const downloadUrlRaw = String(formData.get("downloadUrl") || "");
    const imageFile = formData.get("image") as File | null;

    const downloadUrl = normalizeDownloadUrl(downloadUrlRaw);
    if (!name || !description || !downloadUrl) {
      return NextResponse.json(
        {
          error:
            "Kailangan ang pangalan, description, at valid download link (https://...).",
        },
        { status: 400 }
      );
    }

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
        try {
          await deleteUploadedFile(imageFilename);
        } catch {
          /* old image may already be gone */
        }
      }
      imageFilename = newImageFilename;
      await saveUploadedFile(
        imageFilename,
        Buffer.from(await imageFile.arrayBuffer()),
        imageFile.type
      );
    }

    await applyProductUpdate(index, products, {
      name,
      description,
      features: parseFeatures(featuresRaw),
      downloadUrl,
      imageFilename,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Update error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Hindi ma-update: ${msg}` },
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

  try {
    await deleteUploadedFile(removed.imageFilename);
  } catch {
    /* ignore */
  }
  if (removed.exeFilename) {
    try {
      await deleteUploadedFile(removed.exeFilename);
    } catch {
      /* ignore */
    }
  }

  return NextResponse.json({ success: true });
}
