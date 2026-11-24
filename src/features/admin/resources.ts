/**
 * CMS resource definitions. One generic list/editor UI + one generic save action
 * serve every content type below; validation is derived from these definitions
 * on the server. To add a field: add a DB column (migration) and a line here.
 */
import type { FieldDef } from "@/features/sections/registry";

export type AdminFieldKind =
  | FieldDef["kind"]
  | "slug" | "date" | "datetime" | "relation" | "relation_multi" | "gallery" | "seo" | "social" | "status";

export interface AdminField {
  name: string;
  kind: AdminFieldKind;
  label: { ar: string; en: string };
  localized?: boolean;
  required?: boolean;
  tab?: "content" | "media" | "seo" | "settings";
  options?: { value: string; label: { ar: string; en: string } }[];
  fields?: FieldDef[]; // list item fields
  relation?: { table: string; label: string }; // label = jsonb localized column or text column
  join?: { table: string; self: string; other: string }; // relation_multi join table
  gallery?: { table: string; fk: string };
  help?: { ar: string; en: string };
  default?: unknown;
}

export interface ResourceDef {
  key: string;
  table: string;
  label: { ar: string; en: string };
  singular: { ar: string; en: string };
  permission: string;
  titleField: string;
  subtitleField?: string;
  imageField?: string;
  sortable: boolean; // has `position` and drag-and-drop ordering
  status?: boolean; // draft/published/archived
  visibility?: boolean; // is_visible toggle
  orderBy: { column: string; ascending: boolean };
  publicPath?: string; // e.g. "/services/{slug}"
  fields: AdminField[];
}

const L = (ar: string, en: string) => ({ ar, en });
const slug: AdminField = { name: "slug", kind: "slug", label: L("الرابط المختصر (slug)", "Slug"), required: true, tab: "settings", help: L("أحرف إنجليزية صغيرة وأرقام وشرطات، مثل: web-design", "Lowercase letters, numbers and dashes, e.g. web-design") };
const title: AdminField = { name: "title", kind: "text", localized: true, required: true, label: L("العنوان", "Title") };
const excerpt: AdminField = { name: "excerpt", kind: "textarea", localized: true, label: L("وصف مختصر", "Short description") };
const body: AdminField = { name: "body", kind: "markdown", localized: true, label: L("المحتوى التفصيلي", "Full content") };
const seo: AdminField = { name: "seo", kind: "seo", label: L("إعدادات SEO", "SEO"), tab: "seo" };
const status: AdminField = { name: "status", kind: "status", label: L("حالة النشر", "Status"), tab: "settings" };
const featured: AdminField = { name: "is_featured", kind: "boolean", label: L("مميز (يظهر في الرئيسية)", "Featured (home page)"), tab: "settings" };
const visible: AdminField = { name: "is_visible", kind: "boolean", label: L("ظاهر في الموقع", "Visible on site"), tab: "settings" };
const name: AdminField = { name: "name", kind: "text", localized: true, required: true, label: L("الاسم", "Name") };
const textItem = (withIcon = true): FieldDef[] => [
  ...(withIcon ? [{ name: "icon", kind: "icon" as const, label: L("الأيقونة", "Icon") }] : []),
  { name: "title", kind: "text", localized: true, label: L("العنوان", "Title") },
  { name: "text", kind: "textarea", localized: true, label: L("النص", "Text") },
];

export const RESOURCES: ResourceDef[] = [
  {
    key: "services", table: "services", label: L("الخدمات", "Services"), singular: L("خدمة", "Service"), permission: "services.manage",
    titleField: "title", subtitleField: "excerpt", imageField: "image_url", sortable: true, status: true, publicPath: "/services/{slug}",
    orderBy: { column: "position", ascending: true },
    fields: [
      title, excerpt, body,
      { name: "category_id", kind: "relation", label: L("التصنيف", "Category"), relation: { table: "service_categories", label: "name" }, tab: "settings" },
      { name: "icon", kind: "icon", label: L("الأيقونة", "Icon"), tab: "media" },
      { name: "image_url", kind: "image", label: L("صورة / رسم توضيحي", "Image / illustration"), tab: "media" },
      { name: "features", kind: "list", label: L("المميزات", "Features"), fields: textItem() },
      { name: "steps", kind: "list", label: L("مراحل التنفيذ", "Delivery steps"), fields: textItem(false) },
      { name: "technologies", kind: "tags", label: L("التقنيات المستخدمة", "Technologies") },
      { name: "faqs", kind: "list", label: L("الأسئلة الشائعة", "FAQ"), fields: [
        { name: "question", kind: "text", localized: true, label: L("السؤال", "Question") },
        { name: "answer", kind: "textarea", localized: true, label: L("الإجابة", "Answer") },
      ] },
      { name: "related_ids", kind: "relation_multi", label: L("خدمات ذات صلة", "Related services"), relation: { table: "services", label: "title" }, tab: "settings" },
      slug, status, featured, seo,
    ],
  },
  {
    key: "service_categories", table: "service_categories", label: L("تصنيفات الخدمات", "Service categories"), singular: L("تصنيف", "Category"),
    permission: "services.manage", titleField: "name", sortable: true, visibility: true, orderBy: { column: "position", ascending: true },
    fields: [name, { name: "description", kind: "textarea", localized: true, label: L("الوصف", "Description") }, { name: "icon", kind: "icon", label: L("الأيقونة", "Icon") }, slug, visible],
  },
  {
    key: "projects", table: "projects", label: L("المشاريع", "Projects"), singular: L("مشروع", "Project"), permission: "projects.manage",
    titleField: "title", subtitleField: "excerpt", imageField: "cover_url", sortable: true, status: true, publicPath: "/projects/{slug}",
    orderBy: { column: "position", ascending: true },
    fields: [
      title, excerpt, body,
      { name: "challenge", kind: "markdown", localized: true, label: L("المشكلة / الاحتياج", "Challenge") },
      { name: "solution", kind: "markdown", localized: true, label: L("الحل المقدم", "Solution") },
      { name: "results", kind: "markdown", localized: true, label: L("النتائج", "Results") },
      { name: "metrics", kind: "list", label: L("أرقام النتائج", "Result metrics"), fields: [
        { name: "value", kind: "text", label: L("القيمة", "Value") },
        { name: "label", kind: "text", localized: true, label: L("الوصف", "Label") },
      ] },
      { name: "cover_url", kind: "image", label: L("صورة الغلاف (الصورة الرئيسية)", "Cover (main image)"), tab: "media" },
      { name: "cover_alt", kind: "text", localized: true, label: L("النص البديل للصورة (Alt)", "Image alt text"), tab: "media", help: L("وصف مختصر للصورة لقارئات الشاشة ومحركات البحث", "Short description for screen readers and search engines") },
      { name: "thumbnail_url", kind: "image", label: L("صورة مصغرة (اختياري)", "Thumbnail (optional)"), tab: "media" },
      { name: "mobile_image_url", kind: "image", label: L("صورة بديلة للهاتف في السلايدر (اختياري، عمودية 4:5)", "Mobile slider image (optional, portrait 4:5)"), tab: "media" },
      { name: "gallery", kind: "gallery", label: L("معرض الصور", "Gallery"), gallery: { table: "project_images", fk: "project_id" }, tab: "media" },
      { name: "category_id", kind: "relation", label: L("التصنيف", "Category"), relation: { table: "project_categories", label: "name" }, tab: "settings" },
      { name: "services", kind: "relation_multi", label: L("الخدمات المنفذة", "Services delivered"), relation: { table: "services", label: "title" }, join: { table: "project_services", self: "project_id", other: "service_id" }, tab: "settings" },
      { name: "client_name", kind: "text", localized: true, label: L("اسم العميل", "Client name"), tab: "settings" },
      { name: "project_type", kind: "text", localized: true, label: L("نوع المشروع", "Project type"), tab: "settings" },
      { name: "completed_on", kind: "date", label: L("تاريخ الإنجاز", "Completion date"), tab: "settings" },
      { name: "technologies", kind: "tags", label: L("التقنيات", "Technologies"), tab: "settings" },
      { name: "live_url", kind: "url", label: L("رابط المشروع المباشر", "Live project URL"), tab: "settings" },
      { name: "show_on_home", kind: "boolean", label: L("يظهر في سلايدر الصفحة الرئيسية", "Show in the homepage slider"), tab: "settings" },
      { name: "slider_link", kind: "url", label: L("رابط عند الضغط في السلايدر (اختياري)", "Slider click link (optional)"), tab: "settings", help: L("اتركه فارغاً لفتح صفحة تفاصيل المشروع. يقبل رابطاً داخلياً مثل /services أو خارجياً https://…", "Empty = project detail page. Accepts /services or https://…") },
      { name: "link_target", kind: "select", default: "_self", label: L("طريقة فتح الرابط", "Open link in"), tab: "settings", options: [{ value: "_self", label: L("نفس النافذة", "Same window") }, { value: "_blank", label: L("نافذة جديدة", "New window") }] },
      slug, status, featured, seo,
    ],
  },
  {
    key: "project_categories", table: "project_categories", label: L("تصنيفات المشاريع", "Project categories"), singular: L("تصنيف", "Category"),
    permission: "projects.manage", titleField: "name", sortable: true, visibility: true, orderBy: { column: "position", ascending: true },
    fields: [name, slug, visible],
  },
  {
    key: "blog_posts", table: "blog_posts", label: L("المقالات", "Articles"), singular: L("مقال", "Article"), permission: "blog.manage",
    titleField: "title", subtitleField: "excerpt", imageField: "cover_url", sortable: false, status: true, publicPath: "/blog/{slug}",
    orderBy: { column: "published_at", ascending: false },
    fields: [
      title, excerpt, { ...body, label: L("نص المقال", "Article body") },
      { name: "cover_url", kind: "image", label: L("صورة المقال", "Cover image"), tab: "media" },
      { name: "category_id", kind: "relation", label: L("التصنيف", "Category"), relation: { table: "blog_categories", label: "name" }, tab: "settings" },
      { name: "tags", kind: "relation_multi", label: L("الوسوم", "Tags"), relation: { table: "blog_tags", label: "name" }, join: { table: "blog_post_tags", self: "post_id", other: "tag_id" }, tab: "settings" },
      { name: "author_id", kind: "relation", label: L("الكاتب", "Author"), relation: { table: "team_members", label: "name" }, tab: "settings" },
      { name: "published_at", kind: "datetime", label: L("تاريخ النشر", "Publish date"), tab: "settings", help: L("يمكن جدولة النشر بتاريخ مستقبلي", "Set a future date to schedule") },
      { name: "reading_minutes", kind: "number", label: L("مدة القراءة (دقائق)", "Reading time (min)"), tab: "settings" },
      slug, status, featured, seo,
    ],
  },
  {
    key: "blog_categories", table: "blog_categories", label: L("تصنيفات المدونة", "Blog categories"), singular: L("تصنيف", "Category"),
    permission: "blog.manage", titleField: "name", sortable: true, orderBy: { column: "position", ascending: true },
    fields: [name, { name: "description", kind: "textarea", localized: true, label: L("الوصف", "Description") }, slug],
  },
  {
    key: "blog_tags", table: "blog_tags", label: L("الوسوم", "Tags"), singular: L("وسم", "Tag"), permission: "blog.manage",
    titleField: "name", sortable: false, orderBy: { column: "slug", ascending: true }, fields: [name, slug],
  },
  {
    key: "team_members", table: "team_members", label: L("فريق العمل", "Team"), singular: L("عضو", "Member"), permission: "team.manage",
    titleField: "name", subtitleField: "job_title", imageField: "photo_url", sortable: true, visibility: true, orderBy: { column: "position", ascending: true },
    fields: [
      name,
      { name: "job_title", kind: "text", localized: true, label: L("المسمى الوظيفي", "Job title") },
      { name: "bio", kind: "textarea", localized: true, label: L("النبذة التعريفية", "Bio") },
      { name: "photo_url", kind: "image", label: L("الصورة", "Photo"), tab: "media" },
      { name: "skills", kind: "tags", label: L("المهارات", "Skills") },
      { name: "social", kind: "social", label: L("روابط التواصل المهنية", "Professional links") },
      { name: "is_founder", kind: "boolean", label: L("من المؤسسين", "Founder"), tab: "settings" },
      { ...slug, required: false }, visible,
    ],
  },
  {
    key: "testimonials", table: "testimonials", label: L("آراء العملاء", "Testimonials"), singular: L("رأي", "Testimonial"), permission: "testimonials.manage",
    titleField: "author_name", subtitleField: "author_title", imageField: "avatar_url", sortable: true, visibility: true, orderBy: { column: "position", ascending: true },
    fields: [
      { name: "author_name", kind: "text", localized: true, required: true, label: L("اسم العميل", "Client name") },
      { name: "author_title", kind: "text", localized: true, label: L("الشركة أو الصفة", "Company / title") },
      { name: "quote", kind: "textarea", localized: true, required: true, label: L("نص التقييم", "Review text") },
      { name: "rating", kind: "number", label: L("عدد النجوم (1-5)", "Stars (1–5)") },
      { name: "avatar_url", kind: "image", label: L("الصورة", "Photo"), tab: "media" },
      visible,
    ],
  },
  {
    key: "clients", table: "clients", label: L("العملاء والشركاء", "Clients & partners"), singular: L("عميل", "Client"), permission: "clients.manage",
    titleField: "name", imageField: "logo_url", sortable: true, visibility: true, orderBy: { column: "position", ascending: true },
    fields: [
      name,
      { name: "description", kind: "textarea", localized: true, label: L("الوصف", "Description") },
      { name: "logo_url", kind: "image", label: L("الشعار", "Logo"), tab: "media" },
      { name: "website", kind: "url", label: L("رابط الموقع", "Website") },
      visible,
    ],
  },
  {
    key: "pages", table: "pages", label: L("الصفحات", "Pages"), singular: L("صفحة", "Page"), permission: "pages.manage",
    titleField: "title", subtitleField: "summary", sortable: true, status: true, publicPath: "/{slug}", orderBy: { column: "position", ascending: true },
    fields: [
      title,
      { name: "summary", kind: "textarea", localized: true, label: L("الوصف (يظهر في محركات البحث)", "Summary (used for SEO)") },
      { name: "kind", kind: "select", label: L("نوع الصفحة", "Page type"), tab: "settings", options: [
        { value: "custom", label: L("صفحة مخصصة", "Custom page") }, { value: "legal", label: L("صفحة قانونية", "Legal page") }, { value: "system", label: L("صفحة نظام", "System page") },
      ] },
      { name: "show_in_sitemap", kind: "boolean", label: L("تظهر في خريطة الموقع", "Include in sitemap"), tab: "settings" },
      slug, status, seo,
    ],
  },
];

export const RESOURCE_MAP: Record<string, ResourceDef> = Object.fromEntries(RESOURCES.map((r) => [r.key, r]));

export function publicUrl(def: ResourceDef, row: Record<string, unknown>, locale: string) {
  if (!def.publicPath) return null;
  const s = String(row.slug ?? "");
  const map: Record<string, string> = { home: "", about: "/about", services: "/services", projects: "/projects", team: "/team", blog: "/blog", contact: "/contact", request: "/request" };
  if (def.key === "pages" && s in map) return `/${locale}${map[s]}`;
  return `/${locale}${def.publicPath.replace("{slug}", s)}`;
}
