-- ALITQAN platform · 0011 redesign v3 (additive / insert-only, never overwrites CMS edits)

-- 1) New interface strings
insert into public.translations (key, locale, value, group_key)
select v.key, v.locale, v.value, split_part(v.key, '.', 1)
from (values
  ('hero.specialized','ar','متخصصون في'), ('hero.specialized','en','Specialists in'),
  ('common.contact_us','ar','تواصل معنا'), ('common.contact_us','en','Contact us'),
  ('services.details','ar','تفاصيل الخدمة'), ('services.details','en','Service details'),
  ('projects.details','ar','تفاصيل المشروع'), ('projects.details','en','Project details'),
  ('stats.rating','ar','متوسط تقييم عملائنا'), ('stats.rating','en','Average client rating'),
  ('common.call','ar','اتصل بنا'), ('common.call','en','Call us')
) as v(key, locale, value)
where exists (select 1 from public.languages l where l.code = v.locale)
on conflict (key, locale) do nothing;

-- 2) A dedicated FAQ page (managed in CMS → Pages) seeded from the homepage FAQ, only if it doesn't exist
do $$
declare pid uuid; faq jsonb;
begin
  if exists (select 1 from public.pages where slug = 'faq') then return; end if;
  if not exists (select 1 from public.pages where slug = 'home') then return; end if; -- fresh install: the seed creates it
  select ps.content into faq from public.page_sections ps join public.pages p on p.id = ps.page_id
  where p.slug = 'home' and ps.type = 'faq' order by ps.position limit 1;
  insert into public.pages (slug, kind, title, summary, status, position)
  values ('faq', 'custom', '{"ar":"الأسئلة الشائعة","en":"FAQ"}', '{"ar":"إجابات واضحة عن خدمات إتقان وطريقة العمل.","en":"Clear answers about ALITQAN services and how we work."}', 'published', 50)
  returning id into pid;
  insert into public.page_sections (page_id, type, position, content, settings) values
    (pid, 'page_header', 0, '{"eyebrow":{"ar":"مركز المساعدة","en":"Help centre"},"title":{"ar":"الأسئلة الشائعة","en":"Frequently asked questions"},"subtitle":{"ar":"كل ما تحتاج معرفته قبل بدء مشروعك.","en":"Everything you need to know before starting your project."}}', '{}');
  if faq is not null then
    insert into public.page_sections (page_id, type, position, content, settings) values (pid, 'faq', 1, faq, '{}');
  end if;
  insert into public.page_sections (page_id, type, position, content, settings) values
    (pid, 'cta', 2, '{"title":{"ar":"لم تجد إجابتك؟","en":"Didn''t find your answer?"},"subtitle":{"ar":"فريقنا جاهز للإجابة عن أسئلتك.","en":"Our team is ready to help."},"primary_label":{"ar":"تواصل معنا","en":"Contact us"},"primary_href":"/contact"}', '{"background":"brand"}');
  if not exists (select 1 from public.navigation_items where href = '/faq') then
    insert into public.navigation_items (menu, label, href, position) values ('footer_bottom', '{"ar":"الأسئلة الشائعة","en":"FAQ"}', '/faq', 0);
  end if;
end $$;
