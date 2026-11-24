-- ALITQAN platform · 0013 hero particle effect settings (insert-only, never overwrites)
-- Published settings are public (the homepage reads them); the draft is private:
-- the existing policy site_settings_read only exposes rows where is_public = true
-- (or to users with settings.manage), and writes already require settings.manage.
-- Empty values mean "use the built-in defaults" (src/lib/hero-effect.ts).

insert into public.site_settings (key, value, is_public)
values ('hero_effect', '{}'::jsonb, true),
       ('hero_effect_draft', '{}'::jsonb, false)
on conflict (key) do nothing;

-- the draft must never be public, even if a row was created by hand before this migration
update public.site_settings set is_public = false where key = 'hero_effect_draft' and is_public;
