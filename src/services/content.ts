import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/clients";
import type {
  BlogCategory, BlogPost, BlogTag, Client, Page, PageSection, Project, ProjectCategory, Service, ServiceCategory, TeamMember, Testimonial,
} from "@/types/content";

const sb = () => createPublicClient();

export const getPage = cache(async (slug: string): Promise<Page | null> => {
  const { data } = await sb().from("pages").select("*, sections:page_sections(*)").eq("slug", slug).eq("status", "published").maybeSingle();
  if (!data) return null;
  const page = data as Page;
  page.sections = ((page.sections ?? []) as PageSection[]).filter((s) => s.is_visible).sort((a, b) => a.position - b.position);
  return page;
});

export const getServiceCategories = cache(async () => {
  const { data } = await sb().from("service_categories").select("*").eq("is_visible", true).order("position");
  return (data ?? []) as ServiceCategory[];
});

export const getServices = cache(async (opts: { featured?: boolean; limit?: number } = {}) => {
  let q = sb().from("services").select("*").eq("status", "published").order("position");
  if (opts.featured) q = q.eq("is_featured", true);
  if (opts.limit) q = q.limit(opts.limit);
  const { data } = await q;
  return (data ?? []) as Service[];
});

export const getService = cache(async (slug: string) => {
  const { data } = await sb().from("services").select("*").eq("slug", slug).eq("status", "published").maybeSingle();
  return (data as Service) ?? null;
});

export const getProjectCategories = cache(async () => {
  const { data } = await sb().from("project_categories").select("*").eq("is_visible", true).order("position");
  return (data ?? []) as ProjectCategory[];
});

export const getProjects = cache(async (opts: { featured?: boolean; limit?: number } = {}) => {
  let q = sb().from("projects").select("*").eq("status", "published").order("position");
  if (opts.featured) q = q.eq("is_featured", true);
  if (opts.limit) q = q.limit(opts.limit);
  const { data } = await q;
  return (data ?? []) as Project[];
});

export const getProject = cache(async (slug: string) => {
  const { data } = await sb()
    .from("projects")
    .select("*, project_images(*), project_services(service_id)")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (!data) return null;
  const p = data as Project;
  p.project_images = (p.project_images ?? []).sort((a, b) => a.position - b.position);
  return p;
});

export const getServicesByIds = cache(async (ids: string[]) => {
  if (!ids.length) return [];
  const { data } = await sb().from("services").select("*").in("id", ids).eq("status", "published").order("position");
  return (data ?? []) as Service[];
});

export const getTeam = cache(async (opts: { foundersOnly?: boolean; limit?: number } = {}) => {
  let q = sb().from("team_members").select("*").eq("is_visible", true).order("position");
  if (opts.foundersOnly) q = q.eq("is_founder", true);
  if (opts.limit) q = q.limit(opts.limit);
  const { data } = await q;
  return (data ?? []) as TeamMember[];
});

const POST_SELECT = "*, author:team_members(*), category:blog_categories(*), blog_post_tags(tag:blog_tags(*))";

export const getPosts = cache(async (opts: { limit?: number; category?: string; tag?: string } = {}) => {
  let q = sb().from("blog_posts").select(POST_SELECT).eq("status", "published").lte("published_at", new Date().toISOString()).order("published_at", { ascending: false });
  if (opts.limit) q = q.limit(opts.limit);
  const { data } = await q;
  let posts = (data ?? []) as BlogPost[];
  if (opts.category) posts = posts.filter((p) => p.category?.slug === opts.category);
  if (opts.tag) posts = posts.filter((p) => p.blog_post_tags?.some((t) => t.tag?.slug === opts.tag));
  return posts;
});

export const getPost = cache(async (slug: string) => {
  const { data } = await sb().from("blog_posts").select(POST_SELECT).eq("slug", slug).eq("status", "published").lte("published_at", new Date().toISOString()).maybeSingle();
  return (data as BlogPost) ?? null;
});

export const getBlogTaxonomy = cache(async () => {
  const [c, t] = await Promise.all([
    sb().from("blog_categories").select("*").order("position"),
    sb().from("blog_tags").select("*").order("slug"),
  ]);
  return { categories: (c.data ?? []) as BlogCategory[], tags: (t.data ?? []) as BlogTag[] };
});

export const getTestimonials = cache(async (limit?: number) => {
  let q = sb().from("testimonials").select("*").eq("is_visible", true).order("position");
  if (limit) q = q.limit(limit);
  const { data } = await q;
  return (data ?? []) as Testimonial[];
});

export const getClients = cache(async () => {
  const { data } = await sb().from("clients").select("*").eq("is_visible", true).order("position");
  return (data ?? []) as Client[];
});

/** Everything needed for sitemap.xml */
export async function getSitemapEntries() {
  const [pages, services, projects, posts] = await Promise.all([
    sb().from("pages").select("slug,kind,updated_at,show_in_sitemap").eq("status", "published"),
    sb().from("services").select("slug,updated_at").eq("status", "published"),
    sb().from("projects").select("slug,updated_at").eq("status", "published"),
    sb().from("blog_posts").select("slug,updated_at").eq("status", "published").lte("published_at", new Date().toISOString()),
  ]);
  return {
    pages: (pages.data ?? []).filter((p) => p.show_in_sitemap),
    services: services.data ?? [],
    projects: projects.data ?? [],
    posts: posts.data ?? [],
  };
}

/** Projects chosen for the homepage slider (CMS → Homepage slider), in their slider order. */
export const getHomeProjects = cache(async (limit = 12) => {
  const { data } = await sb()
    .from("projects")
    .select("*")
    .eq("status", "published")
    .eq("show_on_home", true)
    .order("home_position")
    .limit(limit);
  return (data ?? []) as Project[];
});
