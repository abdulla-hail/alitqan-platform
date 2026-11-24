import { RenderSections } from "@/components/sections/Sections";
import { ContactForm } from "@/components/forms/ContactForm";
import { ContactDetails } from "@/components/site/ContactDetails";
import { SocialLinks } from "@/components/site/SocialLinks";
import { cmsPageMetadata, formStrings, type LocaleParams } from "@/features/site/page-helpers";
import { getPage } from "@/services/content";
import { getSiteContext } from "@/services/site";

export const revalidate = 300;

export async function generateMetadata({ params }: LocaleParams) {
  const { locale } = await params;
  return cmsPageMetadata(locale, "contact", "contact");
}

export default async function ContactPage({ params }: LocaleParams) {
  const { locale } = await params;
  const [ctx, page] = await Promise.all([getSiteContext(locale), getPage("contact")]);
  const sections = page?.sections ?? [];
  const strings = formStrings(ctx.t);
  return (
    <>
      <RenderSections sections={sections.filter((s) => s.type === "page_header")} ctx={ctx} />
      <section className="section">
        <div className="container-x grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="ink stage h-fit p-6 sm:p-8 lg:sticky lg:top-28 lg:col-span-5">
            <div className="bg-measure pointer-events-none absolute inset-0 -z-10 opacity-25" aria-hidden />
            <h2 className="text-2xl font-bold">{ctx.t("footer.contact")}</h2>
            <div className="mt-6 [&_.card]:!bg-white/5"><ContactDetails ctx={ctx} compact /></div>
            <SocialLinks social={ctx.settings.social ?? {}} className="mt-6" />
          </div>
          <div className="lg:col-span-7">
            <h2 className="mb-6 text-2xl font-bold">{ctx.t("contact.form_title")}</h2>
            <ContactForm t={strings} locale={locale} />
          </div>
        </div>
      </section>
      <RenderSections sections={sections.filter((s) => s.type !== "page_header")} ctx={ctx} />
    </>
  );
}
