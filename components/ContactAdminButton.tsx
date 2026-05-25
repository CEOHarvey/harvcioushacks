import { DISCORD } from "@/lib/site";

export function ContactAdminButton() {
  return (
    <a
      href={DISCORD.url}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-lg border border-violet-500/40 bg-violet-600/20 px-4 py-2 text-sm font-medium text-violet-200 transition hover:bg-violet-600/40 hover:text-white"
    >
      Contact Admin
    </a>
  );
}
