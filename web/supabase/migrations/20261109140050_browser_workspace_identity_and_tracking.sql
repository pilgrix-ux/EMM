-- Browser-only workspace identities for Pilgrix Ads Studio.
-- Workspace tokens are random 256-bit values held in an HttpOnly browser cookie.
-- Only SHA-256 hashes are stored in Postgres.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

create table if not exists private.workspace_visitors (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '365 days')
);

create index if not exists workspace_visitors_last_seen_idx
  on private.workspace_visitors (last_seen_at desc);

alter table private.workspace_visitors enable row level security;
revoke all on private.workspace_visitors from public, anon, authenticated;

alter table public.ad_projects
  alter column user_id drop not null;

alter table public.ad_projects
  add column if not exists visitor_id uuid
  references private.workspace_visitors(id) on delete cascade;

create index if not exists ad_projects_visitor_created_idx
  on public.ad_projects (visitor_id, created_at desc);

create table if not exists private.workspace_events (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid not null references private.workspace_visitors(id) on delete cascade,
  project_id uuid references public.ad_projects(id) on delete set null,
  event_name text not null check (event_name in (
    'workspace_started',
    'project_created',
    'video_uploaded',
    'ad_plan_generated',
    'render_started',
    'render_completed',
    'render_failed',
    'video_downloaded'
  )),
  properties jsonb not null default '{}'::jsonb
    check (jsonb_typeof(properties) = 'object'),
  created_at timestamptz not null default now()
);

create index if not exists workspace_events_visitor_created_idx
  on private.workspace_events (visitor_id, created_at desc);
create index if not exists workspace_events_name_created_idx
  on private.workspace_events (event_name, created_at desc);
create index if not exists workspace_events_project_idx
  on private.workspace_events (project_id);

alter table private.workspace_events enable row level security;
revoke all on private.workspace_events from public, anon, authenticated;

create or replace function private.current_workspace_visitor_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $function$
  select visitor.id
  from private.workspace_visitors as visitor
  where visitor.token_hash = encode(
    extensions.digest(
      convert_to(
        coalesce(
          nullif(current_setting('request.headers', true), '')::jsonb ->> 'x-workspace-token',
          ''
        ),
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  )
  and visitor.expires_at > now()
  limit 1;
$function$;

revoke all on function private.current_workspace_visitor_id() from public;
grant execute on function private.current_workspace_visitor_id() to anon, authenticated;

create or replace function public.register_workspace_visitor(p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_visitor_id uuid;
  v_token_digest text;
begin
  if p_token is null
    or length(p_token) <> 43
    or p_token !~ '^[A-Za-z0-9_-]{43}$'
  then
    raise exception 'A valid browser workspace key is required'
      using errcode = '22023';
  end if;

  v_token_digest := encode(
    extensions.digest(convert_to(p_token, 'UTF8'), 'sha256'),
    'hex'
  );

  insert into private.workspace_visitors (token_hash, last_seen_at, expires_at)
  values (v_token_digest, now(), now() + interval '365 days')
  on conflict (token_hash)
  do update set
    last_seen_at = case
      when private.workspace_visitors.last_seen_at < now() - interval '5 minutes'
      then now()
      else private.workspace_visitors.last_seen_at
    end,
    expires_at = now() + interval '365 days'
  returning id into v_visitor_id;

  return v_visitor_id;
end;
$function$;

revoke all on function public.register_workspace_visitor(text) from public, anon, authenticated;
grant execute on function public.register_workspace_visitor(text) to service_role;

create or replace function public.track_workspace_event(
  p_token text,
  p_event_name text,
  p_project_id uuid default null,
  p_properties jsonb default '{}'::jsonb
)
returns void language plpgsql security definer set search_path = ''
as $function$
declare
  v_visitor_id uuid;
  v_token_digest text;
begin
  if p_token is null or length(p_token) <> 43
     or p_token !~ '^[A-Za-z0-9_-]{43}$' then
    raise exception 'A valid browser workspace key is required' using errcode = '22023';
  end if;

  v_token_digest := encode(
    extensions.digest(convert_to(p_token, 'UTF8'), 'sha256'),
    'hex'
  );

  select visitor.id into v_visitor_id
  from private.workspace_visitors as visitor
  where visitor.token_hash = v_token_digest
    and visitor.expires_at > now()
  limit 1;

  if v_visitor_id is null then
    raise exception 'Workspace key is missing or expired' using errcode = '28000';
  end if;

  if p_event_name not in (
    'workspace_started','project_created','video_uploaded','ad_plan_generated',
    'render_started','render_completed','render_failed','video_downloaded'
  ) then
    raise exception 'Unsupported workspace event' using errcode = '22023';
  end if;

  if p_properties is null or jsonb_typeof(p_properties) <> 'object'
     or pg_column_size(p_properties) > 5000 then
    raise exception 'Event properties must be a small JSON object'
      using errcode = '22023';
  end if;

  if p_project_id is not null and not exists (
    select 1 from public.ad_projects as project
    where project.id = p_project_id and project.visitor_id = v_visitor_id
  ) then
    raise exception 'Project does not belong to this workspace' using errcode = '42501';
  end if;

  insert into private.workspace_events (visitor_id, project_id, event_name, properties)
  values (v_visitor_id, p_project_id, p_event_name, p_properties);

  update private.workspace_visitors
  set last_seen_at = case
    when last_seen_at < now() - interval '5 minutes' then now()
    else last_seen_at end,
    expires_at = now() + interval '365 days'
  where id = v_visitor_id;
end;
$function$;

revoke all on function public.track_workspace_event(text, text, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.track_workspace_event(text, text, uuid, jsonb) to service_role;

grant select, insert, update, delete on public.ad_projects to anon;

drop policy if exists "Browser workspaces can view their own ad projects" on public.ad_projects;
create policy "Browser workspaces can view their own ad projects"
  on public.ad_projects
  for select
  to anon
  using (visitor_id = (select private.current_workspace_visitor_id()));

drop policy if exists "Browser workspaces can create their own ad projects" on public.ad_projects;
create policy "Browser workspaces can create their own ad projects"
  on public.ad_projects
  for insert
  to anon
  with check (
    visitor_id = (select private.current_workspace_visitor_id())
    and user_id is null
  );

drop policy if exists "Browser workspaces can update their own ad projects" on public.ad_projects;
create policy "Browser workspaces can update their own ad projects"
  on public.ad_projects
  for update
  to anon
  using (visitor_id = (select private.current_workspace_visitor_id()))
  with check (
    visitor_id = (select private.current_workspace_visitor_id())
    and user_id is null
  );

drop policy if exists "Browser workspaces can delete their own ad projects" on public.ad_projects;
create policy "Browser workspaces can delete their own ad projects"
  on public.ad_projects
  for delete
  to anon
  using (visitor_id = (select private.current_workspace_visitor_id()));
