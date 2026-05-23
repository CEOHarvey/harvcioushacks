import { NextRequest, NextResponse } from "next/server";
import {
  adminSessionCookieOptions,
  verifyAdminPassword,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const password = String(body.password || "");

  if (!process.env.ADMIN_PASSWORD?.trim() && process.env.VERCEL === "1") {
    return NextResponse.json(
      {
        error:
          "ADMIN_PASSWORD hindi naka-set sa Vercel. Settings → Environment Variables → idagdag → Redeploy.",
      },
      { status: 503 }
    );
  }

  if (!verifyAdminPassword(password)) {
    return NextResponse.json(
      {
        error:
          "Maling password. Gamitin ang eksaktong ADMIN_PASSWORD sa Vercel (walang extra spaces).",
      },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(adminSessionCookieOptions());
  return response;
}
