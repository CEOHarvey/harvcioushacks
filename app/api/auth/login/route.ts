import { NextRequest, NextResponse } from "next/server";
import {
  adminSessionCookieOptions,
  getAdminPassword,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const password = String(body.password || "");

  if (password !== getAdminPassword()) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(adminSessionCookieOptions());
  return response;
}
