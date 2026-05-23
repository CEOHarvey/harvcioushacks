import { ProductCard } from "@/components/ProductCard";
import { readProducts, toPublicProduct } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const products = (await readProducts())
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .map(toPublicProduct);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <section className="mb-12 text-center animate-fade-in">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-violet-400">
          Premium releases
        </p>
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Welcome to{" "}
          <span className="text-gradient">HarvciousHacks</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
          Curated tools with full feature lists. Click download and your file
          starts instantly.
        </p>
      </section>

      {products.length === 0 ? (
        <div className="glass rounded-2xl px-8 py-16 text-center">
          <p className="text-xl font-medium text-zinc-300">No tools yet</p>
          <p className="mt-2 text-zinc-500">
            Admin can add EXE releases from the Admin panel.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
