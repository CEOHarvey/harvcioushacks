import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  deleteChunkSession,
  mergeChunksToFile,
} from "@/lib/chunked-upload";
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
    const body = await request.json();
    const sessionId = String(body.sessionId || "");
    const filename = String(body.filename || "");

    if (!sessionId || !filename || filename.includes("..") || filename.includes("/")) {
      return NextResponse.json({ error: "Invalid session or filename." }, { status: 400 });
    }

    await mergeChunksToFile(sessionId, filename);
    await deleteChunkSession(sessionId);

    return NextResponse.json({ success: true, filename });
  } catch (err) {
    console.error("Complete upload error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to merge file." },
      { status: 500 }
    );
  }
}
