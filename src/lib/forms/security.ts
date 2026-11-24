import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/clients";
import { serverEnv } from "@/lib/server-env";

/** Visitor fingerprint for rate limiting: salted hash, the raw IP is never stored. */
export async function visitorInfo() {
  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "unknown").trim();
  const ipHash = createHash("sha256").update(`${serverEnv.ipHashSalt || "alitqan"}:${ip}`).digest("hex").slice(0, 32);
  return { ip, ipHash, userAgent: (h.get("user-agent") ?? "").slice(0, 300) };
}

export async function rateLimit(key: string, max: number, windowSeconds: number) {
  const { data, error } = await createServiceClient().rpc("check_rate_limit", { p_key: key, p_max: max, p_window_seconds: windowSeconds });
  if (error) {
    console.error("rate limit check failed", error.message);
    return true; // fail open on infrastructure errors, other checks still apply
  }
  return Boolean(data);
}

/** Signed form timestamp: bots that submit instantly (or replay old tokens) are rejected. */
const secret = () => serverEnv.ipHashSalt || serverEnv.serviceRoleKey || "alitqan-dev-secret";
export function issueFormToken() {
  const ts = Date.now().toString();
  const sig = createHmac("sha256", secret()).update(ts).digest("base64url");
  return `${ts}.${sig}`;
}
export function verifyFormToken(token: string | undefined | null, minMs = 2500, maxMs = 1000 * 60 * 60 * 6) {
  if (!token) return false;
  const [ts, sig] = token.split(".");
  if (!ts || !sig) return false;
  const expected = createHmac("sha256", secret()).update(ts).digest("base64url");
  if (expected.length !== sig.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return false;
  const age = Date.now() - Number(ts);
  return age >= minMs && age <= maxMs;
}

/** Optional Cloudflare Turnstile verification (enabled when TURNSTILE_SECRET_KEY is set). */
export async function verifyTurnstile(token: string | undefined | null, ip: string) {
  if (!serverEnv.turnstileSecret) return true;
  if (!token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret: serverEnv.turnstileSecret, response: token, remoteip: ip }),
    });
    const json = (await res.json()) as { success: boolean };
    return json.success;
  } catch {
    return false;
  }
}

export const ATTACHMENT_RULES = {
  maxFiles: 5,
  maxBytes: 10 * 1024 * 1024,
  types: {
    "application/pdf": "pdf",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "application/zip": "zip",
    "application/x-zip-compressed": "zip",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.ms-excel": "xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/vnd.ms-powerpoint": "ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
    "text/plain": "txt",
  } as Record<string, string>,
};
