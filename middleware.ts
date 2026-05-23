import { NextRequest, NextResponse } from "next/server";
import { isAdminHost } from "@/lib/site";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host");
  const { pathname } = request.nextUrl;

  if (process.env.NODE_ENV === "development") {
    const isLocal =
      host?.includes("localhost") || host?.includes("127.0.0.1");
    if (isLocal) return NextResponse.next();
  }

  const adminHost = isAdminHost(host);

  const isApi = pathname.startsWith("/api");
  const isAdminPage = pathname.startsWith("/admin");
  const isStatic =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".");

  if (isStatic) return NextResponse.next();

  if (adminHost) {
    if (!isApi && !isAdminPage) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (isAdminPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
