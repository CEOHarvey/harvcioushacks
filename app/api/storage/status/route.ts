import { NextResponse } from "next/server";
import { usesBlobStorage } from "@/lib/storage";

export async function GET() {
  return NextResponse.json({
    usesBlob: usesBlobStorage(),
    onVercel: process.env.VERCEL === "1",
    maxFileMb: 100,
    chunkedUpload: true,
  });
}
