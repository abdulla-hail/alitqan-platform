/** A translatable value: { ar: "...", en: "..." } — keyed by language code. */
export type Localized = Record<string, string | undefined>;
export type Status = "draft" | "published" | "archived";
export type Seo = Record<string, { title?: string; description?: string; image?: string } | undefined>;

export interface Language {
  code: string;
  name: string;
  native_name: string;
  dir: "rtl" | "ltr";
  is_enabled: boolean;
  is_default: boolean;
  position: number;
}

export interface Palette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  foreground: string;
  muted: string;
  border: string;
}

export interface LogoSystem {
  colors?: Partial<{ dark: string; deep: string; primary: string; bright: string; mono: string }>;
  /** variant used on light surfaces */
  on_light?: "color" | "dark" | "mono";
  /** variant used on dark surfaces (dark theme, ink sections) */
  on_dark?: "light" | "white" | "color" | "mono";
  /** show the brand name as text beside the mark */
  show_name?: boolean;
  previous_colors?: unknown;
}

export interface BrandSettings {
  name: Localized;
  tagline: Localized;
  description: Localized;
  logo_mode: "mark" | "builtin" | "symbol_text" | "uploaded";
  /** official vector mark settings (colours, variant per background) — see lib/brand/mark.ts */
  logo_system?: LogoSystem | null;
  logo_url: string | null;
  logo_dark_url: string | null;
  logo_alt_url: string | null;
  symbol_url: string | null;
  favicon_url: string | null;
  og_image_url: string | null;
  colors: { light: Palette; dark: Palette };
  fonts: import("@/lib/brand/fonts").Typography;
  radius: string;
  backgrounds: Record<string, string>;
  default_theme: "light" | "dark" | "system";
  updated_at?: string;
}

export interface NavItem {
  id: string;
  menu: "header" | "footer" | "footer_bottom";
  parent_id: string | null;
  label: Localized;
  href: string;
  new_tab: boolean;
  is_visible: boolean;
  position: number;
  children?: NavItem[];
}

export interface PageSection {
  id: string;
  page_id: string;
  type: string;
  label: string | null;
  position: number;
  is_visible: boolean;
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
}

export interface Page {
  id: string;
  slug: string;
  kind: "system" | "custom" | "legal";
  title: Localized;
  summary: Localized;
  status: Status;
  seo: Seo;
  show_in_sitemap: boolean;
  updated_at: string;
  published_at: string | null;
  sections?: PageSection[];
}

export interface ServiceCategory {
  id: string;
  slug: string;
  name: Localized;
  description: Localized;
  icon: string | null;
  position: number;
}

export interface TextItem { icon?: string; title?: Localized; text?: Localized }
export interface FaqItem { question: Localized; answer: Localized }

export interface Service {
  id: string;
  slug: string;
  category_id: string | null;
  title: Localized;
  excerpt: Localized;
  body: Localized;
  icon: string | null;
  image_url: string | null;
  features: TextItem[];
  steps: TextItem[];
  faqs: FaqItem[];
  technologies: string[];
  related_ids: string[];
  status: Status;
  is_featured: boolean;
  position: number;
  seo: Seo;
  updated_at: string;
}

export interface ProjectCategory { id: string; slug: string; name: Localized; position: number }

export interface Project {
  id: string;
  slug: string;
  category_id: string | null;
  title: Localized;
  excerpt: Localized;
  body: Localized;
  challenge: Localized;
  solution: Localized;
  results: Localized;
  metrics: { value: string; label: Localized }[];
  client_name: Localized;
  project_type: Localized;
  cover_url: string | null;
  thumbnail_url?: string | null;
  mobile_image_url?: string | null;
  cover_alt?: Localized;
  show_on_home?: boolean;
  home_position?: number;
  slider_link?: string | null;
  link_target?: "_self" | "_blank";
  completed_on: string | null;
  technologies: string[];
  live_url: string | null;
  status: Status;
  is_featured: boolean;
  position: number;
  seo: Seo;
  updated_at: string;
  project_images?: { id: string; url: string; alt: Localized; position: number }[];
  project_services?: { service_id: string }[];
}

export interface TeamMember {
  id: string;
  slug: string | null;
  name: Localized;
  job_title: Localized;
  bio: Localized;
  photo_url: string | null;
  skills: string[];
  social: Record<string, string>;
  is_founder: boolean;
  position: number;
}

export interface BlogCategory { id: string; slug: string; name: Localized; description: Localized }
export interface BlogTag { id: string; slug: string; name: Localized }
export interface BlogPost {
  id: string;
  slug: string;
  category_id: string | null;
  author_id: string | null;
  title: Localized;
  excerpt: Localized;
  body: Localized;
  cover_url: string | null;
  reading_minutes: number | null;
  status: Status;
  is_featured: boolean;
  published_at: string | null;
  seo: Seo;
  updated_at: string;
  author?: TeamMember | null;
  category?: BlogCategory | null;
  blog_post_tags?: { tag: BlogTag }[];
}

export interface Testimonial {
  id: string;
  author_name: Localized;
  author_title: Localized;
  avatar_url: string | null;
  quote: Localized;
  rating: number;
}

export interface Client { id: string; name: Localized; description: Localized; logo_url: string | null; website: string | null }
