import "../../globals.css";
import type { Metadata, Viewport } from "next";
import { ThemeScript } from "@/components/theme/ThemeScript";
import { MotionRuntime } from "@/components/motion/MotionRuntime";
import { SetupNotice } from "@/components/site/SetupNotice";
import { brandCss, fontStacks, fontsHref } from "@/lib/brand/theme";
import type { CustomFont } from "@/lib/brand/fonts";
import { getAdminLocale } from "@/lib/admin-context";
import { isSupabaseConfigured } from "@/lib/env";
import { motionHtmlAttrs } from "@/lib/motion";
import { createPublicClient } from "@/lib/supabase/clients";
import type { BrandSettings } from "@/types/content";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "CMS", robots: { index: false, follow: false }, icons: { icon: "/icon.svg" } };
export const viewport: Viewport = { viewportFit: "cover" };

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getAdminLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";
  if (!isSupabaseConfigured()) {
    return (<html lang="en"><body><SetupNotice /></body></html>);
  }
  const sb = createPublicClient();
  const [{ data: brand }, { data: fonts }, { data: motionRow }] = await Promise.all([
    sb.from("brand_settings").select("*").eq("id", 1).maybeSingle(),
    sb.from("custom_fonts").select("family,script,files").eq("is_active", true),
    sb.from("site_settings").select("value").eq("key", "motion").maybeSingle(),
  ]);
  const custom = (fonts ?? []) as CustomFont[];
  // The CMS uses the "admin font" from Typography Settings for all text.
  const stacks = fontStacks(brand as BrandSettings | null, dir, "admin");
  const href = fontsHref(stacks, custom);
  // CMS keeps reveals/hover but never page-level parallax.
  const motion = motionHtmlAttrs({ ...(motionRow?.value ?? {}), parallax: false });
  return (
    <html lang={locale} dir={dir} suppressHydrationWarning {...motion}>
      <head>
        <ThemeScript defaultTheme="system" />
        {href && <link rel="stylesheet" href={href} />}
        <style dangerouslySetInnerHTML={{ __html: brandCss(brand as BrandSettings | null, dir, { scope: "admin", customFonts: custom }) }} />
      </head>
      <body>
        {children}
        <MotionRuntime />
      </body>
    </html>
  );
}
