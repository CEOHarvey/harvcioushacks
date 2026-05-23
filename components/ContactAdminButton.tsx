"use client";

import { useEffect, useState } from "react";
import { DISCORD } from "@/lib/site";

export function ContactAdminButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-violet-500/40 bg-violet-600/20 px-4 py-2 text-sm font-medium text-violet-200 transition hover:bg-violet-600/40 hover:text-white"
      >
        Contact Admin
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="contact-admin-title"
          onClick={() => setOpen(false)}
        >
          <div
            className="glass w-full max-w-sm animate-slide-up rounded-2xl p-8 text-center shadow-2xl shadow-violet-950/50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#5865F2] shadow-lg shadow-[#5865F2]/30">
              <DiscordIcon className="h-9 w-9 text-white" />
            </div>
            <h2
              id="contact-admin-title"
              className="font-display text-xl font-bold text-white"
            >
              Contact Admin
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              Message me on Discord for support or orders.
            </p>
            <a
              href={DISCORD.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 flex items-center justify-center gap-3 rounded-xl bg-[#5865F2] px-5 py-3.5 font-semibold text-white transition hover:bg-[#4752c4] active:scale-[0.98]"
            >
              <DiscordIcon className="h-5 w-5" />
              {DISCORD.username}
            </a>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-4 text-sm text-zinc-500 transition hover:text-zinc-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}
