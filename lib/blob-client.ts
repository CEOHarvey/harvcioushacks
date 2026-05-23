import { upload } from "@vercel/blob/client";
import { imageExtFromFilename, imageExtFromType } from "./product-form";

export async function uploadFileToBlob(pathname: string, file: File) {
  return upload(pathname, file, {
    access: "public",
    handleUploadUrl: "/api/blob/upload",
    multipart: file.size > 4.5 * 1024 * 1024,
  });
}

export function exeFilenameFor(id: string, file: File) {
  const ext = file.name.toLowerCase().endsWith(".exe") ? ".exe" : ".exe";
  return `${id}${ext}`;
}

export function imageFilenameFor(id: string, file: File) {
  const ext = file.type
    ? imageExtFromType(file.type)
    : imageExtFromFilename(file.name);
  return `${id}${ext}`;
}

export function blobPath(filename: string) {
  return `files/${filename}`;
}
