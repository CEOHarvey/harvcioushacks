"use client";

import { useCallback, useEffect, useState } from "react";
import { ProductPublic } from "@/lib/types";

export function AdminPanel() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [products, setProducts] = useState<ProductPublic[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [features, setFeatures] = useState("");
  const [exe, setExe] = useState<File | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const checkSession = useCallback(async () => {
    const res = await fetch("/api/auth/session");
    const data = await res.json();
    setAuthenticated(data.authenticated);
  }, []);

  const loadProducts = useCallback(async () => {
    const res = await fetch("/api/products");
    if (res.ok) setProducts(await res.json());
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (authenticated) loadProducts();
  }, [authenticated, loadProducts]);

  useEffect(() => {
    if (!image) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(image);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setAuthenticated(true);
      setPassword("");
    } else {
      setLoginError("Maling password. Subukan ulit.");
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setAuthenticated(false);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!exe || !image) {
      setMessage("Kailangan ng EXE at image.");
      return;
    }

    setUploading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("features", features);
    formData.append("exe", exe);
    formData.append("image", image);

    const res = await fetch("/api/products/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setUploading(false);

    if (res.ok) {
      setMessage("Na-upload na ang tool!");
      setName("");
      setDescription("");
      setFeatures("");
      setExe(null);
      setImage(null);
      loadProducts();
    } else {
      setMessage(data.error || "Upload failed.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this tool permanently?")) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      setMessage("Deleted.");
      loadProducts();
    }
  }

  if (authenticated === null) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="glass rounded-2xl p-8">
          <h1 className="font-display text-2xl font-bold">Admin Login</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Mag-login para mag-upload ng EXE at images.
          </p>
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin password"
              className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-violet-500"
              required
            />
            {loginError && (
              <p className="text-sm text-red-400">{loginError}</p>
            )}
            <button
              type="submit"
              className="w-full rounded-lg bg-violet-600 py-3 font-semibold text-white hover:bg-violet-500"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Admin Panel</h1>
          <p className="mt-1 text-zinc-400">Upload EXE + image, manage tools</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-400 hover:text-white"
        >
          Logout
        </button>
      </div>

      {message && (
        <div className="mb-6 rounded-lg border border-violet-500/30 bg-violet-600/20 px-4 py-3 text-sm text-violet-200">
          {message}
        </div>
      )}

      <form
        onSubmit={handleUpload}
        className="glass mb-12 space-y-5 rounded-2xl p-6 sm:p-8"
      >
        <h2 className="text-lg font-semibold">Bagong Tool</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm text-zinc-400">Pangalan</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 outline-none focus:border-violet-500"
              required
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-sm text-zinc-400">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 outline-none focus:border-violet-500"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm text-zinc-400">
            Features (isang line bawat feature)
          </span>
          <textarea
            value={features}
            onChange={(e) => setFeatures(e.target.value)}
            rows={4}
            placeholder="Aimbot&#10;ESP&#10;No recoil"
            className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 outline-none focus:border-violet-500"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm text-zinc-400">EXE file</span>
            <input
              type="file"
              accept=".exe"
              onChange={(e) => setExe(e.target.files?.[0] || null)}
              className="w-full text-sm text-zinc-400 file:mr-3 file:rounded-lg file:border-0 file:bg-violet-600 file:px-4 file:py-2 file:text-white"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-zinc-400">Image</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
              className="w-full text-sm text-zinc-400 file:mr-3 file:rounded-lg file:border-0 file:bg-violet-600 file:px-4 file:py-2 file:text-white"
              required
            />
          </label>
        </div>

        {imagePreview && (
          <div className="flex min-h-[200px] max-h-[50vh] items-center justify-center rounded-xl border border-white/10 bg-black/30 p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreview}
              alt="Preview"
              className="max-h-[45vh] w-full object-contain"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={uploading}
          className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 font-semibold text-white disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Publish Tool"}
        </button>
      </form>

      <section>
        <h2 className="mb-4 text-lg font-semibold">
          Published Tools ({products.length})
        </h2>
        {products.length === 0 ? (
          <p className="text-zinc-500">Wala pang na-upload.</p>
        ) : (
          <ul className="space-y-3">
            {products.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/files/${p.imageFilename}`}
                  alt={p.name}
                  className="h-16 w-16 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{p.name}</p>
                  <p className="text-xs text-zinc-500 truncate">
                    {p.originalExeName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(p.id)}
                  className="shrink-0 rounded-lg border border-red-500/40 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/20"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
