/** Hostnames that serve only the admin panel (e.g. harvcioushacks-admin.vercel.app). */
export function getAdminHosts(): string[] {
  const fromEnv = process.env.ADMIN_HOSTS?.split(",").map((h) => h.trim().toLowerCase()).filter(Boolean);
  if (fromEnv?.length) return fromEnv;

  return [
    "harvcioushacks-admin.vercel.app",
    "harvcioushacks.admin.vercel.app",
    "admin.localhost:3000",
  ];
}

export function isAdminHost(host: string | null): boolean {
  if (!host) return false;
  const normalized = host.toLowerCase().split(":")[0];
  const adminHosts = getAdminHosts();

  if (adminHosts.some((h) => normalized === h.split(":")[0])) return true;
  if (normalized.startsWith("admin.")) return true;

  return false;
}

export const DISCORD = {
  username: "@ceoharvey24",
  url: "https://discord.com/users/1255219127107325955",
} as const;

export function getAdminPanelUrl(): string {
  return (
    process.env.NEXT_PUBLIC_ADMIN_URL ||
    "https://harvcioushacks-admin.vercel.app"
  );
}
