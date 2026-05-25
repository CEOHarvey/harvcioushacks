import {
  deleteBlobPath,
  listBlobPaths,
  readUploadedFile,
  saveBlobPath,
  saveUploadedFile,
  usesBlobStorage,
} from "./storage";

export const CHUNK_SIZE = 4 * 1024 * 1024; // 4MB — under Vercel 4.5MB request limit
export const MAX_EXE_SIZE = 100 * 1024 * 1024;

export function chunkPathname(sessionId: string, index: number) {
  return `chunks/${sessionId}/${index}`;
}

export function chunkPrefix(sessionId: string) {
  return `chunks/${sessionId}/`;
}

export async function saveChunk(
  sessionId: string,
  index: number,
  data: Buffer
): Promise<void> {
  await saveBlobPath(chunkPathname(sessionId, index), data, "application/octet-stream");
}

export async function mergeChunksToFile(
  sessionId: string,
  destFilename: string
): Promise<void> {
  if (!usesBlobStorage()) {
    throw new Error("Blob storage required for large uploads.");
  }

  const prefix = chunkPrefix(sessionId);
  const blobs = await listBlobPaths(prefix);

  if (blobs.length === 0) {
    throw new Error("No chunks found for this upload.");
  }

  const sorted = blobs.sort((a, b) => {
    const ai = Number(a.pathname.split("/").pop() ?? "0");
    const bi = Number(b.pathname.split("/").pop() ?? "0");
    return ai - bi;
  });

  const parts: Buffer[] = [];
  let total = 0;

  for (const blob of sorted) {
    const res = await fetch(blob.url, { cache: "no-store" });
    if (!res.ok) continue;
    const buf = Buffer.from(await res.arrayBuffer());
    total += buf.length;
    if (total > MAX_EXE_SIZE) {
      throw new Error("File exceeds 100MB limit.");
    }
    parts.push(buf);
  }

  if (parts.length === 0) {
    throw new Error("Could not read uploaded chunks.");
  }

  const merged = Buffer.concat(parts);
  await saveUploadedFile(destFilename, merged, "application/octet-stream");
}

export async function deleteChunkSession(sessionId: string): Promise<void> {
  const blobs = await listBlobPaths(chunkPrefix(sessionId));
  for (const blob of blobs) {
    await deleteBlobPath(blob.pathname);
  }
}
