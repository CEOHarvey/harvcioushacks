import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  readProducts,
  uploadPath,
  writeProducts,
} from "@/lib/products";
import { UPLOADS_DIR } from "@/lib/paths";
import { Product } from "@/lib/types";

const MAX_EXE = 100 * 1024 * 1024;
const MAX_IMAGE = 15 * 1024 * 1024;

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const name = String(formData.get("name") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const featuresRaw = String(formData.get("features") || "");
    const exeFile = formData.get("exe") as File | null;
    const imageFile = formData.get("image") as File | null;

    if (!name || !description || !exeFile || !imageFile) {
      return NextResponse.json(
        { error: "Name, description, EXE file, and image are required." },
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
        { error: "EXE file too large (max 100MB)." },
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

    await fs.mkdir(UPLOADS_DIR, { recursive: true });

    const id = uuidv4();
    const now = new Date().toISOString();
    const exeExt = path.extname(exeFile.name) || ".exe";
    const imageExt =
      imageFile.type === "image/png"
        ? ".png"
        : imageFile.type === "image/webp"
          ? ".webp"
          : imageFile.type === "image/gif"
            ? ".gif"
            : ".jpg";

    const exeFilename = `${id}${exeExt}`;
    const imageFilename = `${id}${imageExt}`;

    const exeBuffer = Buffer.from(await exeFile.arrayBuffer());
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());

    await fs.writeFile(uploadPath(exeFilename), exeBuffer);
    await fs.writeFile(uploadPath(imageFilename), imageBuffer);

    const features = featuresRaw
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);

    const product: Product = {
      id,
      name,
      description,
      features,
      imageFilename,
      exeFilename,
      originalExeName: exeFile.name,
      createdAt: now,
      updatedAt: now,
    };

    const products = await readProducts();
    products.push(product);
    await writeProducts(products);

    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Failed to upload product." },
      { status: 500 }
    );
  }
}
