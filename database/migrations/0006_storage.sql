-- ALITQAN platform · 0006 Supabase Storage buckets and policies
-- media: public CDN bucket for site images/documents (writes need media.manage)
-- request-attachments: PRIVATE bucket for files sent with project requests. Visitors upload
-- only through short-lived signed upload URLs issued by the server; staff read via signed URLs.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('media', 'media', true, 10485760,
   array['image/jpeg','image/png','image/webp','image/avif','image/gif','image/svg+xml','application/pdf',
         'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
         'video/mp4']),
  ('request-attachments', 'request-attachments', false, 10485760,
   array['image/jpeg','image/png','image/webp','application/pdf','application/zip','application/x-zip-compressed',
         'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
         'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
         'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation',
         'text/plain'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "media public read" on storage.objects for select using (bucket_id = 'media');
create policy "media staff insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.has_permission('media.manage'));
create policy "media staff update" on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.has_permission('media.manage'));
create policy "media staff delete" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.has_permission('media.manage'));

create policy "attachments staff read" on storage.objects for select to authenticated
  using (bucket_id = 'request-attachments' and public.has_permission('inbox.view'));
create policy "attachments staff delete" on storage.objects for delete to authenticated
  using (bucket_id = 'request-attachments' and public.has_permission('inbox.delete'));
