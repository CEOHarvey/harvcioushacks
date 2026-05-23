import Link from "next/link";
import { headers } from "next/headers";
import { ContactAdminButton } from "@/components/ContactAdminButton";
import { isAdminHost } from "@/lib/site";

export async function Header() {
  const headersList = await headers();
  const host = headersList.get("host");
  const onAdminHost = isAdminHost(host);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-surface/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href={onAdminHost ? "/admin" : "/"}
          className="group flex items-center gap-3"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-lg font-bold shadow-lg shadow-violet-900/40 transition group-hover:scale-105">
            H
          </span>
          <span className="font-display text-xl font-bold tracking-tight">
            Harvcious<span className="text-gradient">Hacks</span>
            {onAdminHost && (
              <span className="ml-2 text-sm font-normal text-violet-400">
                Admin
              </span>
            )}
          </span>
        </Link>
        <nav className="flex items-center gap-4">
          {!onAdminHost && (
            <>
              <Link
                href="/"
                className="text-sm text-zinc-400 transition hover:text-white"
              >
                Tools
              </Link>
              <ContactAdminButton />
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
