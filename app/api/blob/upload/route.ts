import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { usesBlobStorage } from "@/lib/storage";

export const maxDuration = 60;
export const runtime = "nodejs";

const MAX_EXE = 100 * 1024 * 1024;
const MAX_IMAGE = 15 * 1024 * 1024;

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const EXE_TYPES = [
  "application/octet-stream",
  "application/x-msdownload",
  "application/vnd.microsoft.portable-executable",
];

export async function POST(request: Request): Promise<NextResponse> {
  const cookieStore = await cookies();
  if (cookieStore.get("hh_admin_session")?.value !== "authenticated") {
    return NextResponse.json({ error: "Login muna sa admin." }, { status: 401 });
  }

  if (!usesBlobStorage()) {
    return NextResponse.json(
      {
        error:
          "Blob storage wala pa. Vercel → Storage → Blob → Connect to Project → Redeploy.",
      },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json()) as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith("files/")) {
          throw new Error("Invalid upload path.");
        }

        const isExe = pathname.toLowerCase().endsWith(".exe");

        return {
          pathname,
          allowedContentTypes: isExe ? EXE_TYPES : IMAGE_TYPES,
          maximumSizeInBytes: isExe ? MAX_EXE : MAX_IMAGE,
          addRandomSuffix: false,
        };
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (err) {
    console.error("Blob upload error:", err);
    const message =
      err instanceof Error ? err.message : "Blob upload failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
