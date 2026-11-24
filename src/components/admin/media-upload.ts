"use client";
import { getBrowserClient } from "@/lib/supabase/browser";
import { publicEnv } from "@/lib/env";
import { sanitizeSvg } from "@/lib/svg-safety";

export const MEDIA_ACCEPT = "image/jpeg,image/png,image/webp,image/avif,image/gif,image/svg+xml,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,video/mp4,.woff2,.woff";
export const MEDIA_MAX = 10 * 1024 * 1024;
const TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif", "image/svg+xml", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "video/mp4", "font/woff2", "font/woff"]);

/** Browsers often report "" or octet-stream for fonts: derive the type from the extension. */
export function fileType(file: File) {
  if (/\.woff2$/i.test(file.name)) return "font/woff2";
  if (/\.woff$/i.test(file.name)) return "font/woff";
  return file.type;
}

/**
 * Optimises raster images in the browser before upload: downscale to max 2400px
 * and re-encode as WebP. SVG/GIF/PDF/fonts are uploaded untouched.
 */
export async function optimiseImage(file: File): Promise<{ blob: Blob; name: string; type: string; width?: number; height?: number }> {
  const type = fileType(file);
  if (!/^image\/(jpeg|png|webp|avif)$/.test(type)) return { blob: file, name: file.name, type };
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 2400 / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * scale);
    const h = Math.round(bmp.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", 0.84));
    if (!blob || blob.size >= file.size) return { blob: file, name: file.name, type, width: bmp.width, height: bmp.height };
    return { blob, name: file.name.replace(/\.[^.]+$/, "") + ".webp", type: "image/webp", width: w, height: h };
  } catch {
    return { blob: file, name: file.name, type };
  }
}

/** PUT-free upload with progress events, authorised by the signed-in user's session (Storage RLS: media.manage). */
function xhrUpload(path: string, blob: Blob, type: string, token: string, onProgress?: (p: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${publicEnv.supabaseUrl}/storage/v1/object/media/${path.split("/").map(encodeURIComponent).join("/")}`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", publicEnv.supabaseAnonKey);
    xhr.setRequestHeader("Content-Type", type);
    xhr.setRequestHeader("cache-control", "max-age=31536000");
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total);
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(xhr.responseText || `HTTP ${xhr.status}`)));
    xhr.onerror = () => reject(new Error("network"));
    xhr.send(blob);
  });
}

export async function uploadToMedia(file: File, folder: string, onProgress?: (p: number) => void) {
  if (file.size > MEDIA_MAX) throw new Error("too_large");
  if (!TYPES.has(fileType(file))) throw new Error("type");
  let opt = await optimiseImage(file);
  if (opt.type === "image/svg+xml") {
    // never store executable SVG: clean it, and refuse anything that could run code or load external content
    const check = sanitizeSvg(await file.text());
    if (!check.ok) throw new Error("unsafe_svg");
    opt = { ...opt, blob: new Blob([check.svg], { type: "image/svg+xml" }) };
  }
  const safe = opt.name.normalize("NFKD").replace(/[^\w.-]+/g, "-").replace(/-+/g, "-").toLowerCase().slice(-80);
  const path = `${folder.replace(/[^\w-]/g, "") || "general"}/${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID().slice(0, 8)}-${safe}`;
  const sb = getBrowserClient();
  const { data: session } = await sb.auth.getSession();
  const token = session.session?.access_token;
  if (token) await xhrUpload(path, opt.blob, opt.type, token, onProgress);
  else {
    const { error } = await sb.storage.from("media").upload(path, opt.blob, { contentType: opt.type, cacheControl: "31536000", upsert: false });
    if (error) throw new Error(error.message);
    onProgress?.(1);
  }
  const { data } = sb.storage.from("media").getPublicUrl(path);
  return { path, url: data.publicUrl, file_name: opt.name, mime_type: opt.type, size_bytes: opt.blob.size, width: opt.width ?? null, height: opt.height ?? null };
}
