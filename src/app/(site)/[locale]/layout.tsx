import "../../globals.css";
import type { Metadata, Viewport } from "next";
import { redirect } from "next/navigation";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ThemeScript } from "@/components/theme/ThemeScript";
import { SetupNotice } from "@/components/site/SetupNotice";
import { MotionRuntime } from "@/components/motion/MotionRuntime";
import { brandCss, fontStacks, fontsHref } from "@/lib/brand/theme";
import { motionHtmlAttrs } from "@/lib/motion";
import { getSiteContext, getLanguages, SetupRequiredError } from "@/services/site";
import { buildMetadata, organizationJsonLd } from "@/lib/seo";

export const revalidate = 300;
export const dynamicParams = true;
export async function generateStaticParams() {
  return []; // render on first request, then cache (ISR); CMS saves revalidate instantly
}

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF8F4" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1215" },
  ],
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  try {
    const ctx = await getSiteContext(locale);
    return buildMetadata(ctx, { path: "" });
  } catch {
    return { title: "ALITQAN" };
  }
}

export default async function SiteLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  let languages;
  try {
    languages = await getLanguages();
  } catch (e) {
    if (e instanceof SetupRequiredError) {
      return (
        <html lang="en" dir="ltr">
          <body><SetupNotice message={e.message} /></body>
        </html>
      );
    }
    throw e;
  }
  if (!languages.some((l) => l.code === locale)) {
    const def = languages.find((l) => l.is_default) ?? languages[0];
    redirect(`/${def?.code ?? "ar"}`);
  }
  const ctx = await getSiteContext(locale);
  const fonts = fontStacks(ctx.brand, ctx.dir);
  const fontHref = fontsHref(fonts, ctx.customFonts);
  const motion = motionHtmlAttrs(ctx.settings.motion);
  const ga = /^G-[A-Z0-9]{4,15}$/.test(ctx.settings.analytics?.ga_id ?? "") ? (ctx.settings.analytics.ga_id as string) : null;
  return (
    <html lang={ctx.locale} dir={ctx.dir} suppressHydrationWarning {...motion}>
      <head>
        <ThemeScript defaultTheme={ctx.brand?.default_theme ?? "system"} />
        {fontHref && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
            <link rel="stylesheet" href={fontHref} />
          </>
        )}
        <style id="brand-tokens" dangerouslySetInnerHTML={{ __html: brandCss(ctx.brand, ctx.dir, { customFonts: ctx.customFonts }) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd(ctx)).replace(/</g, "\\u003c") }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <div className="scroll-progress" aria-hidden />
        <Header ctx={ctx} />
        <main id="main" className="flex-1">{children}</main>
        <Footer ctx={ctx} />
        <MotionRuntime />
        {ga && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} />
            <script dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date());gtag("config","${ga}",{anonymize_ip:true});` }} />
          </>
        )}
      </body>
    </html>
  );
}
