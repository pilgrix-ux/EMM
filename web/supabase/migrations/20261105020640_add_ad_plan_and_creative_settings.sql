alter table public.ad_projects
  add column if not exists ad_plan jsonb,
  add column if not exists creative_settings jsonb not null default '{}'::jsonb,
  add column if not exists ad_plan_approved_at timestamptz;

comment on column public.ad_projects.ad_plan is
  'Structured AI-generated advertising plan reviewed and editable by the project owner.';
comment on column public.ad_projects.creative_settings is
  'Selected platform, aspect ratio, duration, language, style, captions, voiceover, and music settings.';
