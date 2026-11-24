-- ALITQAN platform · 0009 copy fix: the home "process" section now has six steps (0008).
-- Only updates the title if it is still the original seeded text (never overwrites CMS edits).
update public.page_sections ps
set content = jsonb_set(content, '{title}', '{"ar":"من الفكرة إلى الإطلاق بخطوات واضحة","en":"From idea to launch, in clear steps"}'::jsonb)
from public.pages p
where p.id = ps.page_id and p.slug = 'home' and ps.type = 'process'
  and ps.content->'title'->>'ar' = 'أربع خطوات واضحة من الفكرة إلى الإطلاق';
