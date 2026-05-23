import { cookies } from "next/headers";

const COOKIE_NAME = "hh_admin_session";
const SESSION_VALUE = "authenticated";

export function getAdminPassword(): string {
  const raw = process.env.ADMIN_PASSWORD?.trim();
  if (raw) return raw;
  if (process.env.VERCEL === "1") {
    console.error(
      "ADMIN_PASSWORD is not set on Vercel. Add it in Environment Variables and redeploy."
    );
  }
  return "admin123";
}

export function verifyAdminPassword(input: string): boolean {
  const password = input.trim();
  const expected = getAdminPassword();
  if (password.length === 0 || expected.length === 0) return false;
  if (password.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < password.length; i++) {
    mismatch |= password.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value === SESSION_VALUE;
}

export function adminSessionCookieOptions() {
  return {
    name: COOKIE_NAME,
    value: SESSION_VALUE,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}

export function clearAdminSessionCookieOptions() {
  return {
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
}
