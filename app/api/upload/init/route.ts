import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { isAdminAuthenticated } from "@/lib/auth";
import { usesBlobStorage } from "@/lib/storage";

export const maxDuration = 30;

export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Login muna." }, { status: 401 });
  }

  if (!usesBlobStorage()) {
    return NextResponse.json(
      {
        error:
          "Kailangan ng Blob. Vercel → Storage → Blob → Connect → Redeploy.",
      },
      { status: 503 }
    );
  }

  return NextResponse.json({ sessionId: uuidv4() });
}
