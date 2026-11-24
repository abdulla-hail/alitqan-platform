import { RenderSections } from "@/components/sections/Sections";
import { SectionHeading, TeamCard } from "@/components/site/cards";
import { Reveal } from "@/components/ui/Reveal";
import { cmsPageMetadata, type LocaleParams } from "@/features/site/page-helpers";
import { getPage, getTeam } from "@/services/content";
import { getSiteContext } from "@/services/site";

export const revalidate = 300;

export async function generateMetadata({ params }: LocaleParams) {
  const { locale } = await params;
  return cmsPageMetadata(locale, "team", "team");
}

export default async function TeamPage({ params }: LocaleParams) {
  const { locale } = await params;
  const [ctx, page, team] = await Promise.all([getSiteContext(locale), getPage("team"), getTeam()]);
  const founders = team.filter((m) => m.is_founder);
  const members = team.filter((m) => !m.is_founder);
  const sections = page?.sections ?? [];
  return (
    <>
      <RenderSections sections={sections.filter((s) => s.type === "page_header")} ctx={ctx} />
      {[{ title: ctx.t("team.founders"), list: founders }, { title: ctx.t("team.members"), list: members }].filter((g) => g.list.length).map((g, gi) => (
        <section key={g.title} className={`section ${gi ? "bg-softer" : ""}`}>
          <div className="container-x">
            <SectionHeading title={g.title} />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {g.list.map((m, i) => <Reveal key={m.id} delay={(i % 4) * 70}><TeamCard member={m} ctx={ctx} /></Reveal>)}
            </div>
          </div>
        </section>
      ))}
      <RenderSections sections={sections.filter((s) => s.type !== "page_header")} ctx={ctx} />
    </>
  );
}
