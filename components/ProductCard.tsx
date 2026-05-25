import { ProductPublic } from "@/lib/types";

interface ProductCardProps {
  product: ProductPublic;
  index: number;
}

export function ProductCard({ product, index }: ProductCardProps) {
  const imageUrl = `/api/files/${product.imageFilename}`;
  const downloadUrl = product.downloadUrl;

  return (
    <article
      className="animate-slide-up glass overflow-hidden rounded-2xl opacity-0"
      style={{ animationDelay: `${index * 80}ms`, animationFillMode: "forwards" }}
    >
      <div className="relative flex min-h-[min(70vh,520px)] w-full items-center justify-center bg-gradient-to-b from-zinc-900/80 to-surface p-4 sm:min-h-[min(75vh,640px)] sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(124,58,237,0.12),transparent_60%)]" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={product.name}
          className="relative z-10 max-h-[min(65vh,600px)] w-full max-w-full object-contain drop-shadow-2xl"
          style={{ aspectRatio: "auto" }}
        />
      </div>

      <div className="space-y-5 p-6 sm:p-8">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            {product.name}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-zinc-400">
            {product.description}
          </p>
        </div>

        {product.features.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-violet-300">
              Features
            </h3>
            <ul className="grid gap-2 sm:grid-cols-2">
              {product.features.map((feature, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-sm text-zinc-300"
                >
                  <span className="mt-0.5 text-violet-400">✦</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}

        {downloadUrl ? (
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-violet-900/50 transition hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-violet-800/60 active:scale-[0.98] sm:w-auto sm:min-w-[220px]"
          >
            <DownloadIcon />
            Download
          </a>
        ) : (
          <p className="text-sm text-zinc-500">Download link not available.</p>
        )}
      </div>
    </article>
  );
}

function DownloadIcon() {
  return (
    <svg
      className="h-5 w-5 transition group-hover:translate-y-0.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  );
}
