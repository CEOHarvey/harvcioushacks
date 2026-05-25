"use client";

const CHUNK_SIZE = 4 * 1024 * 1024;

function apiFetch(url: string, options?: RequestInit) {
  return fetch(url, { ...options, credentials: "include" });
}

export async function uploadExeInChunks(
  file: File,
  destFilename: string,
  onProgress?: (pct: number, label: string) => void
): Promise<void> {
  const initRes = await apiFetch("/api/upload/init", { method: "POST" });
  const initData = await initRes.json();
  if (!initRes.ok) {
    throw new Error(initData.error || "Failed to start upload.");
  }

  const sessionId = initData.sessionId as string;
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const slice = file.slice(start, end);

    const formData = new FormData();
    formData.append("sessionId", sessionId);
    formData.append("index", String(i));
    formData.append("chunk", slice, `chunk-${i}`);

    const pct = Math.round(((i + 1) / totalChunks) * 90);
    onProgress?.(pct, `EXE part ${i + 1} / ${totalChunks}`);

    const res = await apiFetch("/api/upload/chunk", {
      method: "POST",
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `Chunk ${i + 1} failed.`);
    }
  }

  onProgress?.(95, "Pinagsasama ang file");

  const completeRes = await apiFetch("/api/upload/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, filename: destFilename }),
  });
  const completeData = await completeRes.json().catch(() => ({}));
  if (!completeRes.ok) {
    throw new Error(completeData.error || "Failed to finish EXE upload.");
  }

  onProgress?.(100, "EXE tapos na");
}

export function needsChunkedExeUpload(file: File, onVercel: boolean): boolean {
  return onVercel && file.size > 4 * 1024 * 1024;
}
