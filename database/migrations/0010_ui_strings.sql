-- ALITQAN platform · 0010 interface strings for the redesign (insert only if missing)
insert into public.translations (key, locale, value, group_key)
select v.key, v.locale, v.value, split_part(v.key, '.', 1)
from (values
  ('common.services','ar','خدماتنا'), ('common.services','en','What we do'),
  ('footer.cta_title','ar','لديك فكرة؟ لنصنعها بإتقان.'), ('footer.cta_title','en','Have an idea? Let''s build it precisely.'),
  ('footer.cta_button','ar','ابدأ مشروعك'), ('footer.cta_button','en','Start a project'),
  ('footer.back_to_top','ar','للأعلى'), ('footer.back_to_top','en','Back to top')
) as v(key, locale, value)
where exists (select 1 from public.languages l where l.code = v.locale)
on conflict (key, locale) do nothing;
