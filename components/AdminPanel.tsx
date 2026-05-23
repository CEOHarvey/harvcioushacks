"use client";

import { useCallback, useEffect, useState } from "react";
import {
  blobPath,
  exeFilenameFor,
  imageFilenameFor,
  uploadFileToBlob,
} from "@/lib/blob-client";
import { Product, ProductPublic } from "@/lib/types";

function apiFetch(url: string, options?: RequestInit) {
  return fetch(url, { ...options, credentials: "include" });
}

export function AdminPanel() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [features, setFeatures] = useState("");
  const [exe, setExe] = useState<File | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const isEditing = editingId !== null;

  const checkSession = useCallback(async () => {
    const res = await apiFetch("/api/auth/session");
    const data = await res.json();
    setAuthenticated(data.authenticated);
  }, []);

  const loadProducts = useCallback(async () => {
    const res = await apiFetch("/api/products");
    if (res.ok) setProducts(await res.json());
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (authenticated) loadProducts();
  }, [authenticated, loadProducts]);

  useEffect(() => {
    if (image) {
      const url = URL.createObjectURL(image);
      setImagePreview(url);
      return () => URL.revokeObjectURL(url);
    }
    if (isEditing && editingId) {
      const product = products.find((p) => p.id === editingId);
      if (product) {
        setImagePreview(`/api/files/${product.imageFilename}`);
        return;
      }
    }
    setImagePreview(null);
  }, [image, isEditing, editingId, products]);

  function resetForm() {
    setEditingId(null);
    setName("");
    setDescription("");
    setFeatures("");
    setExe(null);
    setImage(null);
    setImagePreview(null);
  }

  function startEdit(product: Product) {
    setEditingId(product.id);
    setName(product.name);
    setDescription(product.description);
    setFeatures(product.features.join("\n"));
    setExe(null);
    setImage(null);
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    const res = await apiFetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setAuthenticated(true);
      setPassword("");
    } else {
      setLoginError(
        data.error ||
          "Maling password. I-check ang ADMIN_PASSWORD sa Vercel → Redeploy."
      );
    }
  }

  async function handleLogout() {
    await apiFetch("/api/auth/logout", { method: "POST" });
    setAuthenticated(false);
    resetForm();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isEditing && (!exe || !image)) {
      setMessage("Kailangan ng EXE at image para sa bagong tool.");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      const statusRes = await apiFetch("/api/storage/status");
      const status = await statusRes.json();
      const featureList = features
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean);

      if (status.usesBlob) {
        const id = editingId ?? crypto.randomUUID();
        const existing = products.find((p) => p.id === id);

        let exeFilename = existing?.exeFilename ?? "";
        let imageFilename = existing?.imageFilename ?? "";
        let originalExeName = existing?.originalExeName ?? "";

        if (!isEditing) {
          if (!exe || !image) {
            setMessage("Kailangan ng EXE at image.");
            setUploading(false);
            return;
          }
        }

        if (exe) {
          setMessage("Ina-upload ang EXE…");
          exeFilename = exeFilenameFor(id, exe);
          originalExeName = exe.name;
          await uploadFileToBlob(blobPath(exeFilename), exe);
        }

        if (image) {
          setMessage("Ina-upload ang image…");
          imageFilename = imageFilenameFor(id, image);
          await uploadFileToBlob(blobPath(imageFilename), image);
        }

        if (!exeFilename || !imageFilename) {
          setMessage("Kailangan ng EXE at image.");
          setUploading(false);
          return;
        }

        setMessage("Sine-save ang tool…");

        const payload = {
          name,
          description,
          features: featureList,
          exeFilename,
          imageFilename,
          originalExeName,
          ...(isEditing ? {} : { id }),
        };

        const res = await apiFetch(
          isEditing ? `/api/products/${editingId}` : "/api/products/upload",
          {
            method: isEditing ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
        const data = await res.json().catch(() => ({}));

        if (res.ok) {
          setMessage(
            isEditing ? "Na-update na ang tool!" : "Na-upload na ang tool!"
          );
          resetForm();
          loadProducts();
        } else {
          setMessage(data.error || `Save failed (${res.status}).`);
        }
      } else {
        if (status.onVercel) {
          setMessage(
            "Walang Blob storage sa Vercel. Storage → Blob → Connect → Redeploy."
          );
          setUploading(false);
          return;
        }

        const formData = new FormData();
        formData.append("name", name);
        formData.append("description", description);
        formData.append("features", features);
        if (exe) formData.append("exe", exe);
        if (image) formData.append("image", image);

        const url = isEditing
          ? `/api/products/${editingId}`
          : "/api/products/upload";
        const method = isEditing ? "PATCH" : "POST";

        const res = await apiFetch(url, { method, body: formData });
        const data = await res.json().catch(() => ({}));

        if (res.ok) {
          setMessage(
            isEditing ? "Na-update na ang tool!" : "Na-upload na ang tool!"
          );
          resetForm();
          loadProducts();
        } else {
          setMessage(data.error || "Failed to save.");
        }
      }
    } catch (err) {
      console.error(err);
      setMessage(
        err instanceof Error
          ? err.message
          : "Upload failed. Check Blob storage sa Vercel."
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this tool permanently?")) return;
    const res = await apiFetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      setMessage("Deleted.");
      if (editingId === id) resetForm();
      loadProducts();
    } else {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error || "Delete failed. Login ulit.");
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
            Gamitin ang <strong className="text-violet-300">ADMIN_PASSWORD</strong>{" "}
            na naka-set sa Vercel (Settings → Environment Variables).
          </p>
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin password"
              className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-violet-500"
              required
              autoComplete="current-password"
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
          <p className="mt-1 text-zinc-400">Upload, edit, at i-manage ang tools</p>
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
        onSubmit={handleSubmit}
        className="glass mb-12 space-y-5 rounded-2xl p-6 sm:p-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">
            {isEditing ? "I-edit ang Tool" : "Bagong Tool"}
          </h2>
          {isEditing && (
            <button
              type="button"
              onClick={resetForm}
              className="text-sm text-zinc-400 hover:text-white"
            >
              Cancel edit
            </button>
          )}
        </div>

        <label className="block">
          <span className="mb-1 block text-sm text-zinc-400">Pangalan</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 outline-none focus:border-violet-500"
            required
          />
        </label>

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
            <span className="mb-1 block text-sm text-zinc-400">
              EXE file {isEditing && "(optional — palitan lang kung may bago)"}
            </span>
            <input
              type="file"
              accept=".exe"
              onChange={(e) => setExe(e.target.files?.[0] || null)}
              className="w-full text-sm text-zinc-400 file:mr-3 file:rounded-lg file:border-0 file:bg-violet-600 file:px-4 file:py-2 file:text-white"
              required={!isEditing}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-zinc-400">
              Image {isEditing && "(optional — palitan lang kung may bago)"}
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
              className="w-full text-sm text-zinc-400 file:mr-3 file:rounded-lg file:border-0 file:bg-violet-600 file:px-4 file:py-2 file:text-white"
              required={!isEditing}
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
          {uploading
            ? message || "Saving..."
            : isEditing
              ? "Save Changes"
              : "Publish Tool"}
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
                className="flex flex-wrap items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4"
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
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(p)}
                    className="rounded-lg border border-violet-500/40 px-3 py-1.5 text-sm text-violet-300 hover:bg-violet-500/20"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(p.id)}
                    className="rounded-lg border border-red-500/40 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/20"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
