import { notFound } from "next/navigation";
import { RenderSections } from "@/components/sections/Sections";
import { cmsPageMetadata, type LocaleParams } from "@/features/site/page-helpers";
import { getPage } from "@/services/content";
import { getSiteContext } from "@/services/site";

export const revalidate = 300;

export async function generateMetadata({ params }: LocaleParams) {
  const { locale } = await params;
  return cmsPageMetadata(locale, "home", "");
}

export default async function HomePage({ params }: LocaleParams) {
  const { locale } = await params;
  const [ctx, page] = await Promise.all([getSiteContext(locale), getPage("home")]);
  if (!page) notFound();
  return <RenderSections sections={page.sections} ctx={ctx} />;
}
