/** Hostnames that serve only the admin panel. */
export function getAdminHosts(): string[] {
  const hosts = new Set<string>();

  const fromEnv = process.env.ADMIN_HOSTS?.split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  fromEnv?.forEach((h) => hosts.add(h.split(":")[0]));

  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL?.trim();
  if (adminUrl) {
    try {
      const hostname = new URL(
        adminUrl.startsWith("http") ? adminUrl : `https://${adminUrl}`
      ).hostname.toLowerCase();
      hosts.add(hostname);
    } catch {
      /* ignore invalid URL */
    }
  }

  if (hosts.size === 0) {
    hosts.add("harvcioushacks-admin.vercel.app");
    hosts.add("admin.localhost:3000");
  }

  return [...hosts];
}

export function isAdminHost(host: string | null): boolean {
  if (!host) return false;
  const normalized = host.toLowerCase().split(":")[0];
  const adminHosts = getAdminHosts();

  return adminHosts.some((h) => normalized === h.split(":")[0]);
}

export const DISCORD = {
  username: "@ceoharvey24",
  url: "https://discord.com/users/1255219127107325955",
} as const;

export function getAdminPanelUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_ADMIN_URL ||
    "https://harvcioushacks-admin.vercel.app";
  return raw.startsWith("http") ? raw : `https://${raw}`;
}
