import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { saveChunk, CHUNK_SIZE } from "@/lib/chunked-upload";
import { usesBlobStorage } from "@/lib/storage";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!usesBlobStorage()) {
    return NextResponse.json({ error: "Blob not configured." }, { status: 503 });
  }

  try {
    const formData = await request.formData();
    const sessionId = String(formData.get("sessionId") || "");
    const index = Number(formData.get("index"));
    const chunk = formData.get("chunk") as File | null;

    if (!sessionId || Number.isNaN(index) || index < 0 || !chunk) {
      return NextResponse.json({ error: "Invalid chunk data." }, { status: 400 });
    }

    if (chunk.size > CHUNK_SIZE + 512 * 1024) {
      return NextResponse.json(
        { error: `Chunk too large (max ${CHUNK_SIZE / 1024 / 1024}MB per part).` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await chunk.arrayBuffer());
    await saveChunk(sessionId, index, buffer);

    return NextResponse.json({ success: true, index });
  } catch (err) {
    console.error("Chunk upload error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Chunk upload failed." },
      { status: 500 }
    );
  }
}
