import {
  AppWindow, Award, BadgeCheck, BarChart3, BookOpen, Bot, Boxes, ClipboardCheck, Clock, Code2, Compass, Database, Eye, FileText,
  FolderKanban, Gauge, Gem, Globe, Handshake, Heading, HeartHandshake, HelpCircle, Layers, LayoutGrid, LineChart, ListOrdered, Map,
  Megaphone, MessageSquare, MousePointerClick, Newspaper, Palette, PanelsLeftRight, PenTool, Phone, Plug, Quote, Repeat, Rocket, Ruler,
  Search, ServerCog, Shapes, ShieldCheck, ShoppingBag, Smartphone, Sparkles, Target, Users, Workflow, Zap,
  type LucideIcon, type LucideProps,
} from "lucide-react";

/** Icons that can be chosen in the CMS (stored by name). Keep in sync with ICON_CHOICES. */
export const ICONS: Record<string, LucideIcon> = {
  AppWindow, Award, BadgeCheck, BarChart3, BookOpen, Bot, Boxes, ClipboardCheck, Clock, Code2, Compass, Database, Eye, FileText,
  FolderKanban, Gauge, Gem, Globe, Handshake, Heading, HeartHandshake, HelpCircle, Layers, LayoutGrid, LineChart, ListOrdered, Map,
  Megaphone, MessageSquare, MousePointerClick, Newspaper, Palette, PanelsLeftRight, PenTool, Phone, Plug, Quote, Repeat, Rocket, Ruler,
  Search, ServerCog, Shapes, ShieldCheck, ShoppingBag, Smartphone, Sparkles, Target, Users, Workflow, Zap,
};

/** Renders a CMS-selected icon by name; unknown names fall back to the brand rhombus. */
export function Icon({ name, ...props }: { name?: string | null } & Omit<LucideProps, "name">) {
  const C = name ? ICONS[name] : undefined;
  if (!C) return <span className="rhombus" aria-hidden />;
  return <C aria-hidden strokeWidth={1.6} {...props} />;
}
