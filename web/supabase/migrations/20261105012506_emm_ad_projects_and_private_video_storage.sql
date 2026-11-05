create table public.ad_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled ad',
  status text not null default 'draft'
    check (status in ('draft', 'plan_pending', 'plan_ready', 'render_queued', 'rendering', 'complete', 'failed')),
  source_video_path text,
  source_video_name text,
  source_video_mime_type text,
  source_video_size_bytes bigint check (source_video_size_bytes is null or source_video_size_bytes >= 0),
  product_name text not null,
  product_benefit text not null,
  audience text,
  ad_goal text,
  platform text,
  aspect_ratio text,
  target_duration_seconds integer check (target_duration_seconds is null or target_duration_seconds > 0),
  language text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ad_projects_user_created_idx
  on public.ad_projects (user_id, created_at desc);

alter table public.ad_projects enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.ad_projects to authenticated;

create policy "Users can view their own ad projects"
  on public.ad_projects
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own ad projects"
  on public.ad_projects
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own ad projects"
  on public.ad_projects
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own ad projects"
  on public.ad_projects
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.set_ad_projects_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_ad_projects_updated_at
  before update on public.ad_projects
  for each row
  execute function public.set_ad_projects_updated_at();

insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
)
values (
  'emm-source-videos',
  'emm-source-videos',
  false,
  104857600,
  array['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v', 'video/3gpp']
);

create policy "Users can view their own EMM source videos"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'emm-source-videos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can upload their own EMM source videos"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'emm-source-videos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can update their own EMM source videos"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'emm-source-videos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'emm-source-videos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can delete their own EMM source videos"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'emm-source-videos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
