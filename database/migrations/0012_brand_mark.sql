-- ALITQAN platform · 0012 official mark (additive; only replaces values still at their old defaults)

-- 1) Logo system settings (colours of the vector mark, variant per background, name display)
alter table public.brand_settings add column if not exists logo_system jsonb not null default '{}';

-- 2) Allow the new "mark" logo mode (the vector redraw of the official logo)
alter table public.brand_settings drop constraint if exists brand_settings_logo_mode_check;
alter table public.brand_settings add constraint brand_settings_logo_mode_check
  check (logo_mode in ('mark','builtin','symbol_text','uploaded'));

-- 3) Switch from the previous built-in mark to the official one (uploaded logos are left untouched)
update public.brand_settings set logo_mode = 'mark' where id = 1 and logo_mode = 'builtin';

-- 4) Blue palette that matches the mark — only when the site still uses the untouched seed palette.
--    The previous palette is kept in logo_system.previous_colors so it can be restored from the CMS.
update public.brand_settings
set logo_system = coalesce(logo_system, '{}'::jsonb) || jsonb_build_object('previous_colors', colors),
    colors = '{
      "light": {"primary":"#0756D8","secondary":"#022A7C","accent":"#00B4EE","background":"#F7F9FD","surface":"#FFFFFF","foreground":"#0A1433","muted":"#56627A","border":"#E0E6F1"},
      "dark":  {"primary":"#4D94FF","secondary":"#8DB2FF","accent":"#2BD4FF","background":"#070B1A","surface":"#0E1430","foreground":"#E9EEFA","muted":"#96A1BE","border":"#1F2A4A"}
    }'::jsonb
where id = 1
  and upper(colors #>> '{light,primary}') = '#0B5D50'
  and upper(colors #>> '{light,accent}') = '#C9963B'
  and not (logo_system ? 'previous_colors');
