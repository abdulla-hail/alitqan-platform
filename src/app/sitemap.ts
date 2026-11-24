import type { MetadataRoute } from "next";
import { publicEnv, isSupabaseConfigured } from "@/lib/env";
import { getSitemapEntries } from "@/services/content";
import { getLanguages } from "@/services/site";

export const revalidate = 3600;

const SYSTEM_PATHS: Record<string, string> = { home: "", about: "about", services: "services", projects: "projects", team: "team", blog: "blog", contact: "contact", request: "request" };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isSupabaseConfigured()) return [];
  const base = publicEnv.siteUrl;
  const [langs, data] = await Promise.all([getLanguages(), getSitemapEntries()]);
  const codes = langs.map((l) => l.code);
  const entry = (path: string, lastModified?: string, priority = 0.6): MetadataRoute.Sitemap[number][] =>
    codes.map((code) => ({
      url: `${base}/${code}${path ? `/${path}` : ""}`,
      lastModified: lastModified ? new Date(lastModified) : undefined,
      priority,
      alternates: { languages: Object.fromEntries(codes.map((c) => [c, `${base}/${c}${path ? `/${path}` : ""}`])) },
    }));
  return [
    ...data.pages.flatMap((p) => entry(SYSTEM_PATHS[p.slug] ?? p.slug, p.updated_at, p.slug === "home" ? 1 : p.kind === "legal" ? 0.2 : 0.8)),
    ...data.services.flatMap((s) => entry(`services/${s.slug}`, s.updated_at, 0.7)),
    ...data.projects.flatMap((s) => entry(`projects/${s.slug}`, s.updated_at, 0.6)),
    ...data.posts.flatMap((s) => entry(`blog/${s.slug}`, s.updated_at, 0.6)),
  ];
}
